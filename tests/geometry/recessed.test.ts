import { describe, expect, test } from 'vitest'
import { evaluateScene, placeEye, RECESSED25 } from '../../src/geometry'
import type { Point, Rect, SceneInput } from '../../src/geometry'
import {
  evaluateVisibility,
  isInFront,
  sampleEmitPoints,
  segmentHitsRect,
} from '../../src/geometry/visibility.ts'
import { expectOk } from '../expectOk'
import { baseInput } from './fixtures'

const ANGLE = (RECESSED25.angleFromVerticalDeg * Math.PI) / 180

function recessedInput(overrides: Partial<SceneInput> = {}): SceneInput {
  return baseInput({
    ...overrides,
    led: { ...overrides.led, mount: 'recessed25' },
  })
}

function isInterior(rect: Rect, point: Point): boolean {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  )
}

function segmentOf(result: ReturnType<typeof evaluateScene>) {
  expectOk(result)
  expect(result.scene.emitSurfaces).toHaveLength(1)
  const surface = result.scene.emitSurfaces[0]
  expect(surface?.kind).toBe('segment')
  if (surface?.kind !== 'segment') throw new Error('expected milk segment')
  return { scene: result.scene, evaluation: result.evaluation, surface }
}

describe('recessed25 catalog SKU', () => {
  test('places a 40 mm body from the wall offset with a 35×14 groove between 2.5 mm stops', () => {
    const offset = 40
    const result = evaluateScene(recessedInput({ led: { offsetFromWall: offset } }))
    expectOk(result)
    const groove = result.scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    expect(groove.x).toBeCloseTo(offset + RECESSED25.stopWidth)
    expect(groove.width).toBeCloseTo(RECESSED25.grooveWidth)
    expect(groove.y).toBeCloseTo(300)
    expect(groove.height).toBeCloseTo(RECESSED25.grooveDepth)
    expect(groove.x + groove.width).toBeCloseTo(
      offset + RECESSED25.bodyWidth - RECESSED25.stopWidth,
    )
  })

  test('milk is 14 mm at 25° from vertical and the window is 27 mm from the lower edge', () => {
    const result = evaluateScene(recessedInput())
    const { surface, scene } = segmentOf(result)
    const length = Math.hypot(surface.b.x - surface.a.x, surface.b.y - surface.a.y)
    expect(length).toBeCloseTo(RECESSED25.milkLength)
    const lower = surface.a.y <= surface.b.y ? surface.a : surface.b
    const upper = surface.a.y <= surface.b.y ? surface.b : surface.a
    const dx = Math.abs(upper.x - lower.x)
    const dy = Math.abs(upper.y - lower.y)
    expect(dx).toBeCloseTo(RECESSED25.milkLength * Math.sin(ANGLE))
    expect(dy).toBeCloseTo(RECESSED25.milkLength * Math.cos(ANGLE))
    const groove = scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    const distToLeft = Math.abs(lower.x - groove.x)
    const distToRight = Math.abs(lower.x - (groove.x + groove.width))
    const farWall = distToLeft > distToRight ? groove.x : groove.x + groove.width
    expect(Math.max(distToLeft, distToRight)).toBeCloseTo(RECESSED25.windowWidth)
    expect(Math.abs(upper.x - farWall)).toBeLessThan(Math.abs(lower.x - farWall))
    expect(lower.y).toBeCloseTo(scene.upper.y)
  })

  test('led.width does not move the milk', () => {
    const narrow = evaluateScene(recessedInput({ led: { width: 8 } }))
    const wide = evaluateScene(recessedInput({ led: { width: 30 } }))
    const a = segmentOf(narrow).surface
    const b = segmentOf(wide).surface
    expect(a.a).toEqual(b.a)
    expect(a.b).toEqual(b.b)
  })

  test('profileDrop does not move the groove', () => {
    const low = evaluateScene(recessedInput({ led: { profileDrop: 0 } }))
    const high = evaluateScene(recessedInput({ led: { profileDrop: 20 } }))
    expectOk(low)
    expectOk(high)
    expect(low.scene.groove).toEqual(high.scene.groove)
  })
})

