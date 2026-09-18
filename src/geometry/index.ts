import { buildScene } from './scene.ts'
import type { SceneInput, SceneResult } from './types.ts'
import { validateScene } from './validate.ts'
import { evaluateVisibility } from './visibility.ts'

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
  const scene = buildScene(input)
  return { ok: true, scene, evaluation: evaluateVisibility(scene) }
}
