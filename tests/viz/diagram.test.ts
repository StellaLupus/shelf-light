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

  test('ray occlusion flags match the engine boolean', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    const diagram = buildDiagram(result.scene, result.evaluation)
    const anyOpen = diagram.rays.some((ray) => !ray.occluded)
    expect(anyOpen).toBe(result.evaluation.hasDirectGlare)
    expect(diagram.plantFan.length).toBeGreaterThan(1)
  })
})
