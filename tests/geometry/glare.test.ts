import { describe, expect, test } from 'vitest'
import { INTERIOR_SAMPLE_COUNT, evaluateScene, pocketCorner } from '../../src/geometry'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

describe('direct glare', () => {
  test('reports glare when only the outer emit point is unobstructed', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 250, thickness: 18 },
        lower: { depth: 200, thickness: 18 },
        gap: 300,
        blend: { height: 0, thickness: 10 },
        led: {
          mount: 'downward',
          width: 60,
          offsetFromWall: 20,
          profileDrop: 2,
        },
        viewer: { distance: 250, eyeHeight: -100 },
      }),
    )
    expectOk(result)
    const inner = result.evaluation.samples[0]
    const outer = result.evaluation.samples.at(-1)
    expect(inner?.occluded).toBe(true)
    expect(outer?.occluded).toBe(false)
    expect(result.evaluation.hasDirectGlare).toBe(true)
  })

  test('valance can occlude the outer emit-to-eye segment', () => {
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
        viewer: { distance: 400, eyeHeight: 100 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.samples.at(-1)?.occluded).toBe(true)
  })

  test('a deeper lower shelf can occlude a previously open path', () => {
    const glaring = evaluateScene(
      baseInput({
        lower: { depth: 80, thickness: 18 },
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
        lower: { depth: 180, thickness: 18 },
        led: {
          mount: 'downward',
          width: 10,
          offsetFromWall: 40,
          profileDrop: 2,
        },
        viewer: { distance: 200, eyeHeight: -80 },
      }),
    )
    expectOk(glaring)
    expectOk(blocked)
    expect(glaring.evaluation.hasDirectGlare).toBe(true)
    expect(blocked.evaluation.samples[0]?.occluded).toBe(true)
  })

  test('inner edge can glare when looking up under the shelf', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        gap: 300,
        blend: { height: 80, thickness: 10 },
        led: {
          mount: 'downward',
          width: 30,
          offsetFromWall: 140,
          profileDrop: 2,
        },
        viewer: { distance: 220, eyeHeight: 120 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.samples[0]?.occluded).toBe(false)
    expect(result.evaluation.samples.at(-1)?.occluded).toBe(true)
    expect(result.evaluation.hasDirectGlare).toBe(true)
  })

  test('ell body occludes a through-body ray from the wall-facing face', () => {
    const input = baseInput({
      upper: { depth: 200, thickness: 18 },
      lower: { depth: 40, thickness: 18 },
      gap: 300,
      blend: { height: 20, thickness: 20 },
      led: {
        mount: 'ell',
        width: 20,
        profileDrop: 0,
        offsetFromWall: 0,
      },
      viewer: { distance: 400, eyeHeight: 290 },
    })
    const result = evaluateScene(input)
    expectOk(result)
    expect(result.scene.profileBody).toBeDefined()
    expect(
      result.scene.occluders.some(
        (rect) =>
          rect.x === result.scene.profileBody?.x &&
          rect.width === input.led.width,
      ),
    ).toBe(true)
    const pocket = pocketCorner(input)
    const wallFaceSamples = result.evaluation.samples.filter(
      (sample) => sample.from.x < pocket.x - input.led.width + 0.5,
    )
    expect(wallFaceSamples.length).toBeGreaterThan(0)
    expect(wallFaceSamples.every((sample) => sample.occluded)).toBe(true)
  })

  test('ell glares if either emit face has an open path', () => {
    const fromWallFace = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        lower: { depth: 40, thickness: 18 },
        gap: 300,
        blend: { height: 10, thickness: 20 },
        led: {
          mount: 'ell',
          width: 20,
          profileDrop: 0,
          offsetFromWall: 0,
        },
        viewer: { distance: 30, eyeHeight: 50 },
      }),
    )
    const fromDownFace = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        lower: { depth: 40, thickness: 18 },
        gap: 300,
        blend: { height: 10, thickness: 20 },
        led: {
          mount: 'ell',
          width: 20,
          profileDrop: 0,
          offsetFromWall: 0,
        },
        viewer: { distance: 400, eyeHeight: -50 },
      }),
    )
    expectOk(fromWallFace)
    expectOk(fromDownFace)
    expect(fromWallFace.evaluation.hasDirectGlare).toBe(true)
    expect(fromDownFace.evaluation.hasDirectGlare).toBe(true)
  })

  test('radius arc samples ends plus at least 16 interior points', () => {
    const result = evaluateScene(
      baseInput({
        blend: { height: 20, thickness: 12 },
        led: {
          mount: 'radius',
          width: 16,
          profileDrop: 2,
          offsetFromWall: 0,
        },
      }),
    )
    expectOk(result)
    expect(result.evaluation.samples.length).toBe(INTERIOR_SAMPLE_COUNT + 2)
  })

  test('triangle and radius glare when looking up into the bay from the wall', () => {
    const viewer = { distance: 30, eyeHeight: 50 }
    const shared = {
      upper: { depth: 200, thickness: 18 },
      lower: { depth: 40, thickness: 18 },
      gap: 300,
      blend: { height: 10, thickness: 20 },
      viewer,
    }
    const triangle = evaluateScene(
      baseInput({
        ...shared,
        led: {
          mount: 'triangle',
          width: 20,
          profileDrop: 0,
          offsetFromWall: 0,
        },
      }),
    )
    const radius = evaluateScene(
      baseInput({
        ...shared,
        led: {
          mount: 'radius',
          width: 20,
          profileDrop: 0,
          offsetFromWall: 0,
        },
      }),
    )
    expectOk(triangle)
    expectOk(radius)
    expect(triangle.evaluation.hasDirectGlare).toBe(true)
    expect(radius.evaluation.hasDirectGlare).toBe(true)
  })

  test('downward window and profileDrop stay on the underside line', () => {
    const profileDrop = 8
    const result = evaluateScene(
      baseInput({
        gap: 300,
        led: {
          mount: 'downward',
          width: 12,
          offsetFromWall: 40,
          profileDrop,
        },
      }),
    )
    expectOk(result)
    const surface = result.scene.emitSurfaces[0]
    expect(surface?.kind).toBe('segment')
    if (surface?.kind !== 'segment') return
    expect(surface.a.y).toBeCloseTo(300 - profileDrop)
    expect(surface.b.y).toBeCloseTo(300 - profileDrop)
  })

  test('reports no glare when every sample is occluded', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 200, thickness: 18 },
        gap: 300,
        blend: { height: 200, thickness: 20 },
        led: {
          mount: 'downward',
          width: 10,
          offsetFromWall: 50,
          profileDrop: 2,
        },
        viewer: { distance: 400, eyeHeight: 200 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.samples.every((sample) => sample.occluded)).toBe(
      true,
    )
    expect(result.evaluation.hasDirectGlare).toBe(false)
  })

  test('hasDirectGlare matches unobstructed samples and samples ends plus interiors', () => {
    const result = evaluateScene(baseInput())
    expectOk(result)
    expect(result.evaluation.samples.length).toBe(INTERIOR_SAMPLE_COUNT + 2)
    const anyOpen = result.evaluation.samples.some((sample) => !sample.occluded)
    expect(result.evaluation.hasDirectGlare).toBe(anyOpen)
  })
})
