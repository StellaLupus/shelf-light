import { describe, expect, test } from 'vitest'
import { evaluateScene } from '../../src/geometry'
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
    const length = Math.hypot(
      diagram.led.b.x - diagram.led.a.x,
      diagram.led.b.y - diagram.led.a.y,
    )
    expect(length).toBeCloseTo(18)
    expect(length).toBeGreaterThan(1)
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
