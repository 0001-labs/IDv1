# IDv1

Short codes whose shape says what they name. Documentation at [idv1.0001.dev](https://idv1.0001.dev). Every code is six characters, and one look at it tells an account from a list or an item, so a single address, `example.com/<code>`, can open any of them and never two at once.

| What | Shape | Example | How many |
|---|---|---|---|
| Account | two letters, four digits | `Jo4712` | 27 million |
| Product | four letters, two digits | `AbCd12` | 731 million |
| List | two digits, four letters | `12ABCD` | 46 million |
| Item | two letters, two digits, two letters or digits that are not both digits | `Ab12Cd` | 1 billion |

- **Capitals matter.** `Ab12Cd` and `ab12cd` are two codes.
- **An account's letters come from the person's name**, a capital and a small one: Leo is `Le0125`, Henrik `He0422`. A name without two Latin letters takes them from the email address, and failing that at random. The digits are drawn until the code is free.
- **A product's code is scanned, never typed.** Whoever signs up with a product's code may keep it as their account's code, so it is an account's shape too. Codes whose letters spell a rude or awkward word in any language the products speak, capitals aside, are drawn again (`words.ts`).
- **New lists draw four capitals.** Older lists may hold small letters, and every check reads both.
- **An item never ends in two digits**, or it would be an account.
- **A code does not change by itself.** A product may give an account a chosen code, as when it should match the code its owner has elsewhere.
- **Some codes are kept for a person or a role.** `RESERVED_ACCOUNT_CODES` names them, `RESERVED_ACCOUNT_EMAILS` says whose they are, and no product draws them for anyone else: Joachim is `Jo4712` (jaa90@icloud.com) and `Jo0001` (joachim@0001.dev), the onboarding test account is `On0001` (joachim+onboarding@0001.dev, `On4713` before) and the test account is `Te0001` (joachim+test@0001.dev). A product gives the code `reservedAccountCode(email)` returns before drawing one, so the same person is the same code in every product and easy to leave out of the figures.

## Which shape for what you build

Pick the shape by what the thing is, not by what a product calls it, so the same kind of thing has the same shape in every product and a code is easy to place on sight:

| What it is | Shape | Called in products | Example |
|---|---|---|---|
| A person | account | user, member, owner | `Jo4712` |
| Something that holds things | list | list, category, board, collection, folder, project | `12ABCD` |
| One thing kept | item | item, clip, listing, note, a piece of inspiration | `Ab12Cd` |
| A thing in the world with a code printed on it | product | product, tag, sticker | `AbCd12` |

Two products agree without asking each other: a category in one is a list's shape like a list in another, and a piece of inspiration is an item's shape like an item anywhere.

```ts
import { codeCandidate, codeKind, isCodeOf, nameLetters } from '@0001-labs/idv1'

codeCandidate('list')                                           // a category: 47KQWE
codeCandidate('item')                                           // a piece: Ab12Cd
codeCandidate('account', { letters: nameLetters('Leo Andersen') }) // a person: Le0125
isCodeOf('list', '47KQWE')                                      // true
codeKind('Ab12Cd')                                              // 'item'
```

## Advanced: a code for every event

The four shapes hold about 2.5 billion codes, enough for every person, list and item, but not for every event a product records or every visit to it. The expanded version, `@0001-labs/idv1/advanced`, keeps six characters of the same 62 letters and digits and takes every code the four shapes leave free: any order at all, so long as it is none of them.

| Version | What | Shape | How many |
|---|---|---|---|
| Standard | account, product, list, item | the four shapes above | 2.5 billion, read as they are read |
| Advanced | event | any six letters or digits that make none of the four shapes, such as `k3Rw9Q` | 54.3 billion |
| Both | every code | six of 62 | 56.8 billion (62⁶) |

- **An event is still told apart on sight**, since no account, product, list or item can be one: `advancedCodeKind` reads all five kinds, and `codeKind` in the standard version is unchanged and reads an event as no code.
- **It is drawn uniformly from cryptographic random numbers** (`secureRandom`), again while it makes a shape or spells a blocked word. Nobody types it and it never opens anything when scanned, though the scannable code can carry it.
- **Whether one is free is still the product's to check.** With 54 billion to draw from, two events rarely meet, but a product that keeps them by code looks before it keeps one.

```ts
import { ADVANCED_SPACE, advancedCodeKind, eventCodeCandidate, isEventCode } from '@0001-labs/idv1/advanced'

eventCodeCandidate()        // k3Rw9Q
isEventCode('k3Rw9Q')       // true
advancedCodeKind('Ab12Cd')  // 'item'
ADVANCED_SPACE.events       // 54_298_494_784
```

A product copies it alone with Sync 1's `advanced` export (`advanced.ts` with the `shapes.ts` and `words.ts` it reads against), or whole with `ids`.

## The scannable code

`scanCode.ts` turns any six-character code into a strip of 16 × 4 cells (64 bits: a format byte, the code in five bytes, a two-byte check) and reads it back from a camera frame. Any single damaged cell fails the check rather than reading wrong. `scanCodePath` draws the strip as SVG; `readRgbaScanFrame`, `locateRgbaScanFrame` and `StableScan` read it from camera pixels, also when it is written on paper beside other marks.

## What is in here

- `src/shapes.ts` — the patterns (`ACCOUNT_CODE`, `PRODUCT_CODE`, `LIST_CODE`, `ITEM_CODE`, and `CODE_PATTERN` by kind), `codeKind`, `isCodeOf`, the candidates each shape is drawn from (`codeCandidate` by kind), and `nameLetters`
- `src/space.ts` — `ID_SPACE`, how many codes of each kind there can be, and `idUsage`
- `src/words.ts` — the words and digits a product's code must never spell
- `src/advanced.ts` — the expanded version: an event's code, `eventCodeCandidate`, `advancedCodeKind` and `ADVANCED_SPACE`
- `src/scanCode.ts`, `src/scanCodeDrawing.ts` — the scannable code
- `tests/` — the shapes, the counts, the expanded version and the scannable code

## Using it

```bash
vp add @0001-labs/idv1
```

```ts
import { accountCodeCandidate, codeKind, nameLetters } from '@0001-labs/idv1'

codeKind('Ab12Cd') // 'item'
const code = accountCodeCandidate(nameLetters('Leo Andersen')) // Le0125, say
```

A candidate is only a code to try: keep it when nothing in your database holds it yet, and draw again when something does. Store the code on the row beside the database's own id, with an index on it, and look rows up by it.

## Development

```bash
vp install
vp run check
vp test run
```

## Licence

MIT
