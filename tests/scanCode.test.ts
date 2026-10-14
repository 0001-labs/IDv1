import { expect, test } from 'vite-plus/test'
import {
  StableScan, decodeScanCode, encodeScanCode, isListScanId, isSupportedScanId, isUserScanId,
  readRgbaScanFrame, readScanFrame, sampleScanCode, sampleWrittenScanCode, scanCodeRegions,
} from '../src/scanCode'

const playground = '0000001100000001010100000000100100111100101000010110010000111000'
const bitsFor = (id: string) => encodeScanCode(id)!

test('web code matches the native scanner format exactly', () => {
  expect(encodeScanCode('69XQIL')?.map(Number).join('')).toBe(playground)
  expect(encodeScanCode('Jo4712')).toHaveLength(64)
  expect(encodeScanCode('Jo4712')).not.toEqual(encodeScanCode('jo4712'))
  expect(encodeScanCode('invalid')).toBeNull()
})

test('decoder round-trips every ID and matches the playground vector', () => {
  expect(decodeScanCode([...playground].map(c => c === '1'))).toBe('69XQIL')
  for (const id of ['000000', 'zzzzzz', '53sdLT', 'Jo4712', 'Ab12Xy']) expect(decodeScanCode(bitsFor(id))).toBe(id)
  expect(encodeScanCode('é9XQIL')).toBeNull()
  expect(decodeScanCode([])).toBeNull()
})

test('rejects every single-bit change without repair', () => {
  const bits = bitsFor('69XQIL')
  for (let index = 0; index < bits.length; index++) {
    const damaged = [...bits]
    damaged[index] = !damaged[index]
    expect(decodeScanCode(damaged)).toBeNull()
  }
  expect(decodeScanCode([...bits].reverse())).toBeNull()
})

test('accepts profile and list codes but not items', () => {
  expect(isSupportedScanId('Jo4712')).toBe(true)
  expect(isSupportedScanId('69XQIL')).toBe(true)
  expect(isSupportedScanId('Ab12Xy')).toBe(false)
  expect(isSupportedScanId('Jo471')).toBe(false)
  expect(isListScanId('Jo4712')).toBe(false)
  expect(isListScanId('53sdLT')).toBe(true)
  expect(isUserScanId('Jo4712')).toBe(true)
  // A paper product's code, four letters and two digits, is a person's code too.
  expect(isUserScanId('AbCd12')).toBe(true)
  expect(isSupportedScanId('AbCd12')).toBe(true)
  expect(isListScanId('AbCd12')).toBe(false)
  expect(isUserScanId('Ab12Cd')).toBe(false)
  expect(isUserScanId('AbC123')).toBe(false)
  expect(decodeScanCode(encodeScanCode('AbCd12')!)).toBe('AbCd12')
})

test('samples the same rectangle as the camera guide with 576 reads', () => {
  const bits = bitsFor('69XQIL')
  let reads = 0
  const id = sampleScanCode(320, 480, (x, y) => {
    reads++
    return bits[Math.floor((y - 208) / 16) * 16 + Math.floor((x - 32) / 16)] ? 30 : 255
  })
  expect(id).toBe('69XQIL')
  expect(reads).toBe(576)
  expect(sampleScanCode(320, 480, () => 100)).toBeNull()
})

test('edge-to-edge code on a matching dark background decodes through chroma', () => {
  const bits = bitsFor('Jo4712')
  const accent = (x: number, y: number) => x >= 64 && x < 224 && y >= 160 && y < 200 && !bits[Math.floor((y - 160) / 10) * 16 + Math.floor((x - 64) / 10)]
  expect(readScanFrame(320, 480, (x, y) => (accent(x, y) ? 210 : 25), accent)).toBe('Jo4712')
})

