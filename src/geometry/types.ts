export type Point = {
  x: number
  y: number
}

export type Segment = {
  a: Point
  b: Point
}

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type MountType = 'corner' | 'downward'

export type SceneInput = {
  upper: { depth: number; thickness: number }
  lower: { depth: number; thickness: number }
  gap: number
  blend: { height: number; thickness: number }
  led: {
    width: number
    mount: MountType
    profileDrop: number
    emitAngle: number
    offsetFromWall: number
  }
  viewer: { distance: number; eyeHeight: number }
}

export type ValidationError = {
  code: string
  message: string
}

export type BuiltScene = {
  emitter: Segment
  emitNormal: Point
  upper: Rect
  lower: Rect
  valance: Rect
  occluders: Rect[]
  eye: Point
}

export type RaySample = {
  from: Point
  to: Point
  occluded: boolean
}

export type Evaluation = {
  hasDirectGlare: boolean
  samples: RaySample[]
}

export type SceneResult =
  | { ok: true; scene: BuiltScene; evaluation: Evaluation }
  | { ok: false; errors: ValidationError[] }
