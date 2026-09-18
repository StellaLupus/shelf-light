import type { BuiltScene, Evaluation, Point, ProfileShape } from '../geometry'
import { pointOnSurface } from '../geometry/visibility.ts'
import { buildDiagram } from './diagram.ts'

type SectionViewProps = {
  scene: BuiltScene
  evaluation: Evaluation
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

export function SectionView({ scene, evaluation }: SectionViewProps) {
  const diagram = buildDiagram(scene, evaluation)
  const pad = 48
  const width = Math.max(diagram.bounds.maxX - diagram.bounds.minX, 1) + pad * 2
  const height = Math.max(diagram.bounds.maxY - diagram.bounds.minY, 1) + pad * 2
  return (
    <svg
      className="diagram"
      data-testid="diagram"
      viewBox={`${diagram.bounds.minX - pad} ${flip(diagram.bounds.maxY) - pad} ${width} ${height}`}
      role="img"
      aria-label="Разрез полок, ленты и лучей к глазу"
    >
      <line
        className="wall"
        x1={diagram.wall.a.x}
        y1={flip(diagram.wall.a.y)}
        x2={diagram.wall.b.x}
        y2={flip(diagram.wall.b.y)}
      />
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
      {diagram.plantFan.map((segment, index) => (
        <line
          key={`fan-${index}`}
          className="plant-fan"
          x1={segment.a.x}
          y1={flip(segment.a.y)}
          x2={segment.b.x}
          y2={flip(segment.b.y)}
        />
      ))}
      {diagram.rays.map((ray, index) => (
        <line
          key={`ray-${index}`}
          className={ray.occluded ? 'ray-blocked' : 'ray-open'}
          data-occluded={ray.occluded ? 'true' : 'false'}
          x1={ray.from.x}
          y1={flip(ray.from.y)}
          x2={ray.to.x}
          y2={flip(ray.to.y)}
        />
      ))}
      {ledBody(diagram.led)}
      <circle
        className="eye"
        cx={diagram.eye.x}
        cy={flip(diagram.eye.y)}
        r="8"
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
