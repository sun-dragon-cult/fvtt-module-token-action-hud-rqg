/**
 * The RQG data model fields this module reads. Mirrors the data models in fvtt-system-rqg
 * (src/data-model/), which are part of the system's public API. Only fields used here are declared.
 */

import type { CastableSpell, CharacteristicName, SkillCategory, UsageType } from "./rqg-api";

export type RqgResource = { value: number | null; max: number | null };

export type CharacterSystemData = {
  characteristics: Record<CharacteristicName, { value: number | null }>;
  background: { reputation: number | null };
  attributes: { magicPoints: RqgResource };
};

export type CultSystemData = { runePoints: RqgResource };

export type AbilitySystemData = {
  chance: number | null;
  category?: SkillCategory;
  hasExperience: boolean;
};

export type WeaponUsageChanceInfo = {
  skillItem: { id: string; name: string } | undefined;
  totalChance: number;
  unusable: boolean;
};

export type WeaponSystemData = {
  equippedStatus: "notCarried" | "carried" | "equipped";
  usage: Record<UsageType, { skillRqidLink?: { rqid?: string }; strikeRank?: number | null }>;
  getUsageInfo(usage: UsageType): WeaponUsageChanceInfo;
};

/** An RQG character, with the methods this module calls. */
export type RqgActor = Actor & { getCastableSpells(): CastableSpell[] };
