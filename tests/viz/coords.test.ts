import { describe, expect, test } from 'vitest'
import { screenToScene } from '../../src/viz/coords'

const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

describe('screenToScene', () => {
  test('inverts the CTM and flips Y into scene millimeters', () => {
    expect(screenToScene(10, -20, identity)).toEqual({ x: 10, y: 20 })
  })

  test('undoes a uniform scale', () => {
    const scaled = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }
    expect(screenToScene(20, -40, scaled)).toEqual({ x: 10, y: 20 })
  })

  test('undoes a translation', () => {
    const shifted = { a: 1, b: 0, c: 0, d: 1, e: 100, f: 50 }
    expect(screenToScene(110, 30, shifted)).toEqual({ x: 10, y: 20 })
  })

  test('returns null when the CTM is not invertible', () => {
    const singular = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 }
    expect(screenToScene(1, 1, singular)).toBeNull()
  })
})
