import type { BuiltScene, Evaluation, Point, RaySample, Rect } from './types.ts'

export const INTERIOR_SAMPLE_COUNT = 16

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function isInFront(from: Point, to: Point, normal: Point): boolean {
  return (to.x - from.x) * normal.x + (to.y - from.y) * normal.y > 1e-9
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

export function evaluateVisibility(scene: BuiltScene): Evaluation {
  const steps = INTERIOR_SAMPLE_COUNT + 1
  const samples: RaySample[] = []
  for (let i = 0; i <= steps; i += 1) {
    const from = lerp(scene.emitter.a, scene.emitter.b, i / steps)
    const occluded =
      !isInFront(from, scene.eye, scene.emitNormal) ||
      scene.occluders.some((rect) => segmentHitsRect(from, scene.eye, rect))
    samples.push({ from, to: scene.eye, occluded })
  }
  return {
    hasDirectGlare: samples.some((sample) => !sample.occluded),
    samples,
  }
}
