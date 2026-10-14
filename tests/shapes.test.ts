import { expect, test } from 'vite-plus/test'
import {
  accountCodeCandidate, accountCodeCaseVariants, codeKind, itemCodeCandidate, listCodeCandidate,
  productCodeCandidate, isAccountCode, isItemCode, isListCode, isProductCode,
} from '../src/shapes'
import { blockedProductCode } from '../src/words'

test('a code says what it names by its shape alone', () => {
  expect(codeKind('Jo4712')).toBe('account')
  expect(codeKind('AbCd12')).toBe('product')
  expect(codeKind('12ABCD')).toBe('list')
  expect(codeKind('79JeRd')).toBe('list')
  expect(codeKind('Ab12Cd')).toBe('item')
  expect(codeKind('Ab12C3')).toBe('item')
  expect(codeKind('Ab123d')).toBe('item')
  for (const none of ['Ab1234x', 'Ab12', '123456', 'abcdef', 'Ab-2Cd', 'Åb12Cd']) expect(codeKind(none)).toBeNull()
})

test('an item never takes an account shape, and no shape takes another', () => {
  expect(isItemCode('Ab1234')).toBe(false)
  const samples = ['Jo4712', 'AbCd12', '12ABCD', 'Ab12Cd']
  const checks = [isAccountCode, isListCode, isItemCode]
  for (const code of samples) expect(checks.filter(check => check(code)).length).toBe(1)
  expect(isProductCode('AbCd12') && isAccountCode('AbCd12')).toBe(true)
})

test('every candidate has its own shape', () => {
  let seed = 1
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < 2000; i++) {
    expect(codeKind(accountCodeCandidate(null, random))).toBe('account')
    expect(codeKind(listCodeCandidate(random))).toBe('list')
    expect(listCodeCandidate(random)).toMatch(/^\d{2}[A-Z]{4}$/)
    expect(codeKind(itemCodeCandidate(random))).toBe('item')
    const product = productCodeCandidate(random)
    expect(codeKind(product)).toBe('product')
    expect(blockedProductCode(product)).toBe(false)
  }
})

test('a name-shaped code in all its capitals', () => {
  expect(accountCodeCaseVariants('Jo4712').sort()).toEqual(['JO4712', 'Jo4712', 'jO4712', 'jo4712'])
})
