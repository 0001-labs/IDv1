import { expect, test } from 'vite-plus/test'
import { encodeScanCode, scanCodePath, scanCodeColumns } from '../src/scanCode'

/** The cells a path covers, read back from its rows' runs. */
function covered(d: string): Set<number> {
  const cells = new Set<number>()
  for (const [, x, y, w] of d.matchAll(/M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v1h-?[\d.]+z/g))
    for (let column = Number(x); column < Number(x) + Number(w); column++) cells.add(Number(y) * scanCodeColumns + column)
  return cells
}

test('a code is one path covering exactly its inked cells, each row\'s neighbours one run', () => {
  const bits = encodeScanCode('12abcd')!
  const d = scanCodePath(bits)
  const inked = bits.flatMap((bit, index) => bit ? [] : [index])
  expect([...covered(d)].sort((a, b) => a - b)).toEqual(inked)
  // Neighbours in a row join: fewer runs than cells whenever two touch.
  const runs = d.split('M').length - 1
  expect(runs).toBeLessThan(inked.length)
})

test('the ink can be the set bits, and the path scaled and placed', () => {
  const bits = encodeScanCode('Jo4712')!
  const d = scanCodePath(bits, { ink: bit => bit, cell: 0.25, x: 2, y: 3 })
  expect(d.startsWith('M')).toBe(true)
  const area = [...d.matchAll(/h(-?[\d.]+)v(-?[\d.]+)/g)].reduce((sum, [, w, h]) => sum + Number(w) * Number(h), 0)
  expect(area).toBeCloseTo(bits.filter(Boolean).length * 0.0625)
})
