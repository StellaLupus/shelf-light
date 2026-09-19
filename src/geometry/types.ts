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

export type LedFacing = 'wall' | 'room'

export type MountType = 'downward' | 'radius' | 'ell' | 'triangle' | 'recessed25'

export type EmitSegment = {
  kind: 'segment'
  a: Point
  b: Point
  normal: Point
}

export type EmitArc = {
  kind: 'arc'
  center: Point
  radius: number
  startAngle: number
  endAngle: number
}

export type EmitSurface = EmitSegment | EmitArc

export type ProfileShape =
  | { kind: 'strip'; a: Point; b: Point }
  | { kind: 'square'; rect: Rect }
  | { kind: 'triangle'; a: Point; b: Point; c: Point }
  | {
      kind: 'quarterCircle'
      center: Point
      radius: number
      startAngle: number
      endAngle: number
    }
  | { kind: 'recessed'; milkA: Point; milkB: Point; outline: Point[] }

export type SceneInput = {
  upper: { depth: number; thickness: number }
  lower: { depth: number; thickness: number; heightFromFloor: number }
  gap: number
  blend: { height: number; thickness: number }
  led: {
    width: number
    mount: MountType
    profileDrop: number
    offsetFromWall: number
    facing: LedFacing
  }
  viewer: { distance: number; eyeHeight: number }
}

export type ValidationError = {
  code: string
  message: string
}

export type BuiltScene = {
  emitSurfaces: EmitSurface[]
  profileShape: ProfileShape
  profileBody?: Rect
  groove?: Rect
  upper: Rect
  lower: Rect
  valance: Rect
  occluders: Rect[]
  floorY: number
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
  litRegion: Point[][]
}

export type RoomBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type SceneResult =
  | { ok: true; scene: BuiltScene; evaluation: Evaluation }
  | { ok: false; errors: ValidationError[] }
