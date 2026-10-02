import {
  ACTION_TYPE,
  type ActionType,
  GROUP,
  type RqgActionSystemData,
  skillGroupId,
} from "./constants";
import type {
  AbilityInfo,
  CastableSpell,
  CharacteristicName,
  WeaponUsageInfo,
} from "./types/rqg-api";
import type { TahActionData } from "./types/tah-core";

export type Localize = (key: string) => string;

/** Actions to add, keyed by group id */
export type GroupedActions = Map<string, TahActionData[]>;

const CHARACTERISTICS: readonly CharacteristicName[] = [
  "strength",
  "constitution",
  "size",
  "dexterity",
  "intelligence",
  "power",
  "charisma",
];

function action(
  actionType: ActionType,
  actionId: string,
  data: Omit<TahActionData, "id" | "system">,
  system: Omit<RqgActionSystemData, "actionType" | "actionId"> = {},
): TahActionData {
  return {
    id: [actionType, actionId, system.usage].filter(Boolean).join("-"),
    ...data,
    system: { actionType, actionId, ...system } satisfies RqgActionSystemData,
  };
}

function percent(chance: number): { text: string } {
  return { text: `${chance}%` };
}

function addTo(grouped: GroupedActions, groupId: string, actionData: TahActionData): void {
  const actions = grouped.get(groupId) ?? [];
  actions.push(actionData);
  grouped.set(groupId, actions);
}

/** Skills go in a group per skill category, passions and runes in their own groups. */
export function buildAbilityActions(abilities: AbilityInfo[], grouped: GroupedActions): void {
  for (const ability of abilities) {
    const groupId =
      ability.type === "skill"
        ? skillGroupId(ability.category ?? "otherSkills")
        : ability.type === "passion"
          ? GROUP.passions.id
          : GROUP.runes.id;
    addTo(
      grouped,
      groupId,
      action(
        ACTION_TYPE.ability,
        ability.id,
        { name: ability.name, img: ability.img, info1: percent(ability.chance) },
        { itemUuid: ability.uuid },
      ),
    );
  }
}

/** One action per weapon usage. The usage is only added to the name when there is a choice. */
export function buildWeaponActions(
  usages: WeaponUsageInfo[],
  localize: Localize,
  grouped: GroupedActions,
): void {
  const usageCount = new Map<string, number>();
  for (const usage of usages) {
    usageCount.set(usage.weaponId, (usageCount.get(usage.weaponId) ?? 0) + 1);
  }

  for (const usage of usages) {
    const usageLabel = localize(`RQG.Game.WeaponUsage.${usage.usage}`);
    const name =
      (usageCount.get(usage.weaponId) ?? 0) > 1 ? `${usage.name} (${usageLabel})` : usage.name;
    addTo(
      grouped,
      GROUP.weapons.id,
      action(
        ACTION_TYPE.weapon,
        usage.weaponId,
        {
          name,
          img: usage.img,
          info1: percent(usage.chance),
          info2: usage.strikeRank != null ? { text: `SR ${usage.strikeRank}` } : undefined,
          tooltip: usage.unusable ? localize("tokenActionHud.rqg.weaponUnusable") : undefined,
          cssClass: usage.unusable ? "disabled" : undefined,
        },
        { itemUuid: usage.weaponUuid, usage: usage.usage },
      ),
    );
  }
}

/**
 * A stable key for a castable spell, used as action id. Spells from a matrix have no item of
 * their own, so they are identified by the matrix item and the spell's place in it.
 */
export function spellKey(spell: CastableSpell): string {
  return spell.matrix
    ? `matrix-${spell.matrix.itemId}-${spell.matrix.entryIndex}`
    : `${spell.uuid}`;
}

export function buildSpellActions(spells: CastableSpell[], grouped: GroupedActions): void {
  for (const spell of spells) {
    const name = spell.sourceName ? `${spell.name} (${spell.sourceName})` : spell.name;
    const points = `${spell.points}${spell.isVariable ? "+" : ""}`;
    const isRuneMagic = spell.type === "runeMagic";
    addTo(
      grouped,
      isRuneMagic ? GROUP.runeMagic.id : GROUP.spiritMagic.id,
      action(
        isRuneMagic ? ACTION_TYPE.runeMagic : ACTION_TYPE.spiritMagic,
        spellKey(spell),
        {
          name,
          img: spell.img,
          info1: { text: points },
          info2: isRuneMagic && spell.cultName ? { text: spell.cultName } : undefined,
        },
        spell.uuid ? { itemUuid: spell.uuid } : {},
      ),
    );
  }
}

/** Characteristics show their ×5 chance when values are known (a single actor). */
export function buildCharacteristicActions(
  values: Record<CharacteristicName, number | null> | undefined,
  reputation: number | undefined,
  localize: Localize,
  grouped: GroupedActions,
): void {
  for (const name of CHARACTERISTICS) {
    const value = values?.[name];
    addTo(
      grouped,
      GROUP.characteristics.id,
      action(ACTION_TYPE.characteristic, name, {
        name: localize(`RQG.Actor.Characteristics.${name}`),
        info1: value != null ? percent(value * 5) : undefined,
      }),
    );
  }
  addTo(
    grouped,
    GROUP.characteristics.id,
    action(ACTION_TYPE.reputation, "reputation", {
      name: localize("RQG.Actor.Background.Reputation"),
      info1: reputation != null ? percent(reputation) : undefined,
    }),
  );
}

/** Status effects are toggles, shown as active when every selected actor has them. */
export function buildStatusEffectActions(
  statusEffects: StatusEffectConfig[],
  actors: Pick<Actor, "statuses">[],
  localize: Localize,
  grouped: GroupedActions,
): void {
  for (const effect of statusEffects) {
    if (!effect.id) {
      continue;
    }
    const isActive = actors.length > 0 && actors.every((a) => a.statuses.has(effect.id));
    addTo(
      grouped,
      GROUP.statusEffects.id,
      action(ACTION_TYPE.statusEffect, effect.id, {
        name: localize(effect.name),
        img: effect.img,
        cssClass: isActive ? "toggle active" : "toggle",
      }),
    );
  }
}
