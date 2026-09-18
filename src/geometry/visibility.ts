import type {
  BuiltScene,
  EmitSurface,
  Evaluation,
  Point,
  RaySample,
  Rect,
} from './types.ts'

export const INTERIOR_SAMPLE_COUNT = 16
const SAMPLE_NORMAL_EPS = 1e-4

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function offsetAlong(point: Point, normal: Point): Point {
  return {
    x: point.x + normal.x * SAMPLE_NORMAL_EPS,
    y: point.y + normal.y * SAMPLE_NORMAL_EPS,
  }
}

function isInFront(from: Point, to: Point, normal: Point): boolean {
  return (to.x - from.x) * normal.x + (to.y - from.y) * normal.y > 1e-9
}

export function pointOnSurface(surface: EmitSurface, t: number): Point {
  if (surface.kind === 'segment') return lerp(surface.a, surface.b, t)
  const theta =
    surface.startAngle + (surface.endAngle - surface.startAngle) * t
  return {
    x: surface.center.x + surface.radius * Math.cos(theta),
    y: surface.center.y + surface.radius * Math.sin(theta),
  }
}

function normalOnSurface(surface: EmitSurface, t: number): Point {
  if (surface.kind === 'segment') return surface.normal
  const theta =
    surface.startAngle + (surface.endAngle - surface.startAngle) * t
  return { x: Math.cos(theta), y: Math.sin(theta) }
}

export function segmentHitsRect(a: Point, b: Point, rect: Rect): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false
  const dx = b.x - a.x
  const dy = b.y - a.y
  const epsilon = 1e-9
  let t0 = 0
  let t1 = 1
  const clips = [
    { p: -dx, q: a.x - rect.x },
    { p: dx, q: rect.x + rect.width - a.x },
    { p: -dy, q: a.y - rect.y },
    { p: dy, q: rect.y + rect.height - a.y },
  ]
  for (const { p, q } of clips) {
    if (Math.abs(p) < epsilon) {
      if (q < -epsilon) return false
      continue
    }
    const t = q / p
    if (p < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
  }
  if (t1 < t0 - epsilon) return false
  return t1 > epsilon
}

function sampleSurface(surface: EmitSurface): { from: Point; normal: Point }[] {
  const steps = INTERIOR_SAMPLE_COUNT + 1
  const samples: { from: Point; normal: Point }[] = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const normal = normalOnSurface(surface, t)
    samples.push({
      from: offsetAlong(pointOnSurface(surface, t), normal),
      normal,
    })
  }
  return samples
}

export function evaluateVisibility(scene: BuiltScene): Evaluation {
  const samples: RaySample[] = []
  for (const surface of scene.emitSurfaces) {
    for (const { from, normal } of sampleSurface(surface)) {
      const occluded =
        !isInFront(from, scene.eye, normal) ||
        scene.occluders.some((rect) => segmentHitsRect(from, scene.eye, rect))
      samples.push({ from, to: scene.eye, occluded })
    }
  }
  return {
    hasDirectGlare: samples.some((sample) => !sample.occluded),
    samples,
  }
}
