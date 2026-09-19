import type {
  EmitSurface,
  Point,
  ProfileShape,
  Rect,
  SceneInput,
} from './types.ts'

export const RECESSED25 = {
  bodyWidth: 40,
  stopWidth: 2.5,
  grooveWidth: 35,
  grooveDepth: 14,
  flangeProud: 2,
  milkLength: 14,
  angleFromVerticalDeg: 25,
  windowWidth: 27,
} as const

function milkSpan(): { dx: number; dy: number; angle: number } {
  const angle = (RECESSED25.angleFromVerticalDeg * Math.PI) / 180
  return {
    angle,
    dx: RECESSED25.milkLength * Math.sin(angle),
    dy: RECESSED25.milkLength * Math.cos(angle),
  }
}

function channelOutline(offset: number, gap: number, groove: Rect): Point[] {
  const flangeY = gap - RECESSED25.flangeProud
  const bodyRight = offset + RECESSED25.bodyWidth
  const grooveRight = groove.x + groove.width
  const top = gap + RECESSED25.grooveDepth
  return [
    { x: offset, y: flangeY },
    { x: bodyRight, y: flangeY },
    { x: bodyRight, y: gap },
    { x: grooveRight, y: gap },
    { x: grooveRight, y: top },
    { x: groove.x, y: top },
    { x: groove.x, y: gap },
    { x: offset, y: gap },
  ]
}

export function buildRecessed(input: SceneInput): {
  emitSurfaces: EmitSurface[]
  profileShape: ProfileShape
  groove: Rect
  wood: Rect[]
  metal: Rect[]
} {
  const offset = input.led.offsetFromWall
  const gap = input.gap
  const facing = input.led.facing
  const { angle, dx, dy } = milkSpan()
  const groove: Rect = {
    x: offset + RECESSED25.stopWidth,
    y: gap,
    width: RECESSED25.grooveWidth,
    height: RECESSED25.grooveDepth,
  }

  const lower: Point =
    facing === 'wall'
      ? { x: groove.x + RECESSED25.windowWidth, y: gap }
      : { x: groove.x + groove.width - RECESSED25.windowWidth, y: gap }
  const upper: Point =
    facing === 'wall'
      ? { x: lower.x - dx, y: gap + dy }
      : { x: lower.x + dx, y: gap + dy }
  const normal: Point =
    facing === 'wall'
      ? { x: -Math.cos(angle), y: -Math.sin(angle) }
      : { x: Math.cos(angle), y: -Math.sin(angle) }

  const wood: Rect[] = []
  const capHeight = input.upper.thickness - RECESSED25.grooveDepth
  if (capHeight > 0) {
    wood.push({
      x: 0,
      y: gap + RECESSED25.grooveDepth,
      width: input.upper.depth,
      height: capHeight,
    })
  }
  if (groove.x > 0) {
    wood.push({
      x: 0,
      y: gap,
      width: groove.x,
      height: RECESSED25.grooveDepth,
    })
  }
  const frontX = groove.x + groove.width
  if (frontX < input.upper.depth) {
    wood.push({
      x: frontX,
      y: gap,
      width: input.upper.depth - frontX,
      height: RECESSED25.grooveDepth,
    })
  }

  const metal: Rect[] = []
  const nearWall = facing === 'wall' ? groove.x + groove.width : groove.x
  const metalLeft = Math.min(lower.x, nearWall)
  const metalWidth = Math.abs(nearWall - lower.x)
  if (metalWidth > 0) {
    metal.push({
      x: metalLeft,
      y: gap,
      width: metalWidth,
      height: RECESSED25.grooveDepth,
    })
  }
  metal.push({
    x: offset,
    y: gap - RECESSED25.flangeProud,
    width: RECESSED25.stopWidth,
    height: RECESSED25.flangeProud,
  })
  metal.push({
    x: offset + RECESSED25.bodyWidth - RECESSED25.stopWidth,
    y: gap - RECESSED25.flangeProud,
    width: RECESSED25.stopWidth,
    height: RECESSED25.flangeProud,
  })

  const profileShape: ProfileShape = {
    kind: 'recessed',
    milkA: lower,
    milkB: upper,
    outline: channelOutline(offset, gap, groove),
  }

  return {
    emitSurfaces: [{ kind: 'segment', a: lower, b: upper, normal }],
    profileShape,
    groove,
    wood,
    metal,
  }
}
