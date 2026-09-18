import type {
  BuiltScene,
  EmitSurface,
  Point,
  ProfileShape,
  Rect,
  SceneInput,
} from './types.ts'

export function pocketCorner(input: SceneInput): Point {
  return {
    x: input.upper.depth - input.blend.thickness,
    y: input.gap - input.led.profileDrop,
  }
}

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y)
  if (length === 0) return { x: 0, y: -1 }
  return { x: point.x / length, y: point.y / length }
}

function buildProfile(input: SceneInput): {
  emitSurfaces: EmitSurface[]
  profileShape: ProfileShape
  profileBody?: Rect
} {
  const width = input.led.width
  const y = input.gap - input.led.profileDrop
  if (input.led.mount === 'downward') {
    const a = { x: input.led.offsetFromWall, y }
    const b = { x: input.led.offsetFromWall + width, y }
    return {
      emitSurfaces: [{ kind: 'segment', a, b, normal: { x: 0, y: -1 } }],
      profileShape: { kind: 'strip', a, b },
    }
  }

  const pocket = pocketCorner(input)
  const alongShelf = { x: pocket.x - width, y: pocket.y }
  const alongValance = { x: pocket.x, y: pocket.y - width }
  const inner = { x: pocket.x - width, y: pocket.y - width }

  if (input.led.mount === 'triangle') {
    return {
      emitSurfaces: [
        {
          kind: 'segment',
          a: alongShelf,
          b: alongValance,
          normal: normalize({ x: -1, y: -1 }),
        },
      ],
      profileShape: { kind: 'triangle', a: pocket, b: alongShelf, c: alongValance },
    }
  }

  if (input.led.mount === 'ell') {
    const profileBody: Rect = {
      x: inner.x,
      y: inner.y,
      width,
      height: width,
    }
    return {
      emitSurfaces: [
        {
          kind: 'segment',
          a: alongShelf,
          b: inner,
          normal: { x: -1, y: 0 },
        },
        {
          kind: 'segment',
          a: inner,
          b: alongValance,
          normal: { x: 0, y: -1 },
        },
      ],
      profileBody,
      profileShape: { kind: 'square', rect: profileBody },
    }
  }

  if (input.led.mount !== 'radius') {
    const _never: never = input.led.mount
    throw new Error(`Unsupported mount: ${_never}`)
  }

  const startAngle = Math.PI
  const endAngle = (3 * Math.PI) / 2
  return {
    emitSurfaces: [
      {
        kind: 'arc',
        center: pocket,
        radius: width,
        startAngle,
        endAngle,
      },
    ],
    profileShape: {
      kind: 'quarterCircle',
      center: pocket,
      radius: width,
      startAngle,
      endAngle,
    },
  }
}

export function buildScene(input: SceneInput): BuiltScene {
  const { emitSurfaces, profileShape, profileBody } = buildProfile(input)
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
  const solids = [upper, lower, valance]
  if (profileBody) solids.push(profileBody)
  return {
    emitSurfaces,
    profileShape,
    profileBody,
    upper,
    lower,
    valance,
    occluders: solids.filter((rect) => rect.width > 0 && rect.height > 0),
    eye: { x: input.viewer.distance, y: input.viewer.eyeHeight },
  }
}
