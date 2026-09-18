import { placeEye } from './placeEye.ts'
import { buildScene } from './scene.ts'
import type { SceneInput, SceneResult } from './types.ts'
import { validateScene } from './validate.ts'
import { evaluateLitRegion } from './litRegion.ts'
import { evaluateVisibility } from './visibility.ts'

export { isDirectlyLit, pointInLitRegion } from './litRegion.ts'
export { placeEye } from './placeEye.ts'
export { pocketCorner } from './scene.ts'
export { INTERIOR_SAMPLE_COUNT } from './visibility.ts'
export type {
  BuiltScene,
  EmitArc,
  EmitSegment,
  EmitSurface,
  Evaluation,
  MountType,
  Point,
  ProfileShape,
  RaySample,
  Rect,
  SceneInput,
  SceneResult,
  Segment,
  ValidationError,
} from './types.ts'

export function evaluateScene(input: SceneInput): SceneResult {
  const errors = validateScene(input)
  if (errors.length > 0) return { ok: false, errors }
  const built = buildScene(input)
  const scene = {
    ...built,
    eye: placeEye(built.eye, built.occluders, built.floorY),
  }
  const evaluation = evaluateVisibility(scene)
  return {
    ok: true,
    scene,
    evaluation: { ...evaluation, litRegion: evaluateLitRegion(scene) },
  }
}
