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
        view: 'glare',
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

  test('always draws the floor and keeps the eye in both views', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    for (const view of ['glare', 'lit'] as const) {
      const html = renderToStaticMarkup(
        createElement(SectionView, {
          scene: result.scene,
          evaluation: result.evaluation,
          view,
          onEyeMove: () => undefined,
        }),
      )
      expect(attr(html, 'diagram', 'data-view')).toBe(view)
      expect(html).toContain('data-testid="floor"')
      expect(html).toContain('data-testid="eye"')
    }
  })

  test('fill mode hides emit-to-eye rays and the plant fan', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    const html = renderToStaticMarkup(
      createElement(SectionView, {
        scene: result.scene,
        evaluation: result.evaluation,
        view: 'lit',
        onEyeMove: () => undefined,
      }),
    )
    expect(html).toContain('data-testid="lit-region"')
    expect(html).not.toContain('ray-open')
    expect(html).not.toContain('ray-blocked')
    expect(html).not.toContain('plant-fan')
  })

  test('draws a recessed cutout and milk for both facings', () => {
    for (const facing of ['wall', 'room'] as const) {
      const result = evaluateScene({
        ...DEFAULT_PARAMS,
        led: {
          ...DEFAULT_PARAMS.led,
          mount: 'recessed25',
          offsetFromWall: 40,
          facing,
        },
      })
      expectOk(result)
      const html = renderToStaticMarkup(
        createElement(SectionView, {
          scene: result.scene,
          evaluation: result.evaluation,
          view: 'glare',
          onEyeMove: () => undefined,
        }),
      )
      expect(html).toContain('data-kind="recessed"')
      expect(html).toContain('data-testid="led-milk"')
      expect(html).toContain('data-testid="shelf-upper"')
      expect(html).toMatch(/fill-rule="evenodd"|fillRule="evenodd"/)
      expect(html).toMatch(/ray-open|ray-blocked/)
    }
  })

  test('glare mode shows rays and no fill polygons', () => {
    const result = evaluateScene(DEFAULT_PARAMS)
    expectOk(result)
    const html = renderToStaticMarkup(
      createElement(SectionView, {
        scene: result.scene,
        evaluation: result.evaluation,
        view: 'glare',
        onEyeMove: () => undefined,
      }),
    )
    expect(html).toMatch(/ray-open|ray-blocked/)
    expect(html).toContain('plant-fan')
    expect(html).not.toContain('data-testid="lit-region"')
  })
})
