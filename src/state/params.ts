import { evaluateScene, type MountType, type SceneInput } from '../geometry'

export const DEFAULT_PARAMS: SceneInput = {
  upper: { depth: 250, thickness: 18 },
  lower: { depth: 280, thickness: 18 },
  gap: 350,
  blend: { height: 40, thickness: 12 },
  led: {
    width: 10,
    mount: 'downward',
    profileDrop: 2,
    offsetFromWall: 40,
  },
  viewer: { distance: 600, eyeHeight: 180 },
}

function readNumber(value: string | null): number | null {
  if (value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readMount(value: string | null): MountType | null {
  if (value === 'corner') return 'triangle'
  if (
    value === 'downward' ||
    value === 'radius' ||
    value === 'ell' ||
    value === 'triangle'
  ) {
    return value
  }
  return null
}

export function serializeParams(input: SceneInput): URLSearchParams {
  const params = new URLSearchParams()
  params.set('mount', input.led.mount)
  params.set('ud', String(input.upper.depth))
  params.set('ut', String(input.upper.thickness))
  params.set('ld', String(input.lower.depth))
  params.set('lt', String(input.lower.thickness))
  params.set('gap', String(input.gap))
  params.set('bh', String(input.blend.height))
  params.set('bt', String(input.blend.thickness))
  params.set('lw', String(input.led.width))
  params.set('lpd', String(input.led.profileDrop))
  params.set('lo', String(input.led.offsetFromWall))
  params.set('vd', String(input.viewer.distance))
  params.set('vh', String(input.viewer.eyeHeight))
  return params
}

export function parseParams(search: string): SceneInput {
  const query = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
  const next = structuredClone(DEFAULT_PARAMS)
  const mount = readMount(query.get('mount'))
  if (mount !== null) next.led.mount = mount
  const ud = readNumber(query.get('ud'))
  if (ud !== null) next.upper.depth = ud
  const ut = readNumber(query.get('ut'))
  if (ut !== null) next.upper.thickness = ut
  const ld = readNumber(query.get('ld'))
  if (ld !== null) next.lower.depth = ld
  const lt = readNumber(query.get('lt'))
  if (lt !== null) next.lower.thickness = lt
  const gap = readNumber(query.get('gap'))
  if (gap !== null) next.gap = gap
  const bh = readNumber(query.get('bh'))
  if (bh !== null) next.blend.height = bh
  const bt = readNumber(query.get('bt'))
  if (bt !== null) next.blend.thickness = bt
  const lw = readNumber(query.get('lw'))
  if (lw !== null) next.led.width = lw
  const lpd = readNumber(query.get('lpd'))
  if (lpd !== null) next.led.profileDrop = lpd
  const lo = readNumber(query.get('lo'))
  if (lo !== null) next.led.offsetFromWall = lo
  const vd = readNumber(query.get('vd'))
  if (vd !== null) next.viewer.distance = vd
  const vh = readNumber(query.get('vh'))
  if (vh !== null) next.viewer.eyeHeight = vh
  return next
}

export function applyViewer(input: SceneInput): SceneInput {
  const result = evaluateScene(input)
  if (!result.ok) return input
  const { x, y } = result.scene.eye
  if (x === input.viewer.distance && y === input.viewer.eyeHeight) return input
  return {
    ...input,
    viewer: { distance: x, eyeHeight: y },
  }
}
