# Token Action HUD RuneQuest Glorantha

A [Token Action HUD](https://foundryvtt.com/packages/token-action-hud-core) system module for the
[RuneQuest Glorantha (RQG)](https://foundryvtt.com/packages/rqg) system in Foundry VTT.

Select a token and the HUD shows its:

- **Combat** – equipped weapons, one button per way the weapon can be used, with chance and strike
  rank
- **Skills** – one group per skill category
- **Magic** – spirit and rune magic, including spells from an Allied Spirit, bound spirits and
  spell matrices
- **Passions & Runes**
- **Characteristics** – characteristic rolls and Reputation
- **Status Effects** – toggle status effects on the token
- **Utility** – add to combat, toggle visibility

Click an action to open its normal roll dialog, **shift-click** to roll at once without a dialog,
and **right-click** to open the item's sheet. With several tokens selected the HUD offers
characteristic rolls and status effects for all of them.

## Requirements

- Foundry VTT 14
- RQG system 6.2.0 or later (the module uses the system's
  [public API](https://sun-dragon-cult.github.io/rqg-system/api))
- Token Action HUD Core 2.1, which also needs socketlib

## Development

Uses pnpm (`corepack enable`) and Node 24.

```sh
pnpm install
pnpm dev     # build into dist/ and rebuild on changes
pnpm check   # lint, typecheck, test and build, the same as CI
```

To load it in Foundry, symlink `dist/` into your Foundry data folder as
`Data/modules/token-action-hud-rqg`, then reload Foundry after each rebuild.

The module's code is in `src/`:

- `main.ts` registers with Token Action HUD Core when Core hands over its API.
- `build-actions.ts` turns the RQG API's `query` results into HUD actions (unit tested).
- `action-handler.ts` and `roll-handler.ts` extend Core's base classes: building the actions, and
  calling the RQG API's `rolls` when an action is clicked.
- `defaults.ts` is the default HUD layout.

Releases are built by publishing a GitHub release with a `vX.Y.Z` tag. The workflow fills in the
version and links in `module.json` and attaches `module.json` and `module.zip` to the release.
