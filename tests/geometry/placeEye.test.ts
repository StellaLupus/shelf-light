import { describe, expect, test } from 'vitest'
import { evaluateScene, placeEye, pocketCorner } from '../../src/geometry'
import type { Point, Rect } from '../../src/geometry'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

function isInterior(rect: Rect, point: Point): boolean {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  )
}

describe('eye placement', () => {
  test('moves an eye out of the lower shelf interior', () => {
    const input = baseInput({
      lower: { depth: 200, thickness: 18 },
      viewer: { distance: 100, eyeHeight: -9 },
    })
    const built = evaluateScene(input)
    expectOk(built)
    const requested = { x: 100, y: -9 }
    expect(isInterior(built.scene.lower, requested)).toBe(true)
    const placed = placeEye(requested, built.scene.occluders)
    expect(isInterior(built.scene.lower, placed)).toBe(false)
    expect(placed.x).toBeGreaterThanOrEqual(0)
    expect(isInterior(built.scene.lower, built.scene.eye)).toBe(false)
  })

  test('moves an eye behind the wall to x = 0 and keeps Y', () => {
    const input = baseInput({ viewer: { distance: -20, eyeHeight: 50 } })
    const built = evaluateScene(input)
    expectOk(built)
    const placed = placeEye({ x: -20, y: 50 }, built.scene.occluders)
    expect(placed).toEqual({ x: 0, y: 50 })
    expect(built.scene.eye).toEqual({ x: 0, y: 50 })
  })

  test('keeps an eye in the bay', () => {
    const requested = { x: 100, y: 150 }
    const input = baseInput({ viewer: { distance: 100, eyeHeight: 150 } })
    const built = evaluateScene(input)
    expectOk(built)
    expect(placeEye(requested, built.scene.occluders)).toEqual(requested)
    expect(built.scene.eye).toEqual(requested)
  })

  test('keeps an eye on the underside of the upper shelf', () => {
    const input = baseInput({ gap: 300 })
    const requested = { x: 100, y: 300 }
    const built = evaluateScene({
      ...input,
      viewer: { distance: 100, eyeHeight: 300 },
    })
    expectOk(built)
    expect(placeEye(requested, built.scene.occluders)).toEqual(requested)
    expect(built.scene.eye).toEqual(requested)
  })

  test('moves an eye out of the valance interior', () => {
    const input = baseInput({
      blend: { height: 40, thickness: 12 },
      viewer: { distance: 244, eyeHeight: 280 },
    })
    const built = evaluateScene(input)
    expectOk(built)
    const requested = { x: 244, y: 280 }
    expect(isInterior(built.scene.valance, requested)).toBe(true)
    const placed = placeEye(requested, built.scene.occluders)
    expect(isInterior(built.scene.valance, placed)).toBe(false)
    expect(isInterior(built.scene.valance, built.scene.eye)).toBe(false)
  })

  test('moves an eye out of an ell body interior', () => {
    const input = baseInput({
      blend: { height: 30, thickness: 12 },
      led: {
        mount: 'ell',
        width: 16,
        profileDrop: 2,
        offsetFromWall: 0,
      },
      viewer: { distance: 230, eyeHeight: 290 },
    })
    const built = evaluateScene(input)
    expectOk(built)
    const body = built.scene.profileBody
    expect(body).toBeDefined()
    if (!body) return
    const requested = { x: 230, y: 290 }
    expect(isInterior(body, requested)).toBe(true)
    const placed = placeEye(requested, built.scene.occluders)
    expect(isInterior(body, placed)).toBe(false)
    expect(isInterior(body, built.scene.eye)).toBe(false)
  })

  test('does not displace an eye inside a triangle or radius visual that is not an occluder', () => {
    for (const mount of ['triangle', 'radius'] as const) {
      const input = baseInput({
        blend: { height: 40, thickness: 12 },
        led: {
          mount,
          width: 20,
          profileDrop: 2,
          offsetFromWall: 0,
        },
        viewer: { distance: 232, eyeHeight: 292 },
      })
      const built = evaluateScene(input)
      expectOk(built)
      expect(built.scene.profileBody).toBeUndefined()
      const requested = { x: 232, y: 292 }
      const pocket = pocketCorner(input)
      expect(requested.x).toBeLessThan(pocket.x)
      expect(requested.y).toBeLessThan(pocket.y)
      expect(placeEye(requested, built.scene.occluders)).toEqual(requested)
      expect(built.scene.eye).toEqual(requested)
    }
  })
})
