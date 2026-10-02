/**
 * The parts of the RQG system's public API (`game.system.api`) used by this module.
 * Mirrors src/system/api in fvtt-system-rqg, documented at
 * https://sun-dragon-cult.github.io/rqg-system/api
 */

export type ActorRef = Actor | TokenDocument | string;

export type AbilityType = "skill" | "rune" | "passion";

export type SkillCategory =
  | "agility"
  | "communication"
  | "knowledge"
  | "magic"
  | "manipulation"
  | "perception"
  | "stealth"
  | "meleeWeapons"
  | "missileWeapons"
  | "shields"
  | "naturalWeapons"
  | "otherSkills";

export type AbilityInfo = {
  id: string;
  uuid: string;
  rqid: string | undefined;
  name: string;
  img: string | null;
  type: AbilityType;
  chance: number;
  category: SkillCategory | undefined;
  hasExperience: boolean;
};

export type CharacteristicName =
  "strength" | "constitution" | "size" | "dexterity" | "intelligence" | "power" | "charisma";

export type UsageType = "oneHand" | "offHand" | "twoHand" | "missile";

export type WeaponUsageInfo = {
  weaponId: string;
  weaponUuid: string;
  name: string;
  img: string | null;
  usage: UsageType;
  equippedStatus: "notCarried" | "carried" | "equipped";
  skillId: string | undefined;
  skillName: string | undefined;
  chance: number;
  strikeRank: number | null;
  unusable: boolean;
};

export type SpellSource = "own" | "allied" | "boundSpirit" | "matrix";

export type CastableSpell = {
  type: "spiritMagic" | "runeMagic";
  name: string;
  img: string | null;
  points: number;
  isVariable: boolean;
  isOneUse: boolean;
  cultId: string | undefined;
  cultName: string | undefined;
  source: SpellSource;
  sourceName: string | undefined;
  uuid: string | undefined;
  matrix: { itemId: string; entryIndex: number } | undefined;
};

export type ActorAttributesInfo = {
  hitPoints: { value: number | null; max: number };
  magicPoints: { value: number | null; max: number };
  runePoints: { cultId: string; cultName: string; value: number | null; max: number | null }[];
  heroPoints: number;
  reputation: number;
  dexStrikeRank: number | null;
  sizStrikeRank: number | null;
  damageBonus: string;
  health: string;
};

export type RollOptions = {
  actor?: ActorRef;
  skipDialog?: boolean;
};

export type RqgApi = {
  rolls: {
    ability(item: string, options?: RollOptions): Promise<unknown>;
    characteristic(name: CharacteristicName, options?: RollOptions): Promise<unknown>;
    reputation(options?: RollOptions): Promise<unknown>;
    attack(weapon: string, options?: { actor?: ActorRef; usage?: UsageType }): Promise<void>;
    spiritMagic(spell: string | CastableSpell, options?: RollOptions): Promise<unknown>;
    runeMagic(spell: string | CastableSpell, options?: RollOptions): Promise<unknown>;
  };
  query: {
    abilities(actor?: ActorRef, options?: { types?: AbilityType[] }): AbilityInfo[];
    characteristics(actor?: ActorRef): Record<CharacteristicName, number | null>;
    weaponUsages(actor?: ActorRef, options?: { includeUnequipped?: boolean }): WeaponUsageInfo[];
    spells(actor?: ActorRef): CastableSpell[];
    attributes(actor?: ActorRef): ActorAttributesInfo;
  };
};
