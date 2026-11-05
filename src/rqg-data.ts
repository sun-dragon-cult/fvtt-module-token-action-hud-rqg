import type { AbilityInfo, AbilityType, UsageType, WeaponUsageInfo } from "./types/rqg-api";
import type { AbilitySystemData, WeaponSystemData } from "./types/rqg-schema";

const ABILITY_TYPES: readonly string[] = ["skill", "rune", "passion"];
const USAGE_TYPES: readonly UsageType[] = ["oneHand", "offHand", "twoHand", "missile"];

/** Skills, runes and passions sorted by name. */
export function abilityInfos(actor: Actor): AbilityInfo[] {
  return actor.items.contents
    .filter((item) => ABILITY_TYPES.includes(item.type))
    .map((item) => {
      const system = item.system as AbilitySystemData;
      const rqidFlag = item.getFlag("rqg", "documentRqidFlags") as { id?: string } | undefined;
      return {
        id: item.id,
        uuid: item.uuid,
        rqid: rqidFlag?.id,
        name: item.name,
        img: item.img,
        type: item.type as AbilityType,
        chance: Number(system.chance) || 0,
        category: item.type === "skill" ? system.category : undefined,
        hasExperience: !!system.hasExperience,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** One entry per weapon usage that has a linked skill, the ones the attack dialog offers. */
export function weaponUsageInfos(
  actor: Actor,
  { includeUnequipped }: { includeUnequipped: boolean },
): WeaponUsageInfo[] {
  return actor.items.contents
    .filter((item) => item.type === "weapon")
    .filter(
      (weapon) =>
        includeUnequipped || (weapon.system as WeaponSystemData).equippedStatus === "equipped",
    )
    .sort((a, b) => a.sort - b.sort)
    .flatMap((weapon) => {
      const system = weapon.system as WeaponSystemData;
      return USAGE_TYPES.filter((usage) => system.usage[usage]?.skillRqidLink?.rqid).map(
        (usage) => {
          const info = system.getUsageInfo(usage);
          return {
            weaponId: weapon.id,
            weaponUuid: weapon.uuid,
            name: weapon.name,
            img: weapon.img,
            usage,
            equippedStatus: system.equippedStatus,
            skillId: info.skillItem?.id,
            skillName: info.skillItem?.name,
            chance: info.totalChance,
            strikeRank: system.usage[usage].strikeRank ?? null,
            unusable: info.unusable,
          };
        },
      );
    });
}
