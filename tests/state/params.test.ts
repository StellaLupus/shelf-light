import { describe, expect, test } from 'vitest'
import { evaluateScene } from '../../src/geometry'
import { DEFAULT_PARAMS, parseParams, serializeParams } from '../../src/state/params'
import { expectOk } from '../expectOk'

describe('URL scene params', () => {
  test('round-trips mount type and blend height', () => {
    const input = {
      ...DEFAULT_PARAMS,
      blend: { ...DEFAULT_PARAMS.blend, height: 55 },
      led: { ...DEFAULT_PARAMS.led, mount: 'corner' as const },
    }
    const restored = parseParams(`?${serializeParams(input).toString()}`)
    expect(restored.led.mount).toBe('corner')
    expect(restored.blend.height).toBe(55)
    expect(evaluateScene(restored).ok).toBe(true)
  })

  test('restores a shared query string to the same glare status', () => {
    const input = {
      ...DEFAULT_PARAMS,
      led: { ...DEFAULT_PARAMS.led, mount: 'downward' as const, offsetFromWall: 40 },
      blend: { ...DEFAULT_PARAMS.blend, height: 90 },
    }
    const original = evaluateScene(input)
    const restored = evaluateScene(parseParams(`?${serializeParams(input).toString()}`))
    expectOk(original)
    expectOk(restored)
    expect(restored.evaluation.hasDirectGlare).toBe(original.evaluation.hasDirectGlare)
  })

  test('falls back to defaults for garbage query values', () => {
    const restored = parseParams('?mount=sideways&gap=nope&uw=250')
    expect(restored.led.mount).toBe(DEFAULT_PARAMS.led.mount)
    expect(restored.gap).toBe(DEFAULT_PARAMS.gap)
  })
})
