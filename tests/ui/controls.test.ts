import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import type { MountType } from '../../src/geometry'
import { DEFAULT_PARAMS } from '../../src/state/params'
import { Controls } from '../../src/ui/Controls.tsx'

function renderControls(mount: MountType): string {
  return renderToStaticMarkup(
    createElement(Controls, {
      params: { ...DEFAULT_PARAMS, led: { ...DEFAULT_PARAMS.led, mount } },
      onChange: () => undefined,
    }),
  )
}

describe('mount controls', () => {
  test('offers five mounts and hides angle plus offset on valance-flush profiles', () => {
    for (const mount of ['radius', 'ell', 'triangle'] as const) {
      const html = renderControls(mount)
      expect(html).toContain('value="downward"')
      expect(html).toContain('value="radius"')
      expect(html).toContain('value="ell"')
      expect(html).toContain('value="triangle"')
      expect(html).toContain('value="recessed25"')
      expect(html).not.toContain('id="led-offset"')
      expect(html).not.toContain('id="led-angle"')
      expect(html).not.toContain('data-testid="led-facing"')
      expect(html).toContain('id="led-width"')
    }
  })

  test('shows wall offset on downward and never shows emit angle or facing', () => {
    const html = renderControls('downward')
    expect(html).toContain('id="led-offset"')
    expect(html).toContain('id="led-width"')
    expect(html).not.toContain('id="led-angle"')
    expect(html).not.toContain('data-testid="led-facing"')
  })

  test('recessed shows offset and facing, hides width, drop, and angle', () => {
    const html = renderControls('recessed25')
    expect(html).toContain('id="led-offset"')
    expect(html).toContain('data-testid="led-facing"')
    expect(html).toContain('К стене')
    expect(html).toContain('В комнату')
    expect(html).not.toContain('id="led-width"')
    expect(html).not.toContain('id="led-drop"')
    expect(html).not.toContain('id="led-angle"')
    expect(html).toMatch(/id="upper-thickness"[^>]*min="14"/)
  })

  test('still exposes viewer distance and height fields', () => {
    const html = renderControls('downward')
    expect(html).toContain('id="viewer-distance"')
    expect(html).toContain('id="viewer-height"')
    expect(html).toContain('id="lower-from-floor"')
    expect(html).toContain('Стоя')
    expect(html).toContain('Сидя')
    expect(html).toContain('Лёжа')
  })
})
