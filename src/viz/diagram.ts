import type {
  BuiltScene,
  Evaluation,
  Point,
  ProfileShape,
  RaySample,
  Rect,
  Segment,
} from '../geometry'
import { pointOnSurface } from '../geometry/visibility.ts'

export type DiagramModel = {
  wall: Segment
  upper: Rect
  lower: Rect
  valance: Rect
  floor: Segment
  led: ProfileShape
  eye: Point
  rays: RaySample[]
  plantFan: Segment[]
  litRegion: Point[][]
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

function profilePoints(shape: ProfileShape): Point[] {
  if (shape.kind === 'strip') return [shape.a, shape.b]
  if (shape.kind === 'square') return rectPoints(shape.rect)
  if (shape.kind === 'triangle') return [shape.a, shape.b, shape.c]
  const arc = { ...shape, kind: 'arc' as const }
  return [0, 0.5, 1].map((t) => pointOnSurface(arc, t))
}

export function diagramViewBox(
  bounds: DiagramModel['bounds'],
  pad: number,
): string {
  const width = Math.max(bounds.maxX - bounds.minX, 1) + pad * 2
  const height = Math.max(bounds.maxY - bounds.minY, 1) + pad * 2
  return `${bounds.minX - pad} ${-bounds.maxY - pad} ${width} ${height}`
}

export function buildDiagram(
  scene: BuiltScene,
  evaluation: Evaluation,
): DiagramModel {
  const fanSurface = scene.emitSurfaces[0]
  const plantFan: Segment[] = fanSurface
    ? [0.2, 0.5, 0.8].map((t) => {
        const from = pointOnSurface(fanSurface, t)
        return { a: from, b: { x: from.x + (t - 0.5) * 30, y: 0 } }
      })
    : []
  const floorX = Math.max(
    scene.lower.width,
    scene.upper.width,
    scene.eye.x,
    400,
  )
  const floor: Segment = {
    a: { x: 0, y: scene.floorY },
    b: { x: floorX, y: scene.floorY },
  }
  const wall: Segment = {
    a: { x: 0, y: scene.floorY },
    b: {
      x: 0,
      y: Math.max(scene.upper.y + scene.upper.height, scene.eye.y) + 40,
    },
  }
  const points = [
    wall.a,
    wall.b,
    floor.a,
    floor.b,
    scene.eye,
    ...profilePoints(scene.profileShape),
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
    floor,
    led: scene.profileShape,
    eye: scene.eye,
    rays: evaluation.samples,
    plantFan,
    litRegion: evaluation.litRegion,
    bounds: boundsOf(points),
  }
}
