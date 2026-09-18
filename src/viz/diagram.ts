import type {
  BuiltScene,
  Evaluation,
  Point,
  RaySample,
  Rect,
  Segment,
} from '../geometry'
import { lerp } from '../geometry/visibility.ts'

export type DiagramModel = {
  wall: Segment
  upper: Rect
  lower: Rect
  valance: Rect
  led: Segment
  eye: Point
  rays: RaySample[]
  plantFan: Segment[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

function boundsOf(points: Point[]): DiagramModel['bounds'] {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

function rectPoints(rect: Rect): Point[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ]
}

export function buildDiagram(
  scene: BuiltScene,
  evaluation: Evaluation,
): DiagramModel {
  const plantFan: Segment[] = [0.2, 0.5, 0.8].map((t) => {
    const from = lerp(scene.emitter.a, scene.emitter.b, t)
    return { a: from, b: { x: from.x + (t - 0.5) * 30, y: 0 } }
  })
  const wall: Segment = {
    a: { x: 0, y: Math.min(scene.lower.y, scene.eye.y) - 40 },
    b: {
      x: 0,
      y: Math.max(scene.upper.y + scene.upper.height, scene.eye.y) + 40,
    },
  }
  const points = [
    wall.a,
    wall.b,
    scene.eye,
    scene.emitter.a,
    scene.emitter.b,
    ...rectPoints(scene.upper),
    ...rectPoints(scene.lower),
    ...rectPoints(scene.valance),
    ...plantFan.flatMap((segment) => [segment.a, segment.b]),
  ]
  return {
    wall,
    upper: scene.upper,
    lower: scene.lower,
    valance: scene.valance,
    led: scene.emitter,
    eye: scene.eye,
    rays: evaluation.samples,
    plantFan,
    bounds: boundsOf(points),
  }
}
