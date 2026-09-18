import { describe, expect, test } from 'vitest'
import { INTERIOR_SAMPLE_COUNT, evaluateScene } from '../../src/geometry'
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
          emitAngle: 45,
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
          emitAngle: 45,
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
          emitAngle: 45,
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
          emitAngle: 45,
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
          emitAngle: 45,
        },
        viewer: { distance: 220, eyeHeight: 120 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.samples[0]?.occluded).toBe(false)
    expect(result.evaluation.samples.at(-1)?.occluded).toBe(true)
    expect(result.evaluation.hasDirectGlare).toBe(true)
  })

  test('corner mount still glares when looking from below into the room', () => {
    const result = evaluateScene(
      baseInput({
        lower: { depth: 50, thickness: 18 },
        blend: { height: 0, thickness: 10 },
        led: {
          mount: 'corner',
          width: 12,
          profileDrop: 2,
          emitAngle: 45,
          offsetFromWall: 0,
        },
        viewer: { distance: 200, eyeHeight: -100 },
      }),
    )
    expectOk(result)
    expect(result.evaluation.hasDirectGlare).toBe(true)
    expect(result.evaluation.samples.some((sample) => !sample.occluded)).toBe(
      true,
    )
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
          emitAngle: 45,
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
