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
  test('offers four mounts and hides angle plus offset on valance-flush profiles', () => {
    for (const mount of ['radius', 'ell', 'triangle'] as const) {
      const html = renderControls(mount)
      expect(html).toContain('value="downward"')
      expect(html).toContain('value="radius"')
      expect(html).toContain('value="ell"')
      expect(html).toContain('value="triangle"')
      expect(html).not.toContain('id="led-offset"')
      expect(html).not.toContain('id="led-angle"')
      expect(html).toContain('id="led-width"')
    }
  })

  test('shows wall offset on downward and never shows emit angle', () => {
    const html = renderControls('downward')
    expect(html).toContain('id="led-offset"')
    expect(html).not.toContain('id="led-angle"')
  })
})
