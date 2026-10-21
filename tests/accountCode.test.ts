import { expect, test } from 'vite-plus/test'
import { nameLetters, accountCodeCandidate as userCodeCandidate, RESERVED_ACCOUNT_CODES, RESERVED_ACCOUNT_EMAILS, isReservedAccountCode, reservedAccountCode } from '../src/shapes'

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

test('a reserved code is kept for its person or role in every product and never drawn for anyone else', () => {
  expect(RESERVED_ACCOUNT_CODES).toEqual({ owner: 'Jo4712', studio: 'Jo0001', onboarding: 'On0001', test: 'Te0001' })
  expect(reservedAccountCode('jaa90@icloud.com')).toBe('Jo4712')
  expect(reservedAccountCode(' Joachim@0001.dev ')).toBe('Jo0001')
  expect(reservedAccountCode('joachim+onboarding@0001.dev')).toBe('On0001')
  expect(reservedAccountCode('joachim+test@0001.dev')).toBe('Te0001')
  expect(reservedAccountCode('someone@example.com')).toBe(null)
  expect(reservedAccountCode(null)).toBe(null)
  expect(Object.keys(RESERVED_ACCOUNT_EMAILS)).toHaveLength(4)
  for (const code of ['Jo4712', 'JO4712', 'jo0001', 'On0001', 'Te0001', 'On4713']) expect(isReservedAccountCode(code)).toBe(true)
  expect(isReservedAccountCode('On4712')).toBe(false)
  const random = (() => { const values = [0, 0, 0.4712, 0.0001, 0.5]; let index = 0; return () => values[index++ % values.length] })()
  const drawn = userCodeCandidate('Jo', random)
  expect(isReservedAccountCode(drawn)).toBe(false)
})
