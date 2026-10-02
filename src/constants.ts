import type { SkillCategory } from "./types/rqg-api";

export const MODULE_ID = "token-action-hud-rqg";

/** Major version of Token Action HUD Core this module works with */
export const REQUIRED_CORE_MODULE_VERSION = "2";

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  "agility",
  "communication",
  "knowledge",
  "magic",
  "manipulation",
  "perception",
  "stealth",
  "meleeWeapons",
  "missileWeapons",
  "shields",
  "naturalWeapons",
  "otherSkills",
];

export const ACTION_TYPE = {
  ability: "ability",
  characteristic: "characteristic",
  reputation: "reputation",
  weapon: "weapon",
  spiritMagic: "spiritMagic",
  runeMagic: "runeMagic",
  statusEffect: "statusEffect",
} as const;

export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];

/** What a HUD action stores, read back by the roll handler when the action is clicked. */
export type RqgActionSystemData = {
  actionType: ActionType;
  actionId: string;
  /** For actions that represent an item, used to open its sheet on right click */
  itemUuid?: string;
  usage?: string;
};

/** Group ids and the translation keys of their names */
export const GROUP = {
  weapons: { id: "weapons", name: "tokenActionHud.rqg.weapons" },
  spiritMagic: { id: "spirit-magic", name: "RQG.Item.SheetTab.SpiritMagic" },
  runeMagic: { id: "rune-magic", name: "RQG.Item.SheetTab.RuneMagic" },
  passions: { id: "passions", name: "tokenActionHud.rqg.passions" },
  runes: { id: "runes", name: "tokenActionHud.rqg.runes" },
  characteristics: { id: "characteristics", name: "tokenActionHud.rqg.characteristics" },
  statusEffects: { id: "status-effects", name: "tokenActionHud.rqg.statusEffects" },
  token: { id: "token", name: "tokenActionHud.token" },
} as const;

export const SKILL_GROUPS = SKILL_CATEGORIES.map((category) => ({
  id: skillGroupId(category),
  name: `RQG.Actor.Skill.SkillCategory.${category}`,
}));

export function skillGroupId(category: SkillCategory): string {
  return `skills-${category}`;
}
