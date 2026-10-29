import { describe, expect, it } from 'vitest'
import { routeHref } from './router'

describe('internal route URLs', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['beranda', '/'],
    ['/beranda/', '/'],
    ['atur', '/atur'],
    ['/atur/', '/atur'],
    ['///atur', '/atur'],
    ['meja/game-1', '/meja/game-1'],
    ['\\atur', '/atur'],
    ['\\\\example.com/atur', '/example.com/atur'],
  ])('normalizes %j to %j', (path, expected) => {
    expect(routeHref(path)).toBe(expected)
  })
})
