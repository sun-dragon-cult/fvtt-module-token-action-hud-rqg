# AGENTS.md

Token Action HUD system module for the RuneQuest Glorantha (`rqg`) Foundry VTT system. Module id
`token-action-hud-rqg`. It plugs into
[Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) (2.1.x) and gets
everything it shows and does through the RQG system's public API, `game.system.api`.

## Commands

pnpm (`corepack enable`), Node 24.

- `pnpm install`
- `pnpm dev` – build into `dist/` and rebuild on changes
- `pnpm build` – production build into `dist/`
- `pnpm lint` / `pnpm lint:fix`, `pnpm typecheck`, `pnpm test` (Vitest)
- `pnpm check` – lint, typecheck, test and build; this is what CI runs

## Architecture

- `static/` is copied as-is into `dist/`: `module.json` (with `#{VERSION}#`-style placeholders the
  release workflow fills in) and `lang/en.json`. The bundle goes to
  `dist/scripts/token-action-hud-rqg.js`.
- `src/main.ts` listens for `tokenActionHudCoreApiReady`. Core's base classes (`ActionHandler`,
  `RollHandler`, `SystemManager`) only exist at runtime inside that hook, so our classes are
  created by factory functions (`createActionHandler`, `createRollHandler`) that extend them.
  `main.ts` then sets `module.api = { requiredCoreModuleVersion, SystemManager }` and calls
  `tokenActionHudSystemReady`.
- `src/build-actions.ts` holds the pure functions that turn RQG API `query` results into HUD
  actions grouped by group id. Keep logic here so it stays unit tested.
- `src/action-handler.ts` builds actions on every HUD refresh. `src/roll-handler.ts` handles
  clicks: click = dialog, shift-click = `skipDialog`, right-click = open the item sheet (via
  `system.itemUuid`). With several tokens selected it acts on each controlled token.
- Each action's `system` holds `RqgActionSystemData` (`src/constants.ts`): `actionType`, `actionId`,
  optional `itemUuid` and `usage`. Spells are looked up again on click by `spellKey()`, since
  matrix spells have no item of their own.
- `src/defaults.ts` is the default layout: nests (top bar) containing groups. Group ids are in
  `src/constants.ts`. The `token` group is filled by Core itself.
- Group names reuse RQG translation keys (`RQG.Actor.Skill.SkillCategory.*`,
  `RQG.Item.SheetTab.*`, `RQG.Actor.Characteristics.*`); the module's own keys are under
  `tokenActionHud.rqg.*` in `static/lang/en.json`.

## Types

Full fvtt-types is deliberately not used (huge and slow). `src/types/` has small hand-written
declarations:

- `foundry.d.ts` – the Foundry globals this module touches
- `tah-core.d.ts` – the parts of Token Action HUD Core's API used. Check Core's source in
  `module/handlers/` when using more of it.
- `rqg-api.d.ts` – mirrors `src/system/api/` in `fvtt-system-rqg`. Keep it in sync when the
  system's API changes. User docs: https://sun-dragon-cult.github.io/rqg-system/api

## Rules

- Only use the RQG public API (`game.system.api`) and Foundry/Core APIs, never `actor.system` or
  other RQG internals. If the HUD needs something the API lacks, add it to the API in
  `fvtt-system-rqg` (with tests and docs) rather than reaching into the system.
- Prettier with `printWidth: 100`. Conventional commit messages (`feat:`, `fix:`, `chore:` …).
- User-facing documentation for RQG belongs on the `sun-dragon-cult.github.io` site, not in this
  repo beyond the README.

## Dev setup in Foundry

Foundry v14 with RQG 6.2.0 or later (or `fvtt-system-rqg` `main`), plus Token Action HUD Core and
socketlib installed. Symlink `dist/` as `Data/modules/token-action-hud-rqg` in the Foundry data
folder (`FOUNDRY_V14_DATA` in `fvtt-system-rqg/.env.local`), run `pnpm dev`, and reload Foundry
after changes.

## Status and open items

- The first version (commit `20050af`) passes lint, typecheck and unit tests but has not yet been
  run in Foundry. First check that Core accepts the registration and default layout.
- The HUD doesn't refresh when a spell source on another actor (Allied Spirit, bound spirit)
  changes. A hook like `rqg.spellSourcesChanged` in the system would fix this.
- There is no GitHub repo yet (planned: `sun-dragon-cult/fvtt-module-token-action-hud-rqg`).
- Ideas for later: hit locations and HP, rune and magic point readouts, strike ranks,
  experience session, translations.
- The old all-in-one Token Action HUD fork in `../fvtt-tokenactionhud` is obsolete and not used.
