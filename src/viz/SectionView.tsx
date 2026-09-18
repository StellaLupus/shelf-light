import { useRef, useState, type PointerEvent } from 'react'
import type { BuiltScene, Evaluation, Point, ProfileShape } from '../geometry'
import type { ViewMode } from '../state/params.ts'
import { pointOnSurface } from '../geometry/visibility.ts'
import {
  EYE_HIT_RADIUS,
  EYE_MARK_RADIUS,
  screenToScene,
  type SvgMatrix,
} from './coords.ts'
import { buildDiagram, diagramViewBox } from './diagram.ts'

type SectionViewProps = {
  scene: BuiltScene
  evaluation: Evaluation
  view: ViewMode
  onEyeMove: (point: Point) => void
}

function flip(y: number): number {
  return -y
}

function pointsAttr(points: Point[]): string {
  return points.map((point) => `${point.x},${flip(point.y)}`).join(' ')
}

function ledBody(led: ProfileShape) {
  if (led.kind === 'strip') {
    return (
      <line
        className="led-strip"
        data-testid="led-strip"
        data-kind="downward"
        x1={led.a.x}
        y1={flip(led.a.y)}
        x2={led.b.x}
        y2={flip(led.b.y)}
      />
    )
  }
  if (led.kind === 'square') {
    return (
      <rect
        className="led-body"
        data-testid="led-body"
        data-kind="ell"
        x={led.rect.x}
        y={flip(led.rect.y + led.rect.height)}
        width={led.rect.width}
        height={led.rect.height}
      />
    )
  }
  if (led.kind === 'triangle') {
    return (
      <polygon
        className="led-body"
        data-testid="led-body"
        data-kind="triangle"
        points={pointsAttr([led.a, led.b, led.c])}
      />
    )
  }
  if (led.kind !== 'quarterCircle') {
    const _never: never = led
    throw new Error(`Unsupported LED body: ${JSON.stringify(_never)}`)
  }
  const arc = { ...led, kind: 'arc' as const }
  const start = pointOnSurface(arc, 0)
  const end = pointOnSurface(arc, 1)
  return (
    <path
      className="led-body"
      data-testid="led-body"
      data-kind="radius"
      d={`M ${led.center.x} ${flip(led.center.y)} L ${start.x} ${flip(start.y)} A ${led.radius} ${led.radius} 0 0 1 ${end.x} ${flip(end.y)} Z`}
    />
  )
}

function readCtm(svg: SVGSVGElement): SvgMatrix | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  return { a: ctm.a, b: ctm.b, c: ctm.c, d: ctm.d, e: ctm.e, f: ctm.f }
}

export function SectionView({
  scene,
  evaluation,
  view,
  onEyeMove,
}: SectionViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [frozenViewBox, setFrozenViewBox] = useState<string | null>(null)
  const diagram = buildDiagram(scene, evaluation)
  const liveViewBox = diagramViewBox(diagram.bounds, 48)

  const pointFromEvent = (event: PointerEvent<SVGElement>): Point | null => {
    const svg = svgRef.current
    if (!svg) return null
    const ctm = readCtm(svg)
    if (!ctm) return null
    return screenToScene(event.clientX, event.clientY, ctm)
  }

  const startDrag = (event: PointerEvent<SVGCircleElement>): void => {
    event.preventDefault()
    try {
      svgRef.current?.setPointerCapture(event.pointerId)
    } catch {
      // Untrusted or already-released pointer; still start the gesture.
    }
    draggingRef.current = true
    setDragging(true)
    setFrozenViewBox(liveViewBox)
  }

  const moveDrag = (event: PointerEvent<SVGSVGElement>): void => {
    if (!draggingRef.current) return
    const point = pointFromEvent(event)
    if (point) onEyeMove(point)
  }

  const endDrag = (event: PointerEvent<SVGSVGElement>): void => {
    if (!draggingRef.current) return
    try {
      svgRef.current?.releasePointerCapture(event.pointerId)
    } catch {
      // Capture may already be gone on cancel.
    }
    draggingRef.current = false
    setDragging(false)
    setFrozenViewBox(null)
  }

  return (
    <svg
      ref={svgRef}
      className={dragging ? 'diagram is-dragging' : 'diagram'}
      data-testid="diagram"
      data-view={view}
      viewBox={frozenViewBox ?? liveViewBox}
      role="img"
      aria-label="Разрез полок, ленты, пола и глаза"
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <line
        className="wall"
        x1={diagram.wall.a.x}
        y1={flip(diagram.wall.a.y)}
        x2={diagram.wall.b.x}
        y2={flip(diagram.wall.b.y)}
      />
      <line
        className="floor"
        data-testid="floor"
        x1={diagram.floor.a.x}
        y1={flip(diagram.floor.a.y)}
        x2={diagram.floor.b.x}
        y2={flip(diagram.floor.b.y)}
      />
      {view === 'lit' ? (
        <g data-testid="lit-region">
          {diagram.litRegion.map((polygon, index) => (
            <polygon
              key={`lit-${index}`}
              className="lit-region"
              points={pointsAttr(polygon)}
            />
          ))}
        </g>
      ) : null}
      <rect
        className="shelf"
        x={diagram.lower.x}
        y={flip(diagram.lower.y + diagram.lower.height)}
        width={diagram.lower.width}
        height={diagram.lower.height}
      />
      <rect
        className="shelf"
        x={diagram.upper.x}
        y={flip(diagram.upper.y + diagram.upper.height)}
        width={diagram.upper.width}
        height={diagram.upper.height}
      />
      {diagram.valance.width > 0 && diagram.valance.height > 0 ? (
        <rect
          className="valance"
          x={diagram.valance.x}
          y={flip(diagram.valance.y + diagram.valance.height)}
          width={diagram.valance.width}
          height={diagram.valance.height}
        />
      ) : null}
      {view === 'glare'
        ? diagram.plantFan.map((segment, index) => (
            <line
              key={`fan-${index}`}
              className="plant-fan"
              x1={segment.a.x}
              y1={flip(segment.a.y)}
              x2={segment.b.x}
              y2={flip(segment.b.y)}
            />
          ))
        : null}
      {view === 'glare'
        ? diagram.rays.map((ray, index) => (
            <line
              key={`ray-${index}`}
              className={ray.occluded ? 'ray-blocked' : 'ray-open'}
              data-occluded={ray.occluded ? 'true' : 'false'}
              x1={ray.from.x}
              y1={flip(ray.from.y)}
              x2={ray.to.x}
              y2={flip(ray.to.y)}
            />
          ))
        : null}
      {ledBody(diagram.led)}
      <circle
        className="eye-hit"
        data-testid="eye-hit"
        role="slider"
        aria-label="Положение глаза"
        aria-valuetext={`${Math.round(diagram.eye.x)} мм от стены, ${Math.round(diagram.eye.y)} мм по высоте`}
        cx={diagram.eye.x}
        cy={flip(diagram.eye.y)}
        r={EYE_HIT_RADIUS}
        onPointerDown={startDrag}
      />
      <circle
        className="eye"
        data-testid="eye"
        cx={diagram.eye.x}
        cy={flip(diagram.eye.y)}
        r={EYE_MARK_RADIUS}
      />
      <text
        className="label"
        x={diagram.eye.x + 12}
        y={flip(diagram.eye.y) + 4}
      >
        Глаз
      </text>
      <text className="label" x={8} y={flip(diagram.upper.y + diagram.upper.height) - 8}>
        Верх
      </text>
      <text className="label" x={8} y={flip(diagram.lower.y) + 16}>
        Низ
      </text>
    </svg>
  )
}
