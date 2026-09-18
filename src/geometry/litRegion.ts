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
  const angles = new Set<number>()
  for (let i = 0; i <= FAN_RAY_COUNT; i += 1) {
    angles.add(base - Math.PI / 2 + (Math.PI * i) / FAN_RAY_COUNT)
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
    if (relative < -Math.PI / 2 - 1e-6 || relative > Math.PI / 2 + 1e-6) continue
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
      const hits: Array<Point | null> = []
      for (const angle of fanAngles(from, normal, scene.occluders, bounds)) {
        const dir = { x: Math.cos(angle), y: Math.sin(angle) }
        const ahead = { x: from.x + dir.x, y: from.y + dir.y }
        if (!isInFront(from, ahead, normal)) {
          hits.push(null)
          continue
        }
        hits.push(firstHitOnRay(from, dir, scene.occluders, bounds))
      }
      for (let i = 0; i < hits.length - 1; i += 1) {
        const a = hits[i]
        const b = hits[i + 1]
        if (!a || !b) continue
        if (Math.abs(orient(from, a, b)) < HIT_EPS) continue
        if (triangleSkipsOccluder(from, a, b, scene.occluders)) continue
        region.push([from, a, b])
      }
    }
  }
  return region
}
