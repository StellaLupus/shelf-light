import { describe, expect, test } from 'vitest'
import { evaluateScene, pocketCorner } from '../../src/geometry'
import { DEFAULT_PARAMS, parseParams, serializeParams } from '../../src/state/params'
import { expectOk } from '../expectOk'

describe('URL scene params', () => {
  test('round-trips triangle mount and blend height', () => {
    const input = {
      ...DEFAULT_PARAMS,
      blend: { ...DEFAULT_PARAMS.blend, height: 55 },
      led: { ...DEFAULT_PARAMS.led, mount: 'triangle' as const },
    }
    const query = serializeParams(input)
    expect(query.get('mount')).toBe('triangle')
    expect(query.has('lea')).toBe(false)
    const restored = parseParams(`?${query.toString()}`)
    expect(restored.led.mount).toBe('triangle')
    expect(restored.blend.height).toBe(55)
    expect(evaluateScene(restored).ok).toBe(true)
  })

  test('writes radius, ell, triangle, and downward mounts', () => {
    for (const mount of ['radius', 'ell', 'triangle', 'downward'] as const) {
      const query = serializeParams({
        ...DEFAULT_PARAMS,
        led: { ...DEFAULT_PARAMS.led, mount },
      })
      expect(query.get('mount')).toBe(mount)
      expect(parseParams(`?${query.toString()}`).led.mount).toBe(mount)
    }
  })

  test('reads legacy mount=corner as triangle in the valance pocket', () => {
    const restored = parseParams('?mount=corner')
    expect(restored.led.mount).toBe('triangle')
    const result = evaluateScene(restored)
    expectOk(result)
    expect(result.scene.profileShape.kind).toBe('triangle')
    if (result.scene.profileShape.kind !== 'triangle') return
    expect(result.scene.profileShape.a.x).toBeCloseTo(pocketCorner(restored).x)
  })

  test('ignores a leftover emit-angle query parameter', () => {
    const restored = parseParams('?mount=triangle&lea=30')
    expect(restored.led.mount).toBe('triangle')
    expect(serializeParams(restored).has('lea')).toBe(false)
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
