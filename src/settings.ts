import { MODULE_ID } from "./constants";

type Settings = {
  showUnequippedWeapons: boolean;
};

export function registerSettings(onChange: (key: string, value: unknown) => void): void {
  game.settings.register(MODULE_ID, "showUnequippedWeapons", {
    name: game.i18n.localize("tokenActionHud.rqg.settings.showUnequippedWeapons.name"),
    hint: game.i18n.localize("tokenActionHud.rqg.settings.showUnequippedWeapons.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value: unknown) => onChange("showUnequippedWeapons", value),
  });
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return game.settings.get(MODULE_ID, key) as Settings[K];
}
