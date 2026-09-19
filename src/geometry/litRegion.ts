import type { BuiltScene, Point, Rect, RoomBounds } from './types.ts'
import {
  evaluateVisibility,
  isInFront,
  sampleEmitPoints,
} from './visibility.ts'

export const ROOM_DEPTH_MIN = 2500
export const ROOM_CEILING_PAD = 200
const FAN_RAY_COUNT = 32
const HIT_EPS = 1e-6
const CHORD_EPS = 0.05
const MIN_WEDGE_SPAN = 1e-4
const MAX_WEDGE_SPLITS = 16

export function roomBounds(scene: BuiltScene): RoomBounds {
  return {
    minX: 0,
    maxX: Math.max(ROOM_DEPTH_MIN, scene.upper.width, scene.lower.width),
    minY: scene.floorY,
    maxY: scene.upper.y + scene.upper.height + ROOM_CEILING_PAD,
  }
}

function roomRect(bounds: RoomBounds): Rect {
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  }
}

function rayAabb(
  origin: Point,
  dir: Point,
  rect: Rect,
): { tEnter: number; tExit: number } | null {
  if (rect.width <= 0 || rect.height <= 0) return null
  let tEnter = Number.NEGATIVE_INFINITY
  let tExit = Number.POSITIVE_INFINITY
  const slabs = [
    { o: origin.x, d: dir.x, min: rect.x, max: rect.x + rect.width },
    { o: origin.y, d: dir.y, min: rect.y, max: rect.y + rect.height },
  ]
  for (const { o, d, min, max } of slabs) {
    if (Math.abs(d) < HIT_EPS) {
      if (o < min - HIT_EPS || o > max + HIT_EPS) return null
      continue
    }
    const t0 = (min - o) / d
    const t1 = (max - o) / d
    const near = Math.min(t0, t1)
    const far = Math.max(t0, t1)
    tEnter = Math.max(tEnter, near)
    tExit = Math.min(tExit, far)
    if (tEnter > tExit + HIT_EPS) return null
  }
  return { tEnter, tExit }
}

export function firstHitOnRay(
  origin: Point,
  direction: Point,
  occluders: readonly Rect[],
  bounds: RoomBounds,
): Point | null {
  const length = Math.hypot(direction.x, direction.y)
  if (length < HIT_EPS) return null
  const dir = { x: direction.x / length, y: direction.y / length }
  const roomHit = rayAabb(origin, dir, roomRect(bounds))
  let best = roomHit && roomHit.tExit > HIT_EPS ? roomHit.tExit : Number.POSITIVE_INFINITY
  for (const rect of occluders) {
    const hit = rayAabb(origin, dir, rect)
    if (!hit || hit.tExit <= HIT_EPS) continue
    const enter = hit.tEnter > 0 ? hit.tEnter : 0
    if (enter < best) best = enter
  }
  if (!Number.isFinite(best)) return null
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, origin.x + dir.x * best)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, origin.y + dir.y * best)),
  }
}

function rectCorners(rect: Rect): Point[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ]
}

function wrapAngle(angle: number): number {
  let next = angle
  while (next <= -Math.PI) next += 2 * Math.PI
  while (next > Math.PI) next -= 2 * Math.PI
  return next
}

function fanAngles(
  from: Point,
  normal: Point,
  occluders: readonly Rect[],
  bounds: RoomBounds,
): number[] {
  const base = Math.atan2(normal.y, normal.x)
  // Stay strictly inside the emit half-plane: the exact horizon has a zero
  // front-test and used to drop the shallow wedge along a shelf underside.
  const half = Math.PI / 2 - 1e-4
  const angles = new Set<number>()
  for (let i = 0; i <= FAN_RAY_COUNT; i += 1) {
    angles.add(base - half + (2 * half * i) / FAN_RAY_COUNT)
  }
  const targets = [
    ...occluders.flatMap(rectCorners),
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY },
  ]
  const angleEps = 1e-4
  for (const target of targets) {
    const dx = target.x - from.x
    const dy = target.y - from.y
    if (Math.hypot(dx, dy) < HIT_EPS) continue
    const angle = Math.atan2(dy, dx)
    const relative = wrapAngle(angle - base)
    if (relative < -half || relative > half) continue
    for (const delta of [-angleEps, 0, angleEps]) angles.add(angle + delta)
  }
  return [...angles].sort(
    (left, right) => wrapAngle(left - base) - wrapAngle(right - base),
  )
}

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function pointStrictlyInTriangle(
  point: Point,
  a: Point,
  b: Point,
  c: Point,
): boolean {
  const ab = orient(a, b, point)
  const bc = orient(b, c, point)
  const ca = orient(c, a, point)
  return (
    (ab > HIT_EPS && bc > HIT_EPS && ca > HIT_EPS) ||
    (ab < -HIT_EPS && bc < -HIT_EPS && ca < -HIT_EPS)
  )
}

