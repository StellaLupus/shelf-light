import type { BuiltScene, Point, Rect, SceneInput, Segment } from './types.ts'

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y)
  if (length === 0) return { x: 0, y: -1 }
  return { x: point.x / length, y: point.y / length }
}

function buildEmitter(input: SceneInput): Segment {
  const y = input.gap - input.led.profileDrop
  if (input.led.mount === 'downward') {
    return {
      a: { x: input.led.offsetFromWall, y },
      b: { x: input.led.offsetFromWall + input.led.width, y },
    }
  }
  const radians = (input.led.emitAngle * Math.PI) / 180
  return {
    a: { x: 0, y },
    b: {
      x: input.led.width * Math.cos(radians),
      y: y - input.led.width * Math.sin(radians),
    },
  }
}

export function buildScene(input: SceneInput): BuiltScene {
  const emitter = buildEmitter(input)
  const direction = normalize({
    x: emitter.b.x - emitter.a.x,
    y: emitter.b.y - emitter.a.y,
  })
  const upper: Rect = {
    x: 0,
    y: input.gap,
    width: input.upper.depth,
    height: input.upper.thickness,
  }
  const lower: Rect = {
    x: 0,
    y: -input.lower.thickness,
    width: input.lower.depth,
    height: input.lower.thickness,
  }
  const valance: Rect = {
    x: input.upper.depth - input.blend.thickness,
    y: input.gap - input.blend.height,
    width: input.blend.thickness,
    height: input.blend.height,
  }
  return {
    emitter,
    // Corner slit faces into the room and down along the emit segment.
    emitNormal:
      input.led.mount === 'downward' ? { x: 0, y: -1 } : direction,
    upper,
    lower,
    valance,
    occluders: [upper, lower, valance].filter(
      (rect) => rect.width > 0 && rect.height > 0,
    ),
    eye: { x: input.viewer.distance, y: input.viewer.eyeHeight },
  }
}
