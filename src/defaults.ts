import { GROUP, SKILL_GROUPS } from "./constants";
import type { TahDefaults, TahGroup, TahGroupSettings } from "./types/tah-core";

/** The HUD's default layout. Users can rearrange it in the HUD settings. */
export function getDefaults(localize: (key: string) => string): TahDefaults {
  const group = (
    { id, name }: { id: string; name: string },
    nestId: string,
    settings?: TahGroupSettings,
  ): TahGroup => ({
    id,
    name: localize(name),
    listName: `Group: ${localize(name)}`,
    type: "system",
    nestId: `${nestId}_${id}`,
    ...(settings && { settings }),
  });
  const nest = (id: string, name: string, groups: TahGroup[]): TahGroup => ({
    id,
    nestId: id,
    name: localize(name),
    groups,
  });

  const layout = [
    nest("combat", "tokenActionHud.combat", [group(GROUP.weapons, "combat")]),
    nest(
      "skills",
      "tokenActionHud.rqg.skills",
      SKILL_GROUPS.map((g) => group(g, "skills")),
    ),
    nest("magic", "tokenActionHud.rqg.magic", [
      // Tabs, since rune magic gets a subgroup per cult and spirit magic one per spell source
      group(GROUP.spiritMagic, "magic", { style: "tab" }),
      group(GROUP.runeMagic, "magic", { style: "tab" }),
    ]),
    nest("passions-runes", "tokenActionHud.rqg.passionsAndRunes", [
      group(GROUP.passions, "passions-runes"),
      group(GROUP.runes, "passions-runes"),
    ]),
    nest("characteristics", "tokenActionHud.rqg.characteristics", [
      group(GROUP.characteristics, "characteristics"),
    ]),
    nest("effects", "tokenActionHud.rqg.statusEffects", [group(GROUP.statusEffects, "effects")]),
    nest("utility", "tokenActionHud.utility", [group(GROUP.token, "utility")]),
  ];

  const groups = layout.flatMap((n) => n.groups ?? []).map(({ nestId: _, ...g }) => g);
  return { layout, groups };
}
