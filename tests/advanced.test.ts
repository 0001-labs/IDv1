import { expect, test } from 'vite-plus/test'
import {
  ADVANCED_SPACE, advancedCodeKind, eventCodeCandidate, isAdvancedCodeOf, isEventCode, secureRandom,
} from '../src/advanced'
import { codeCandidate, codeKind } from '../src/shapes'
import { ID_SPACE } from '../src/space'
import { blockedCodeLetters } from '../src/words'

test('the expanded version counts every six-character code, and events are what the four shapes leave', () => {
  expect(ADVANCED_SPACE.all).toBe(56_800_235_584)
  expect(ADVANCED_SPACE.shapes).toBe(2_501_740_800)
  expect(ADVANCED_SPACE.events).toBe(54_298_494_784)
  // Fifty times as many events as there are items.
  expect(ADVANCED_SPACE.events / ID_SPACE.items).toBeGreaterThan(50)
})

test('an event is any six letters or digits that make none of the four shapes', () => {
  for (const event of ['k3Rw9Q', '7xP2mB', 'Q8z1aT', '123456', 'abcdef', 'A1b2C3']) {
    expect(isEventCode(event)).toBe(true)
    expect(advancedCodeKind(event)).toBe('event')
    expect(codeKind(event)).toBeNull()
  }
  for (const shape of ['Jo4712', 'AbCd12', '12ABCD', '79JeRd', 'Ab12Cd', 'Ab123d']) {
    expect(isEventCode(shape)).toBe(false)
    expect(advancedCodeKind(shape)).toBe(codeKind(shape))
  }
  for (const none of ['k3Rw9', 'k3Rw9Qx', 'k3-w9Q', 'Åb12Cd', '']) {
    expect(isEventCode(none)).toBe(false)
    expect(advancedCodeKind(none)).toBeNull()
  }
})

test('every event candidate is an event, free of blocked words, and the four shapes keep their own', () => {
  let seed = 11
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const seen = new Set<string>()
  for (let i = 0; i < 5000; i++) {
    const code = eventCodeCandidate(random)
    expect(advancedCodeKind(code)).toBe('event')
    expect(isAdvancedCodeOf('event', code)).toBe(true)
    expect(blockedCodeLetters(code)).toBe(false)
    seen.add(code)
  }
  expect(seen.size).toBe(5000)
  for (const kind of ['account', 'product', 'list', 'item'] as const) {
    const code = codeCandidate(kind, { random })
    expect(isAdvancedCodeOf(kind, code)).toBe(true)
    expect(isAdvancedCodeOf('event', code)).toBe(false)
  }
})

test('an event candidate draws from cryptographic random numbers by default', () => {
  for (let i = 0; i < 1000; i++) {
    const value = secureRandom()
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(1)
  }
  expect(isEventCode(eventCodeCandidate())).toBe(true)
})

test('a random source that only makes shapes is refused rather than looping', () => {
  // A source that draws Jo4712 every time, an account's shape, never gives an event.
  const shape = 'Jo4712'
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let index = 0
  const random = () => alphabet.indexOf(shape[index++ % 6]) / 62 + 0.001
  expect(() => eventCodeCandidate(random)).toThrow('No event code could be drawn.')
})
