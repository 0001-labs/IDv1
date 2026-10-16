# IDv1

> **Read first:** `/Users/joachim/.agents/harness-instructions.md` (harness instructions), `/Users/joachim/0001/AGENTS.md` (0001). This file wins where they differ.

The scheme for codes in 0001's products: short codes whose shape says what they name (an account `Jo4712`, a product `AbCd12`, a list `12ABCD`, an item `Ab12Cd`), how many of each there can be, the words a code must never spell, and the scannable code that carries them. Built from Ezo's (`shared/userCode.ts`, `shared/ezoIdSpace.ts`, `shared/codeWords.ts`, `shared/scanCode.ts`, `shared/scanCodeDrawing.ts`, `generateItemId`/`generateListId` in `convex/app.ts`), which Peer and Ins copied as `shared/ids.ts`. It has nothing to do with signing in: that is Sign-in (`/Users/joachim/0001/Sign-in`). Open source under MIT at https://github.com/0001-labs/IDv1 and on npm as `@0001-labs/idv1`, so nothing personal and no product addresses go in it. `README.md` is the guide; change it with the code.

## System parts

System node: `id1` ([map](https://system.0001.dev/system?focus=id1)). Follow the studio’s Selecting System requirements workflow; inspect current edges for Stack dependencies and their evidence.

- Recorded relationships — shared: `documentation`; dependency: `sharing`.
- Decisions/exceptions: Putting it in a product below leaves database uniqueness and domain terminology to consumers. IDv1 supplies identifiers, not authentication.
- Coverage: relationships select guides, not proof of acceptance. Proposed (`opportunity`) and unknown (`unverified`) relationships stay distinct; verify applicable requirements for the current change.

## Scripts

- `vp run check` — type-check
- `vp test run` — the tests
- `vp run release patch|minor|major|alpha` — publish to npm (`scripts/release.mjs`, the same file in Aa, Design system 1, IDv1, Drag and Worktrees; `current` for the first release, `--dry-run` to rehearse)

## Putting it in a product

Copy it with Sync 1: `"ID 1": { "ids": { "to": "shared/idv1" } }` in the product's `sync.json`, then `sync1`. The folder belongs to the copy whole; never edit it. The product keeps its own database side: drawing a candidate until it is free, the `code` field and its `by_code` index, a backfill, and its own words for the kinds (Peer calls an item a listing, Ins a clip).

## Git commits

- Public on GitHub at `0001-labs/IDv1`, pushed as `Jo4712`. English commit messages, no Co-Authored-By lines.

## GitHub Communication

- Never write comments on GitHub. The PR description is the only allowed PR text, and it must stay minimal.
