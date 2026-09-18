import type { Point } from '../geometry'

export const EYE_MARK_RADIUS = 8
export const EYE_HIT_RADIUS = 15

export type SvgMatrix = {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export function screenToScene(
  clientX: number,
  clientY: number,
  ctm: SvgMatrix,
): Point | null {
  const det = ctm.a * ctm.d - ctm.b * ctm.c
  if (det === 0) return null
  const svgX = (ctm.d * (clientX - ctm.e) - ctm.c * (clientY - ctm.f)) / det
  const svgY = (-ctm.b * (clientX - ctm.e) + ctm.a * (clientY - ctm.f)) / det
  return { x: svgX, y: -svgY }
}
