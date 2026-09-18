import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { evaluateScene } from '../../src/geometry'
import { DEFAULT_PARAMS } from '../../src/state/params'
import { EYE_HIT_RADIUS, EYE_MARK_RADIUS } from '../../src/viz/coords'
import { SectionView } from '../../src/viz/SectionView'
import { expectOk } from '../expectOk'

function attr(html: string, testId: string, name: string): string | undefined {
  const tag = html.match(new RegExp(`[^<]*data-testid="${testId}"[^>]*>`))
  return tag?.[0]?.match(new RegExp(`${name}="([^"]+)"`))?.[1]
}

describe('eye marker hit target', () => {
  test('draws a grab hit larger than the eye and not on the whole diagram', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    const html = renderToStaticMarkup(
      createElement(SectionView, {
        scene: result.scene,
        evaluation: result.evaluation,
        onEyeMove: () => undefined,
      }),
    )
    expect(EYE_HIT_RADIUS).toBe(15)
    expect(attr(html, 'eye-hit', 'r')).toBe(String(EYE_HIT_RADIUS))
    expect(attr(html, 'eye', 'r')).toBe(String(EYE_MARK_RADIUS))
    expect(EYE_HIT_RADIUS).toBeGreaterThan(EYE_MARK_RADIUS)
    expect(html).toContain('class="eye-hit"')
    expect(html).not.toMatch(/class="diagram"[^>]*cursor/)
    expect(attr(html, 'eye-hit', 'cx')).toBe(attr(html, 'eye', 'cx'))
    expect(attr(html, 'eye-hit', 'cy')).toBe(attr(html, 'eye', 'cy'))
  })
})