describe('recessed25 cutout and facing', () => {
  test('splits the upper shelf into a cap and two cheeks; the groove is air', () => {
    const result = evaluateScene(recessedInput())
    expectOk(result)
    const { upper, groove, occluders } = result.scene
    expect(groove).toBeDefined()
    if (!groove) return
    expect(
      occluders.some(
        (rect) =>
          rect.x === upper.x &&
          rect.y === upper.y &&
          rect.width === upper.width &&
          rect.height === upper.height,
      ),
    ).toBe(false)
    const cap = occluders.find(
      (rect) =>
        rect.y === groove.y + groove.height &&
        rect.height === upper.height - groove.height &&
        rect.width === upper.width,
    )
    const wallCheek = occluders.find(
      (rect) => rect.x === 0 && rect.y === upper.y && rect.width === groove.x,
    )
    const frontCheek = occluders.find(
      (rect) =>
        rect.x === groove.x + groove.width &&
        rect.y === upper.y &&
        rect.width === upper.x + upper.width - (groove.x + groove.width),
    )
    expect(cap).toBeDefined()
    expect(wallCheek).toBeDefined()
    expect(frontCheek).toBeDefined()
    const cavity = { x: groove.x + 8, y: groove.y + 4 }
    expect(occluders.some((rect) => isInterior(rect, cavity))).toBe(false)
  })

  test('milk samples start in groove air, not in wood', () => {
    const result = evaluateScene(recessedInput())
    const { scene, surface } = segmentOf(result)
    const groove = scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    const wood = scene.occluders.filter(
      (rect) => rect.y >= scene.upper.y && rect.x + rect.width <= scene.upper.x + scene.upper.width,
    )
    for (const { from } of sampleEmitPoints(surface)) {
      const inGroove =
        from.x >= groove.x - 1e-3 &&
        from.x <= groove.x + groove.width + 1e-3 &&
        from.y >= groove.y - 1e-3 &&
        from.y <= groove.y + groove.height + 1e-3
      const justOutsideMouth = from.y < groove.y && from.y > groove.y - 1
      expect(inGroove || justOutsideMouth).toBe(true)
      expect(wood.some((rect) => isInterior(rect, from))).toBe(false)
    }
  })

  test('a cheek blocks a path that crosses the remaining shelf wood', () => {
    const result = evaluateScene(recessedInput())
    const { scene, surface } = segmentOf(result)
    const groove = scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    const wallCheek = scene.occluders.find(
      (rect) => rect.x === 0 && rect.y === scene.upper.y && rect.width === groove.x,
    )
    expect(wallCheek).toBeDefined()
    if (!wallCheek) return
    const from = sampleEmitPoints(surface)[0]?.from
    expect(from).toBeDefined()
    if (!from) return
    const throughCheek = { x: 8, y: scene.upper.y + 7 }
    expect(isInterior(wallCheek, throughCheek)).toBe(true)
    expect(segmentHitsRect(from, throughCheek, wallCheek)).toBe(true)
    const visibility = evaluateVisibility({ ...scene, eye: throughCheek })
    expect(visibility.samples.some((sample) => sample.occluded)).toBe(true)
  })

  test('wall facing opens the 27 mm window toward the wall', () => {
    const result = evaluateScene(recessedInput({ led: { facing: 'wall' } }))
    const { surface, scene } = segmentOf(result)
    const groove = scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    const lower = surface.a.y <= surface.b.y ? surface.a : surface.b
    expect(lower.x).toBeCloseTo(groove.x + RECESSED25.windowWidth)
    const inBay = { x: groove.x + 10, y: scene.upper.y - 20 }
    expect(isInFront(lower, inBay, surface.normal)).toBe(true)
  })

  test('room facing mirrors internals and keeps the 40 mm span', () => {
    const wall = evaluateScene(recessedInput({ led: { facing: 'wall' } }))
    const room = evaluateScene(recessedInput({ led: { facing: 'room' } }))
    expectOk(wall)
    expectOk(room)
    expect(wall.scene.groove).toEqual(room.scene.groove)
    const wallMilk = segmentOf(wall).surface
    const roomMilk = segmentOf(room).surface
    const wallLower = wallMilk.a.y <= wallMilk.b.y ? wallMilk.a : wallMilk.b
    const roomLower = roomMilk.a.y <= roomMilk.b.y ? roomMilk.a : roomMilk.b
    const groove = room.scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    expect(roomLower.x).toBeCloseTo(groove.x + groove.width - RECESSED25.windowWidth)
    const bodyMid = groove.x - RECESSED25.stopWidth + RECESSED25.bodyWidth / 2
    expect(roomLower.x).toBeCloseTo(2 * bodyMid - wallLower.x)
    const inRoom = { x: groove.x + groove.width - 10, y: room.scene.upper.y - 20 }
    expect(isInFront(roomLower, inRoom, roomMilk.normal)).toBe(true)
  })

  test('keeps an eye in groove air and pushes an eye out of a cheek', () => {
    const result = evaluateScene(recessedInput())
    expectOk(result)
    const groove = result.scene.groove
    expect(groove).toBeDefined()
    if (!groove) return
    const inAir = { x: groove.x + 12, y: groove.y + 6 }
    expect(placeEye(inAir, result.scene.occluders, result.scene.floorY)).toEqual(inAir)
    const inCheek = { x: 8, y: result.scene.upper.y + 7 }
    const placed = placeEye(inCheek, result.scene.occluders, result.scene.floorY)
    const wallCheek = result.scene.occluders.find(
      (rect) => rect.x === 0 && rect.y === result.scene.upper.y && rect.width === groove.x,
    )
    expect(wallCheek).toBeDefined()
    if (!wallCheek) return
    expect(isInterior(wallCheek, inCheek)).toBe(true)
    expect(isInterior(wallCheek, placed)).toBe(false)
  })
})

describe('recessed25 validation', () => {
  test('rejects a shelf thinner than the 14 mm groove', () => {
    const result = evaluateScene(
      recessedInput({ upper: { depth: 250, thickness: 12 } }),
    )
    expect(result.ok).toBe(false)
  })

  test('rejects a 40 mm body past the front edge', () => {
    const result = evaluateScene(
      recessedInput({
        upper: { depth: 80, thickness: 18 },
        led: { offsetFromWall: 50 },
      }),
    )
    expect(result.ok).toBe(false)
  })

  test('does not reject recessed25 for leftover zero width', () => {
    const result = evaluateScene(recessedInput({ led: { width: 0 } }))
    expect(result.ok).toBe(true)
  })

  test('still rejects zero width on downward and valance-flush mounts', () => {
    for (const mount of ['downward', 'radius', 'ell', 'triangle'] as const) {
      const result = evaluateScene(
        baseInput({
          led: { mount, width: 0, profileDrop: 2, offsetFromWall: 40 },
        }),
      )
      expect(result.ok).toBe(false)
    }
  })
})