test('frame reader supports neutral, inset and inverted codes', () => {
  for (const id of ['Jo4712', '69XQIL', '53sdLT']) {
    const bits = bitsFor(id)
    for (const inset of [0, 0.05]) {
      for (const inverted of [false, true]) {
        const backing = { x: 64, y: 180, width: 160, height: 40 }
        const data = { x: backing.x + backing.width * inset, y: backing.y + backing.height * inset, width: backing.width * (1 - 2 * inset), height: backing.height * (1 - 2 * inset) }
        const inside = (r: typeof backing, x: number, y: number) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
        const decoded = readScanFrame(320, 480, (x, y) => {
          let ink = true
          if (inside(backing, x, y)) {
            ink = false
            if (inside(data, x, y)) {
              const column = Math.min(15, Math.floor((x - data.x) / data.width * 16))
              const row = Math.min(3, Math.floor((y - data.y) / data.height * 4))
              ink = bits[row * 16 + column]
            }
          }
          return ink === inverted ? 220 : 25
        }, () => false)
        expect(decoded, `${id} inset ${inset} inverted ${inverted}`).toBe(id)
      }
    }
  }
})

test('neutral app colours remain readable', () => {
  const bits = bitsFor('Jo4712')
  for (const [paper, accent] of [[18, 55], [245, 230]]) {
    const decoded = readScanFrame(320, 480, (x, y) => {
      if (x < 64 || x >= 224 || y < 180 || y >= 220) return paper
      return bits[Math.floor((y - 180) / 10) * 16 + Math.floor((x - 64) / 10)] ? paper : accent
    }, () => false)
    expect(decoded, `paper ${paper}`).toBe('Jo4712')
  }
})

test('small playground codes decode at camera resolution', () => {
  const bits = bitsFor('Jo4712')
  for (const width of [48, 64, 80]) {
    const cell = (x: number, y: number) => bits[Math.floor((y - 181) * 16 / width) * 16 + Math.floor((x - 53) * 16 / width)]
    const inside = (x: number, y: number) => x >= 53 && x < 53 + width && y >= 181 && y < 181 + width / 4
    const decoded = readScanFrame(320, 480, (x, y) => (inside(x, y) ? (cell(x, y) ? 25 : 210) : 25), (x, y) => inside(x, y) && !cell(x, y))
    expect(decoded, `width ${width}`).toBe('Jo4712')
  }
  expect(scanCodeRegions(320, 480, () => false)).toEqual([])
})

test('RGBA frames locate an apple-green backing and read its cells', () => {
  const bits = bitsFor('53sdLT')
  const width = 320, height = 480
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4
      let colour = [250, 250, 250]
      if (x >= 90 && x < 250 && y >= 300 && y < 340) {
        const inked = bits[Math.floor((y - 300) / 10) * 16 + Math.floor((x - 90) / 10)]
        colour = inked ? [250, 250, 250] : [153, 255, 115]
      }
      rgba.set([...colour, 255], p)
    }
  }
  expect(readRgbaScanFrame(rgba, width, height)).toBe('53sdLT')
  expect(readRgbaScanFrame(new Uint8ClampedArray(width * height * 4).fill(120), width, height)).toBeNull()
  expect(readRgbaScanFrame(new Uint8ClampedArray(8), width, height)).toBeNull()
})

