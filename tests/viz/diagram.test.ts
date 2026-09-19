import { describe, expect, test } from 'vitest'
import { evaluateScene, pocketCorner } from '../../src/geometry'
import { buildDiagram } from '../../src/viz/diagram'
import { DEFAULT_PARAMS } from '../../src/state/params'
import { expectOk } from '../expectOk'
import { baseInput } from '../geometry/fixtures'

describe('side-view diagram model', () => {
  test('draws the LED as a strip with the scene width, not a point', () => {
    const input = baseInput({ led: { width: 18, mount: 'downward' } })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    expect(diagram.led.kind).toBe('strip')
    if (diagram.led.kind !== 'strip') return
    const length = Math.hypot(
      diagram.led.b.x - diagram.led.a.x,
      diagram.led.b.y - diagram.led.a.y,
    )
    expect(length).toBeCloseTo(18)
    expect(length).toBeGreaterThan(1)
  })

  test('triangle body sits in the valance pocket, not as a wall segment', () => {
    const input = baseInput({
      blend: { height: 40, thickness: 12 },
      led: {
        mount: 'triangle',
        width: 20,
        profileDrop: 2,
        offsetFromWall: 0,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    expect(diagram.led.kind).toBe('triangle')
    if (diagram.led.kind !== 'triangle') return
    const pocket = pocketCorner(input)
    expect(diagram.led.a.x).toBeCloseTo(pocket.x)
    expect(diagram.led.a.y).toBeCloseTo(pocket.y)
    expect(
      Math.min(diagram.led.a.x, diagram.led.b.x, diagram.led.c.x),
    ).toBeGreaterThan(50)
  })

  test('radius body is a quarter-circle of radius W in the pocket', () => {
    const input = baseInput({
      blend: { height: 30, thickness: 10 },
      led: {
        mount: 'radius',
        width: 14,
        profileDrop: 2,
        offsetFromWall: 0,
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    expect(diagram.led.kind).toBe('quarterCircle')
    if (diagram.led.kind !== 'quarterCircle') return
    expect(diagram.led.radius).toBeCloseTo(14)
    expect(diagram.led.center.x).toBeCloseTo(pocketCorner(input).x)
  })

  test('floor sits at -H and the wall reaches it', () => {
    const input = baseInput({
      lower: { depth: 200, thickness: 18, heightFromFloor: 1200 },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    expect(diagram.floor.a.y).toBe(-1200)
    expect(diagram.floor.b.y).toBe(-1200)
    expect(Math.min(diagram.wall.a.y, diagram.wall.b.y)).toBe(-1200)
    expect(diagram.led.kind).toBe('strip')
    if (diagram.led.kind !== 'strip') return
    expect(
      Math.hypot(
        diagram.led.b.x - diagram.led.a.x,
        diagram.led.b.y - diagram.led.a.y,
      ),
    ).toBeGreaterThan(1)
  })

  test('view stays on the shelves and the eye, not the far room clip', () => {
    const input = baseInput({
      lower: { depth: 80, thickness: 18, heightFromFloor: 1200 },
      viewer: { distance: 600, eyeHeight: 180 },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    const frameX = Math.max(
      result.scene.lower.width,
      result.scene.upper.width,
      result.scene.eye.x,
    )
    expect(diagram.floor.b.x).toBeGreaterThanOrEqual(frameX)
    expect(diagram.bounds.maxX).toBeGreaterThanOrEqual(frameX)
    expect(diagram.bounds.maxX).toBeLessThan(2500)
    expect(diagram.bounds.minY).toBeLessThanOrEqual(-1200)
    expect(diagram.litRegion.length).toBeGreaterThan(0)
  })

  test('recessed channel exposes a groove cutout and a milk segment, not a point', () => {
    const input = baseInput({
      led: {
        mount: 'recessed25',
        width: 10,
        profileDrop: 2,
        offsetFromWall: 40,
        facing: 'wall',
      },
    })
    const result = evaluateScene(input)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    expect(diagram.groove).toBeDefined()
    expect(diagram.groove?.width).toBeCloseTo(35)
    expect(diagram.groove?.height).toBeCloseTo(14)
    expect(diagram.led.kind).toBe('recessed')
    if (diagram.led.kind !== 'recessed') return
    const milk = Math.hypot(
      diagram.led.milkB.x - diagram.led.milkA.x,
      diagram.led.milkB.y - diagram.led.milkA.y,
    )
    expect(milk).toBeCloseTo(14)
    expect(milk).toBeGreaterThan(1)
    expect(diagram.led.outline.length).toBeGreaterThan(2)
  })

  test('ray occlusion flags match the engine boolean', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    const anyOpen = diagram.rays.some((ray) => !ray.occluded)
    expect(anyOpen).toBe(result.evaluation.hasDirectGlare)
    expect(diagram.plantFan.length).toBeGreaterThan(1)
  })
})
