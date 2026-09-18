import { describe, expect, test } from 'vitest'
import {
  evaluateScene,
  isDirectlyLit,
  pointInLitRegion,
} from '../../src/geometry'
import { firstHitOnRay, roomBounds } from '../../src/geometry/litRegion'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

describe('direct-lit region', () => {
  test('eye membership matches hasDirectGlare', () => {
    const glaring = evaluateScene(
      baseInput({
        lower: { depth: 80, thickness: 18, heightFromFloor: 1200 },
        led: {
          mount: 'downward',
          width: 10,
          offsetFromWall: 40,
          profileDrop: 2,
        },
        viewer: { distance: 200, eyeHeight: -80 },
      }),
    )
    const blocked = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        gap: 300,
        blend: { height: 80, thickness: 20 },
        led: {
          mount: 'downward',
          width: 20,
          offsetFromWall: 50,
          profileDrop: 2,
        },
        viewer: { distance: 400, eyeHeight: 100 },
      }),
    )
    expectOk(glaring)
    expectOk(blocked)
    expect(isDirectlyLit(glaring.scene, glaring.scene.eye)).toBe(
      glaring.evaluation.hasDirectGlare,
    )
    expect(isDirectlyLit(blocked.scene, blocked.scene.eye)).toBe(
      blocked.evaluation.hasDirectGlare,
    )
    expect(glaring.evaluation.hasDirectGlare).toBe(true)
    expect(blocked.evaluation.hasDirectGlare).toBe(false)
    expect(
      pointInLitRegion(glaring.evaluation.litRegion, glaring.scene.eye),
    ).toBe(true)
    expect(
      pointInLitRegion(blocked.evaluation.litRegion, blocked.scene.eye),
    ).toBe(false)
  })

  test('a point on the planting plane under a downward strip is lit', () => {
    const result = evaluateScene(
      baseInput({
        lower: { depth: 30, thickness: 18, heightFromFloor: 1200 },
        blend: { height: 0, thickness: 0 },
        led: {
          mount: 'downward',
          width: 10,
          offsetFromWall: 40,
          profileDrop: 2,
        },
      }),
    )
    expectOk(result)
    const under = { x: 45, y: 0 }
    expect(isDirectlyLit(result.scene, under)).toBe(true)
    expect(pointInLitRegion(result.evaluation.litRegion, under)).toBe(true)
  })

  test('a point in the valance shadow is not lit', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        gap: 300,
        blend: { height: 80, thickness: 20 },
        led: {
          mount: 'downward',
          width: 20,
          offsetFromWall: 50,
          profileDrop: 2,
        },
      }),
    )
    expectOk(result)
    const shadow = { x: 220, y: 250 }
    expect(isDirectlyLit(result.scene, shadow)).toBe(false)
    expect(pointInLitRegion(result.evaluation.litRegion, shadow)).toBe(false)
  })

  function pocketInput(
    mount: 'triangle' | 'ell' | 'radius',
  ) {
    return baseInput({
      upper: { depth: 250, thickness: 20 },
      lower: { depth: 280, thickness: 40, heightFromFloor: 1200 },
      gap: 350,
      blend: { height: 40, thickness: 12 },
      led: {
        mount,
        width: 16,
        profileDrop: 2,
        offsetFromWall: 0,
      },
    })
  }

  test('air opposite a triangle emit face is filled', () => {
    const result = evaluateScene(pocketInput('triangle'))
    expectOk(result)
    const opposite = { x: 180, y: 250 }
    const hole = { x: 265, y: 80 }
    expect(isDirectlyLit(result.scene, opposite)).toBe(true)
    expect(pointInLitRegion(result.evaluation.litRegion, opposite)).toBe(true)
    expect(isDirectlyLit(result.scene, hole)).toBe(true)
    expect(pointInLitRegion(result.evaluation.litRegion, hole)).toBe(true)
  })

  test('a ray starting on the valance face hits it instead of passing through', () => {
    const result = evaluateScene(pocketInput('ell'))
    expectOk(result)
    const hit = firstHitOnRay(
      { x: 238, y: 332 },
      { x: 1, y: 0 },
      result.scene.occluders,
      roomBounds(result.scene),
    )
    expect(hit).not.toBeNull()
    expect(hit && hit.x).toBeLessThan(250)
  })

  test('fill does not pass through the valance for ell and radius', () => {
    const behindValance = { x: 255, y: 330 }
    const pastValance = { x: 320, y: 280 }
    for (const mount of ['ell', 'radius'] as const) {
      const result = evaluateScene(pocketInput(mount))
      expectOk(result)
      expect(isDirectlyLit(result.scene, behindValance)).toBe(false)
      expect(pointInLitRegion(result.evaluation.litRegion, behindValance)).toBe(
        false,
      )
      expect(isDirectlyLit(result.scene, pastValance)).toBe(false)
      expect(pointInLitRegion(result.evaluation.litRegion, pastValance)).toBe(
        false,
      )
    }
  })

  test('returned region stays on or above the floor and in front of the wall', () => {
    const result = evaluateScene(
      baseInput({
        lower: { depth: 200, thickness: 18, heightFromFloor: 1200 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.litRegion.length).toBeGreaterThan(0)
    expect(
      result.evaluation.litRegion.every((polygon) =>
        polygon.every((point) => point.y >= -1200 && point.x >= 0),
      ),
    ).toBe(true)
  })
})
