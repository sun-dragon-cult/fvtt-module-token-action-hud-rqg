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
- `rqg-schema.d.ts` – the RQG data model fields this module reads, mirroring the data models in
  `fvtt-system-rqg` (`src/data-model/`). Only declare the fields actually used.

## Rules

- The RQG public API has two parts: the data model schema (`actor.system.*`, `item.system.*`) and
  `game.system.api`. Read stored values, such as characteristics, magic points or a cult's rune
  points, straight from the schema. Use `game.system.api` for what needs rules knowledge: rolls,
  chances, castable spells and the like. Never use other RQG internals (classes, helpers,
  undocumented flags). If the HUD needs a computed value the API lacks, add it to the API in
  `fvtt-system-rqg` (with tests and docs) rather than computing it here.
- Prettier with `printWidth: 100`. Conventional commit messages (`feat:`, `fix:`, `chore:` …).
- User-facing documentation for RQG belongs on the `sun-dragon-cult.github.io` site, not in this
  repo beyond the README.

## Dev setup in Foundry

Foundry v14 with RQG 6.2.0 or later (or `fvtt-system-rqg` `main`), plus Token Action HUD Core and
socketlib installed. Symlink `dist/` as `Data/modules/token-action-hud-rqg` in the Foundry data
folder (`FOUNDRY_V14_DATA` in `fvtt-system-rqg/.env.local`), run `pnpm dev`, and reload Foundry
after changes.

## Status and open items

- The first version works in Foundry v14 with Token Action HUD Core 2.1.2.
- Waiting on the system's public API work (epic sun-dragon-cult/fvtt-system-rqg#1133):
  - #1137: a hook when an actor's spell or point sources change. Until then the HUD doesn't refresh
    when an Allied Spirit, bound spirit or matrix on another actor changes.
  - #1135: spell source ids. Spell subgroups for Allied Spirits and bound spirits are keyed by
    name until then (`spiritSourceGroupId` in `src/build-actions.ts`).
  - #1136: Magic Points per spell source, to show on each spirit magic subgroup.
  - #1132: public roll methods and hooks. Switch `src/roll-handler.ts` to them once they exist.
- Release order: RQG 6.2.0 first, then a GitHub release of this module, then register it as a
  Foundry package.
- GitHub: https://github.com/sun-dragon-cult/fvtt-module-token-action-hud-rqg (MIT).
- Ideas for later: hit locations and HP, rune and magic point readouts, strike ranks,
  experience session, translations.
- The old all-in-one Token Action HUD fork in `../fvtt-tokenactionhud` is obsolete and not used.
