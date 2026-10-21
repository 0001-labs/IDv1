import { expect, test } from 'vite-plus/test'
import { nameLetters, accountCodeCandidate as userCodeCandidate, RESERVED_ACCOUNT_CODES, isReservedAccountCode } from '../src/shapes'

test('a new account\'s code starts with the first name\'s first two letters, a capital and a small one', () => {
  expect(nameLetters('Leo')).toBe('Le')
  expect(nameLetters('Henrik Nielsen')).toBe('He')
  expect(nameLetters('joachim')).toBe('Jo')
  // Marks and letters of its own become plain Latin ones.
  expect(nameLetters('Øystein')).toBe('Oy')
  expect(nameLetters('Åse')).toBe('As')
  expect(nameLetters('Émile')).toBe('Em')
})

test('a name without two Latin letters takes them from the email address, and failing that, none', () => {
  expect(nameLetters('田中', 'tanaka@example.com')).toBe('Ta')
  expect(nameLetters('', 'mi.lo@example.com')).toBe('Mi')
  expect(nameLetters('Ai', 'x@example.com')).toBe('Ai')
  expect(nameLetters('田中', '1@example.com')).toBeNull()
})

test('a code is the letters and four digits, and without letters, two at random', () => {
  const at = (values: number[]) => { let index = 0; return () => values[index++ % values.length] }
  expect(userCodeCandidate('Le', at([0.0125]))).toBe('Le0125')
  expect(userCodeCandidate('He', at([0.04229]))).toBe('He0422')
  expect(userCodeCandidate(null)).toMatch(/^[A-Za-z]{2}\d{4}$/)
})

test('a reserved code is kept for its role in every product and never drawn for anyone else', () => {
  expect(RESERVED_ACCOUNT_CODES.onboarding).toBe('On4713')
  expect(isReservedAccountCode('On4713')).toBe(true)
  expect(isReservedAccountCode('ON4713')).toBe(true)
  expect(isReservedAccountCode('On4712')).toBe(false)
  // A random source that lands on 4713 first draws again.
  const draws = [0.4713, 0.4714]
  expect(userCodeCandidate('On', () => draws.shift() ?? 0)).toBe('On4714')
})
