import { describe, expect, it } from 'vitest'

export function add(a: number, b: number): number {
  return a + b
}

describe('add function', () => {
  it('should add two positive numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('should add negative numbers correctly', () => {
    expect(add(-1, -2)).toBe(-3)
  })

  it('should add positive and negative numbers correctly', () => {
    expect(add(5, -3)).toBe(2)
  })
})