test('a code under words is read past them: a header cell in two tones with its words over the cells, held askew', () => {
  const id = 'AbCd12'
  const bits = bitsFor(id)
  // The cell: 320 by 80 round the frame's middle, leaning `lean` radians; a
  // stroke of the words' ink down the middle of every cell of its two middle
  // rows, where the plain reader looks.
  const frame = (lean: number, [paper, fill, tone, words]: number[], slope = 0) => (x: number, y: number) => {
    const dx = x - 320, dy = y - 240
    const u = (dx * Math.cos(lean) + dy * Math.sin(lean) + 160) / 20, v = (-dx * Math.sin(lean) + dy * Math.cos(lean) + 40) / 20
    if (u < 0 || u >= 16 || v < 0 || v >= 4) return paper
    if (v >= 1.1 && v < 2.9 && Math.abs((u % 1) - 0.5) < 0.16) return words
    // A field whose colour turns across it, as a spectrum month's does.
    return (bits[Math.floor(v) * 16 + Math.floor(u)] ? fill : tone) - slope * u
  }
  const neutral = () => false
  for (const lean of [0, 0.03, -0.05]) {
    // Dark words on a light cell, light words on a dark one, and a cell that darkens across by more than its tones stand apart.
    for (const [levels, slope] of [[[244, 208, 172, 30], 0], [[250, 30, 66, 250], 0], [[244, 210, 176, 30], 4]] as const) {
      const luminance = frame(lean, [...levels], slope)
      expect(readScanFrame(640, 480, luminance, neutral), `lean ${lean} ${levels}`).toBe(id)
    }
  }
  // The plain reader, a cell's middle alone, cannot: the words lie there.
  const upright = frame(0, [244, 208, 172, 30])
  const rect = { x: 160, y: 200, width: 320, height: 80 }
  expect(sampleScanCode(640, 480, upright, rect)).toBeNull()
  expect(sampleWrittenScanCode(640, 480, upright, rect)).toBe(id)
  expect(sampleWrittenScanCode(640, 480, upright, [160, 200, 480, 200, 480, 280, 160, 280])).toBe(id)
  // So many readings of one place take only an ID a scan can open: an item's code is left unread.
  const item = bitsFor('Ab12Cd')
  expect(sampleWrittenScanCode(640, 480, (x, y) => (x < 160 || x >= 480 || y < 200 || y >= 280 ? 244 : item[Math.floor((y - 200) / 20) * 16 + Math.floor((x - 160) / 20)] ? 208 : 172), rect)).toBeNull()
  // Too small to tell a cell's tone from its words.
  expect(sampleWrittenScanCode(640, 480, upright, { x: 160, y: 200, width: 64, height: 16 })).toBeNull()
})

test('a code is found beside something taller on its rows, and at the end of a line of words', () => {
  const id = 'Albe39'
  const bits = bitsFor(id)
  // A calendar's cover: the year large at the left, twice the code's height, and the code on the same rows far to its right.
  const code = (x: number, y: number, left: number, top: number, cell: number) => {
    const column = Math.floor((x - left) / cell), row = Math.floor((y - top) / cell)
    return column >= 0 && column < 16 && row >= 0 && row < 4 && !bits[row * 16 + column]
  }
  const cover = (x: number, y: number) => {
    // The year: a block of ink 120 by 80, standing in for its figures.
    if (x >= 40 && x < 160 && y >= 200 && y < 280 && Math.floor((x - 40) / 12) % 2 === 0) return 30
    return code(x, y, 420, 200, 10) ? 30 : 245
  }
  expect(readScanFrame(640, 480, cover, () => false)).toBe(id)
  expect(scanCodeRegions(640, 480, (x, y) => cover(x, y) < 130)).toContainEqual({ x: 420, y: 200, width: 160, height: 40 })
  // A sheet's foot: the product's name and the code straight after it on one row, the gap smaller than the row is tall.
  const foot = (x: number, y: number) => {
    if (x >= 300 && x < 340 && y >= 300 && y < 324 && Math.floor((x - 300) / 6) % 2 === 0) return 30
    return code(x, y, 348, 300, 6) ? 30 : 245
  }
  expect(readScanFrame(640, 480, foot, () => false)).toBe(id)
})

test('only accepts three consecutive matching frames', () => {
  const scan = new StableScan()
  expect(scan.accept('69XQIL')).toBeNull()
  expect(scan.accept('69XQIL')).toBeNull()
  expect(scan.accept(null)).toBeNull()
  expect(scan.accept('69XQIL')).toBeNull()
  expect(scan.accept('69XQIL')).toBeNull()
  expect(scan.accept('69XQIL')).toBe('69XQIL')
  expect(scan.accept('53sdLT')).toBeNull()
})
