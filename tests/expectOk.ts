import { expect } from 'vitest'
import type { SceneResult } from '../src/geometry'

export function expectOk(
  result: SceneResult,
): asserts result is SceneResult & { ok: true } {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error('expected a valid scene')
}
