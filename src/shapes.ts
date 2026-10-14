/**
 * IDv1: short codes whose shape says what they name, so one address,
 * `example.com/<code>`, can be an account, a list or an item and never two of
 * them. Every code is six characters. Capitals matter: Ab12Cd and ab12cd are
 * two codes.
 *
 * - An account is two letters and four digits, the letters from the person's
 *   name: Jo4712.
 * - A product is four letters and two digits: AbCd12. It is always scanned,
 *   never typed, and whoever signs up with a product's code may hold it as
 *   their account's code, so it is an account's shape too.
 * - A list is two digits and four letters: 12ABCD. New lists draw capitals
 *   only; older ones may hold small letters, and both are read.
 * - An item is two letters, two digits and two letters or digits, not both
 *   digits (that would be an account): Ab12Cd.
 *
 * No two shapes can be the same code.
 */

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const CAPITALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const DIGITS = '0123456789'

/** An account's code made from a name: Jo4712. */
export const NAME_CODE = /^[A-Za-z]{2}\d{4}$/
/** A product's code: AbCd12. */
export const PRODUCT_CODE = /^[A-Za-z]{4}\d{2}$/
/** Any code an account may hold: a name's or a product's. */
export const ACCOUNT_CODE = /^(?:[A-Za-z]{2}\d{4}|[A-Za-z]{4}\d{2})$/
/** A list's code: 12ABCD, small letters read too. */
export const LIST_CODE = /^\d{2}[A-Za-z]{4}$/
/** An item's code: Ab12Cd, with at least one letter in the last two. */
export const ITEM_CODE = /^[A-Za-z]{2}\d{2}(?:[A-Za-z][A-Za-z0-9]|\d[A-Za-z])$/

import { blockedProductCode } from './words'

export type CodeKind = 'account' | 'product' | 'list' | 'item'

export const isAccountCode = (value: string): boolean => ACCOUNT_CODE.test(value)
export const isProductCode = (value: string): boolean => PRODUCT_CODE.test(value)
export const isListCode = (value: string): boolean => LIST_CODE.test(value)
export const isItemCode = (value: string): boolean => ITEM_CODE.test(value)

/** What a code names by its shape alone, or null when it is no IDv1 code. A product's shape reads as `product`. */
export function codeKind(value: string): CodeKind | null {
  if (NAME_CODE.test(value)) return 'account'
  if (PRODUCT_CODE.test(value)) return 'product'
  if (LIST_CODE.test(value)) return 'list'
  if (ITEM_CODE.test(value)) return 'item'
  return null
}

type Random = () => number
const pick = (chars: string, random: Random) => chars[Math.floor(random() * chars.length)]

/** Letters a Latin alphabet writes with a mark or as one of its own, as plain ones. */
const PLAIN: Record<string, string> = { ø: 'o', æ: 'a', œ: 'o', ß: 's', ð: 'd', þ: 't', ł: 'l', đ: 'd', ı: 'i' }

/** The plain Latin letters of a word, in order: Åse is ase, Øystein oystein. */
function latinLetters(value: string): string {
  return [...value.normalize('NFKD').toLowerCase()]
    .map(letter => PLAIN[letter] ?? letter)
    .join('')
    .replace(/[^a-z]/g, '')
}

/**
 * The two letters an account's code starts with: from the first name, a
 * capital and a small one (Leo is Le, Henrik He), else from the email
 * address, else none, and the caller draws them at random.
 */
export function nameLetters(name: string, email = ''): string | null {
  const words = name.trim().split(/\s+/)
  for (const source of [words[0] ?? '', name, email.split('@')[0] ?? '']) {
    const letters = latinLetters(source)
    if (letters.length >= 2) return letters[0].toUpperCase() + letters[1]
  }
  return null
}

/**
 * The codes to try are drawn at random and kept when nothing holds them yet;
 * whether one is free is the product's to check. `random` gives numbers in
 * [0, 1), Math.random unless a test passes its own.
 */

/** An account's code: the name's letters (or two at random) and four digits. */
export function accountCodeCandidate(letters: string | null, random: Random = Math.random): string {
  const start = letters ?? pick(LETTERS, random) + pick(LETTERS, random)
  return start + String(Math.floor(random() * 10000)).padStart(4, '0')
}

/**
 * A product's code: four letters, capital or small, and two digits. Nobody
 * types one, it is always scanned, so codes differing only in capitals are
 * different codes. Letters that spell a rude or awkward word, capitals aside,
 * and awkward digits are drawn again (`blockedProductCode` in words.ts).
 */
export function productCodeCandidate(random: Random = Math.random): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const code = Array.from({ length: 4 }, () => pick(LETTERS, random)).join('') + String(Math.floor(random() * 100)).padStart(2, '0')
    if (!blockedProductCode(code)) return code
  }
  throw new Error('No product code could be drawn.')
}

/** A list's code: two digits and four capitals. */
export function listCodeCandidate(random: Random = Math.random): string {
  return pick(DIGITS, random) + pick(DIGITS, random) + Array.from({ length: 4 }, () => pick(CAPITALS, random)).join('')
}

/** An item's code: two letters, two digits, then two letters or digits with at least one letter. */
export function itemCodeCandidate(random: Random = Math.random): string {
  const start = pick(LETTERS, random) + pick(LETTERS, random) + pick(DIGITS, random) + pick(DIGITS, random)
  const first = pick(LETTERS + DIGITS, random)
  const second = pick(LETTERS + DIGITS, random)
  // At least one letter among the last two, or it would be an account's shape.
  return start + (/\d/.test(first) && /\d/.test(second) ? pick(LETTERS, random) : first) + second
}

/**
 * Every way a name-shaped code's two letters can be written, for a product
 * that must keep a code free in all its capitals (Jo4712, jo4712, JO4712, jO4712).
 */
export function accountCodeCaseVariants(code: string): string[] {
  const [first, second] = [code[0], code[1]].map(letter => [...new Set([letter.toUpperCase(), letter.toLowerCase()])])
  return first.flatMap(a => second.map(b => a + b + code.slice(2)))
}
