import type { SceneInput, ValidationError } from './types.ts'

export function validateScene(input: SceneInput): ValidationError[] {
  const errors: ValidationError[] = []
  const numbers = [
    input.gap,
    input.upper.depth,
    input.upper.thickness,
    input.lower.depth,
    input.lower.thickness,
    input.lower.heightFromFloor,
    input.blend.height,
    input.blend.thickness,
    input.led.width,
    input.led.profileDrop,
    input.led.offsetFromWall,
    input.viewer.distance,
    input.viewer.eyeHeight,
  ]
  if (numbers.some((value) => !Number.isFinite(value))) {
    errors.push({ code: 'nan', message: 'Все размеры должны быть числами' })
  }
  if (input.gap <= 0) {
    errors.push({ code: 'gap', message: 'Зазор между полками должен быть больше 0 мм' })
  }
  if (input.upper.depth <= 0) {
    errors.push({ code: 'upper.depth', message: 'Глубина верхней полки должна быть больше 0 мм' })
  }
  if (input.lower.depth < 0) {
    errors.push({ code: 'lower.depth', message: 'Глубина нижней полки не может быть отрицательной' })
  }
  if (input.upper.thickness <= 0 || input.lower.thickness <= 0) {
    errors.push({ code: 'thickness', message: 'Толщина полки должна быть больше 0 мм' })
  }
  if (
    !(input.lower.heightFromFloor > 0) ||
    !(input.lower.heightFromFloor > input.lower.thickness)
  ) {
    errors.push({
      code: 'lower.heightFromFloor',
      message: 'Высота нижней полки от пола должна быть больше толщины полки',
    })
  }
  if (input.led.width <= 0) {
    errors.push({ code: 'led.width', message: 'Ширина ленты должна быть больше 0 мм' })
  }
  if (input.led.profileDrop < 0) {
    errors.push({ code: 'led.profileDrop', message: 'Свес профиля не может быть отрицательным' })
  }
  if (input.blend.height < 0 || input.blend.thickness < 0) {
    errors.push({ code: 'blend', message: 'Размеры бленды не могут быть отрицательными' })
  }
  if (input.led.mount === 'downward' && input.led.offsetFromWall < 0) {
    errors.push({
      code: 'led.offsetFromWall',
      message: 'Смещение ленты от стены не может быть отрицательным',
    })
  }
  if (
    input.led.mount === 'downward' &&
    input.led.offsetFromWall + input.led.width > input.upper.depth
  ) {
    errors.push({
      code: 'led.overhang',
      message: 'Лента выходит за переднюю кромку верхней полки',
    })
  }
  if (
    input.led.mount !== 'downward' &&
    input.led.width + input.blend.thickness > input.upper.depth
  ) {
    errors.push({
      code: 'led.overhang',
      message: 'Профиль не помещается между блендой и стеной',
    })
  }
  return errors
}
