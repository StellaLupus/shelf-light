import { describe, expect, test } from 'vitest'
import { evaluateScene, placeEye } from '../../src/geometry'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

describe('floor and shelf height from floor', () => {
  test('puts the floor at y = -H and keeps the planting plane at y = 0', () => {
    const result = evaluateScene(
      baseInput({
        lower: { depth: 200, thickness: 18, heightFromFloor: 1200 },
      }),
    )
    expectOk(result)
    expect(result.scene.lower.y + result.scene.lower.height).toBe(0)
    expect(result.scene.floorY).toBe(-1200)
  })

  test('rejects non-positive H and H that is not above lower thickness', () => {
    const zero = evaluateScene(
      baseInput({ lower: { depth: 200, thickness: 18, heightFromFloor: 0 } }),
    )
    const negative = evaluateScene(
      baseInput({ lower: { depth: 200, thickness: 18, heightFromFloor: -10 } }),
    )
    const flush = evaluateScene(
      baseInput({ lower: { depth: 200, thickness: 18, heightFromFloor: 18 } }),
    )
    expect(zero.ok).toBe(false)
    expect(negative.ok).toBe(false)
    expect(flush.ok).toBe(false)
  })

  test('lifts an eye below the floor to y = -H and keeps X', () => {
    const input = baseInput({
      lower: { depth: 200, thickness: 18, heightFromFloor: 1200 },
      viewer: { distance: 400, eyeHeight: -1300 },
    })
    const built = evaluateScene(input)
    expectOk(built)
    const placed = placeEye(
      { x: 400, y: -1300 },
      built.scene.occluders,
      built.scene.floorY,
    )
    expect(placed).toEqual({ x: 400, y: -1200 })
    expect(built.scene.eye).toEqual({ x: 400, y: -1200 })
  })
})
