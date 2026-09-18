import { describe, expect, test } from 'vitest'
import { glareStatusText } from '../../src/ui/status'

describe('glare status copy', () => {
  test('matches the engine boolean', () => {
    expect(glareStatusText(true)).toBe('Прямой луч в глаза: да')
    expect(glareStatusText(false)).toBe('Прямой луч в глаза: нет')
  })
})
