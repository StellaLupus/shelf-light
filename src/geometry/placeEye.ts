import type { Point, Rect } from './types.ts'

function isInterior(rect: Rect, point: Point): boolean {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  )
}

function pushOut(point: Point, rect: Rect): Point {
  const left = point.x - rect.x
  const right = rect.x + rect.width - point.x
  const down = point.y - rect.y
  const up = rect.y + rect.height - point.y
  const min = Math.min(left, right, down, up)
  if (min === left) return { x: rect.x, y: point.y }
  if (min === right) return { x: rect.x + rect.width, y: point.y }
  if (min === down) return { x: point.x, y: rect.y }
  return { x: point.x, y: rect.y + rect.height }
}

export function placeEye(requested: Point, occluders: readonly Rect[]): Point {
  let point = { x: requested.x, y: requested.y }
  for (let pass = 0; pass < 2; pass += 1) {
    for (const rect of occluders) {
      if (isInterior(rect, point)) point = pushOut(point, rect)
    }
  }
  return { x: Math.max(0, point.x), y: point.y }
}