function triangleSkipsOccluder(
  from: Point,
  a: Point,
  b: Point,
  occluders: readonly Rect[],
): boolean {
  return occluders.some((rect) =>
    rectCorners(rect).some((corner) =>
      pointStrictlyInTriangle(corner, from, a, b),
    ),
  )
}

function pointToSegmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < HIT_EPS) return Math.hypot(point.x - a.x, point.y - a.y)
  const u = Math.min(
    1,
    Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2),
  )
  return Math.hypot(point.x - (a.x + u * dx), point.y - (a.y + u * dy))
}

function emitWedge(
  from: Point,
  angleA: number,
  hitA: Point,
  angleB: number,
  hitB: Point,
  occluders: readonly Rect[],
  bounds: RoomBounds,
  region: Point[][],
  depth: number,
): void {
  if (Math.abs(orient(from, hitA, hitB)) < HIT_EPS) return
  const delta = wrapAngle(angleB - angleA)
  const span = Math.abs(delta)
  if (span < MIN_WEDGE_SPAN || depth >= MAX_WEDGE_SPLITS) {
    if (triangleSkipsOccluder(from, hitA, hitB, occluders)) return
    region.push([from, hitA, hitB])
    return
  }
  const mid = angleA + delta / 2
  const hitM = firstHitOnRay(
    from,
    { x: Math.cos(mid), y: Math.sin(mid) },
    occluders,
    bounds,
  )
  if (hitM === null) return
  if (pointToSegmentDistance(hitM, hitA, hitB) <= CHORD_EPS) {
    region.push([from, hitA, hitB])
    return
  }
  emitWedge(from, angleA, hitA, mid, hitM, occluders, bounds, region, depth + 1)
  emitWedge(from, mid, hitM, angleB, hitB, occluders, bounds, region, depth + 1)
}

function pointOnSegment(point: Point, a: Point, b: Point): boolean {
  const cross =
    (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y)
  if (Math.abs(cross) > 1e-4) return false
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)
  if (dot < -HIT_EPS) return false
  const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  return dot <= len2 + HIT_EPS
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[j]
    const b = polygon[i]
    if (a && b && pointOnSegment(point, a, b)) return true
  }
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[j]
    const b = polygon[i]
    if (!a || !b) continue
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

export function pointInLitRegion(region: Point[][], point: Point): boolean {
  return region.some((polygon) => pointInPolygon(point, polygon))
}

export function isDirectlyLit(scene: BuiltScene, point: Point): boolean {
  return evaluateVisibility({ ...scene, eye: point }).hasDirectGlare
}

export function evaluateLitRegion(scene: BuiltScene): Point[][] {
  const bounds = roomBounds(scene)
  const region: Point[][] = []
  for (const surface of scene.emitSurfaces) {
    for (const { from, normal } of sampleEmitPoints(surface)) {
      const angles = fanAngles(from, normal, scene.occluders, bounds)
      const hits = angles.map((angle) => {
        const dir = { x: Math.cos(angle), y: Math.sin(angle) }
        if (!isInFront(from, { x: from.x + dir.x, y: from.y + dir.y }, normal)) {
          return null
        }
        return firstHitOnRay(from, dir, scene.occluders, bounds)
      })
      for (let i = 0; i < angles.length - 1; i += 1) {
        const hitA = hits[i]
        const hitB = hits[i + 1]
        if (!hitA || !hitB) continue
        emitWedge(
          from,
          angles[i],
          hitA,
          angles[i + 1],
          hitB,
          scene.occluders,
          bounds,
          region,
          0,
        )
      }
    }
  }
  return region
}
