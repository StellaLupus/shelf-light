import { describe, expect, test } from 'vitest'
import { evaluateScene } from '../../src/geometry'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

describe('scene construction', () => {
  test('origin is the wall and the top of the lower shelf', () => {
    const result = evaluateScene(baseInput())
    expectOk(result)
    expect(result.scene.lower.y + result.scene.lower.height).toBe(0)
    expect(result.scene.lower.x).toBe(0)
  })

  test('rejects non-positive LED width', () => {
    const zero = evaluateScene(baseInput({ led: { width: 0 } }))
    const negative = evaluateScene(baseInput({ led: { width: -4 } }))
    expect(zero.ok).toBe(false)
    expect(negative.ok).toBe(false)
  })

  test('places a corner emitter at the wall/underside corner along the emit angle', () => {
    const gap = 300
    const profileDrop = 6
    const width = 12
    const emitAngle = 45
    const result = evaluateScene(
      baseInput({
        gap,
        led: {
          mount: 'corner',
          width,
          profileDrop,
          emitAngle,
          offsetFromWall: 0,
        },
      }),
    )
    expectOk(result)
    const { a, b } = result.scene.emitter
    expect(a.x).toBeCloseTo(0)
    expect(a.y).toBeCloseTo(gap - profileDrop)
    const radians = (emitAngle * Math.PI) / 180
    expect(b.x).toBeCloseTo(width * Math.cos(radians))
    expect(b.y).toBeCloseTo(gap - profileDrop - width * Math.sin(radians))
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    expect(length).toBeCloseTo(width)
  })

  test('places a downward emitter as a horizontal window under the upper shelf', () => {
    const result = evaluateScene(
      baseInput({
        led: {
          mount: 'downward',
          width: 16,
          offsetFromWall: 40,
          profileDrop: 2,
          emitAngle: 45,
        },
      }),
    )
    expectOk(result)
    const { a, b } = result.scene.emitter
    expect(a.y).toBeCloseTo(b.y)
    expect(a.x).toBeCloseTo(40)
    expect(b.x).toBeCloseTo(56)
    expect(b.x).toBeLessThanOrEqual(250)
  })

  test('rejects a downward strip that passes the upper front edge', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 80, thickness: 18 },
        led: {
          mount: 'downward',
          width: 20,
          offsetFromWall: 70,
          profileDrop: 2,
          emitAngle: 45,
        },
      }),
    )
    expect(result.ok).toBe(false)
  })

  test('allows a corner strip whose outer end is past the upper front edge', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 20, thickness: 18 },
        led: {
          mount: 'corner',
          width: 30,
          emitAngle: 45,
          profileDrop: 2,
          offsetFromWall: 0,
        },
      }),
    )
    expectOk(result)
    expect(result.scene.emitter.b.x).toBeGreaterThan(20)
  })

  test('rejects a shelf with zero thickness', () => {
    const result = evaluateScene(
      baseInput({ upper: { depth: 250, thickness: 0 } }),
    )
    expect(result.ok).toBe(false)
  })
})
