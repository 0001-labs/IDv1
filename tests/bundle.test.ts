import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vite-plus/test'

// A page that only reads codes, as a product's site does, must not carry the reserved ones: a product
// may not name 0001 to its visitors.
test('a page that only reads codes bundles no reserved code or address', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'idv1-bundle-'))
  const entry = join(dir, 'page.ts')
  await writeFile(entry, `import { isCodeOf, CODE_PATTERN } from ${JSON.stringify(resolve('src/index.ts'))}\nconsole.log(isCodeOf('account', location.hash), CODE_PATTERN)\n`)
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: false, lib: { entry, formats: ['es'], fileName: 'page' } },
  })
  const code = (Array.isArray(result) ? result : [result]).flatMap(output => 'output' in output ? output.output : []).map(chunk => 'code' in chunk ? chunk.code : '').join('\n')
  expect(code).toContain('A-Za-z')
  for (const kept of ['Jo4712', 'Jo0001', 'On0001', 'Te0001', 'On4713', '0001.dev', 'icloud.com']) expect(code).not.toContain(kept)
}, 60_000)
