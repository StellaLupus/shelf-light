import type { SceneInput } from '../../src/geometry'

const defaults: SceneInput = {
  upper: { depth: 250, thickness: 18 },
  lower: { depth: 200, thickness: 18, heightFromFloor: 1200 },
  gap: 300,
  blend: { height: 0, thickness: 10 },
  led: {
    width: 10,
    mount: 'downward',
    profileDrop: 2,
    offsetFromWall: 40,
  },
  viewer: { distance: 500, eyeHeight: 120 },
}

export function baseInput(overrides: Partial<SceneInput> = {}): SceneInput {
  return {
    ...defaults,
    ...overrides,
    upper: { ...defaults.upper, ...overrides.upper },
    lower: { ...defaults.lower, ...overrides.lower },
    blend: { ...defaults.blend, ...overrides.blend },
    led: { ...defaults.led, ...overrides.led },
    viewer: { ...defaults.viewer, ...overrides.viewer },
  }
}
