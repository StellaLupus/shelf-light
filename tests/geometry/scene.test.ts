import { describe, expect, test } from 'vitest'
import { evaluateScene, pocketCorner } from '../../src/geometry'
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

  test('places a triangle right-angle in the valance pocket, not at the wall', () => {
    const input = baseInput({
      gap: 300,
      blend: { height: 40, thickness: 12 },
      led: {
        mount: 'triangle',
        width: 20,
        profileDrop: 6,
        offsetFromWall: 40,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const pocket = pocketCorner(input)
    const width = input.led.width
    expect(result.scene.profileShape.kind).toBe('triangle')
    if (result.scene.profileShape.kind !== 'triangle') return
    expect(result.scene.profileShape.a.x).toBeCloseTo(pocket.x)
    expect(result.scene.profileShape.a.y).toBeCloseTo(pocket.y)
    expect(
      Math.hypot(
        result.scene.profileShape.b.x - result.scene.profileShape.a.x,
        result.scene.profileShape.b.y - result.scene.profileShape.a.y,
      ),
    ).toBeCloseTo(width)
    expect(
      Math.hypot(
        result.scene.profileShape.c.x - result.scene.profileShape.a.x,
        result.scene.profileShape.c.y - result.scene.profileShape.a.y,
      ),
    ).toBeCloseTo(width)
    expect(result.scene.emitSurfaces).toHaveLength(1)
    const surface = result.scene.emitSurfaces[0]
    expect(surface?.kind).toBe('segment')
    if (surface?.kind !== 'segment') return
    expect(
      Math.hypot(surface.b.x - surface.a.x, surface.b.y - surface.a.y),
    ).toBeCloseTo(width * Math.SQRT2)
    expect(Math.min(surface.a.x, surface.b.x)).toBeGreaterThan(100)
  })

  test('places a radius pocket at the front edge when valance thickness is 0', () => {
    const input = baseInput({
      upper: { depth: 180, thickness: 18 },
      blend: { height: 0, thickness: 0 },
      led: {
        mount: 'radius',
        width: 16,
        profileDrop: 4,
        offsetFromWall: 0,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const pocket = pocketCorner(input)
    expect(pocket.x).toBeCloseTo(180)
    const surface = result.scene.emitSurfaces[0]
    expect(surface?.kind).toBe('arc')
    if (surface?.kind !== 'arc') return
    expect(surface.center.x).toBeCloseTo(pocket.x)
    expect(surface.center.y).toBeCloseTo(pocket.y)
    expect(surface.center.x).toBeCloseTo(input.upper.depth)
  })

  test('rejects a valance-flush profile that would cross the wall', () => {
    const result = evaluateScene(
      baseInput({
        upper: { depth: 80, thickness: 18 },
        blend: { height: 20, thickness: 20 },
        led: {
          mount: 'triangle',
          width: 70,
          profileDrop: 2,
          offsetFromWall: 0,
        },
      }),
    )
    expect(result.ok).toBe(false)
  })

  test('models radius as a quarter-circle of radius W into the bay', () => {
    const input = baseInput({
      blend: { height: 30, thickness: 12 },
      led: {
        mount: 'radius',
        width: 18,
        profileDrop: 3,
        offsetFromWall: 0,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const pocket = pocketCorner(input)
    const surface = result.scene.emitSurfaces[0]
    expect(surface?.kind).toBe('arc')
    if (surface?.kind !== 'arc') return
    expect(surface.radius).toBeCloseTo(18)
    expect(surface.center.x).toBeCloseTo(pocket.x)
    expect(surface.center.y).toBeCloseTo(pocket.y)
    expect(surface.startAngle).toBeCloseTo(Math.PI)
    expect(surface.endAngle).toBeCloseTo((3 * Math.PI) / 2)
    const start = {
      x: surface.center.x + surface.radius * Math.cos(surface.startAngle),
      y: surface.center.y + surface.radius * Math.sin(surface.startAngle),
    }
    const end = {
      x: surface.center.x + surface.radius * Math.cos(surface.endAngle),
      y: surface.center.y + surface.radius * Math.sin(surface.endAngle),
    }
    expect(start.x).toBeCloseTo(pocket.x - 18)
    expect(start.y).toBeCloseTo(pocket.y)
    expect(end.x).toBeCloseTo(pocket.x)
    expect(end.y).toBeCloseTo(pocket.y - 18)
  })

  test('models ell as a W-square with wall-facing and downward emit faces', () => {
    const input = baseInput({
      blend: { height: 30, thickness: 14 },
      led: {
        mount: 'ell',
        width: 16,
        profileDrop: 2,
        offsetFromWall: 0,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const pocket = pocketCorner(input)
    const width = 16
    expect(result.scene.profileBody).toEqual({
      x: pocket.x - width,
      y: pocket.y - width,
      width,
      height: width,
    })
    const segments = result.scene.emitSurfaces.filter(
      (surface) => surface.kind === 'segment',
    )
    expect(segments).toHaveLength(2)
    const wallFace = segments.find((surface) => surface.normal.x < 0)
    const downFace = segments.find((surface) => surface.normal.y < 0)
    expect(wallFace).toBeDefined()
    expect(downFace).toBeDefined()
    if (!wallFace || !downFace) return
    expect(wallFace.a.x).toBeCloseTo(pocket.x - width)
    expect(wallFace.b.x).toBeCloseTo(pocket.x - width)
    expect(downFace.a.y).toBeCloseTo(pocket.y - width)
    expect(downFace.b.y).toBeCloseTo(pocket.y - width)
  })

  test('places a downward emitter as a horizontal window under the upper shelf', () => {
    const result = evaluateScene(
      baseInput({
        led: {
          mount: 'downward',
          width: 16,
          offsetFromWall: 40,
          profileDrop: 2,
        },
      }),
    )
    expectOk(result)
    const surface = result.scene.emitSurfaces[0]
    expect(surface?.kind).toBe('segment')
    if (surface?.kind !== 'segment') return
    expect(surface.a.y).toBeCloseTo(surface.b.y)
    expect(surface.a.x).toBeCloseTo(40)
    expect(surface.b.x).toBeCloseTo(56)
    expect(surface.b.x).toBeLessThanOrEqual(250)
    expect(result.scene.profileShape.kind).toBe('strip')
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
        },
      }),
    )
    expect(result.ok).toBe(false)
  })

  test('rejects a shelf with zero thickness', () => {
    const result = evaluateScene(
      baseInput({ upper: { depth: 250, thickness: 0 } }),
    )
    expect(result.ok).toBe(false)
  })
})
