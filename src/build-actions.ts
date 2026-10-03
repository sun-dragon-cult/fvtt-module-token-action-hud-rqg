import {
  ACTION_TYPE,
  type ActionType,
  GROUP,
  type RqgActionSystemData,
  skillGroupId,
} from "./constants";
import type {
  AbilityInfo,
  ActorAttributesInfo,
  CastableSpell,
  CharacteristicName,
  WeaponUsageInfo,
} from "./types/rqg-api";
import type { TahActionData, TahInfo } from "./types/tah-core";

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

/** A group that only exists for some actors, added below one of the layout's groups. */
export type DerivedGroup = {
  id: string;
  name: string;
  parentId: string;
  info1?: TahInfo;
};

/** Groups and group info the spells need besides the layout's own groups. */
export type SpellGroups = {
  subgroups: DerivedGroup[];
  groupInfo: Map<string, TahInfo>;
};

function points(value: number | null, max: number | null): TahInfo | undefined {
  return value != null && max != null ? { text: `${value}/${max}` } : undefined;
}

/**
 * Rune magic gets a subgroup per cult, showing the cult's rune points. Spirit magic from the
 * actor itself goes straight in the spirit magic group, which shows the magic points. Spells from
 * an Allied Spirit, bound spirit or matrix get a subgroup per source.
 */
export function buildSpellActions(
  spells: CastableSpell[],
  attributes: Pick<ActorAttributesInfo, "magicPoints" | "runePoints">,
  grouped: GroupedActions,
): SpellGroups {
  const subgroups = new Map<string, DerivedGroup>();
  for (const cult of attributes.runePoints) {
    subgroups.set(cultGroupId(cult.cultId), {
      id: cultGroupId(cult.cultId),
      name: cult.cultName,
      parentId: GROUP.runeMagic.id,
      info1: points(cult.value, cult.max),
    });
  }

  for (const spell of spells) {
    const isRuneMagic = spell.type === "runeMagic";
    let groupId: string = isRuneMagic ? GROUP.runeMagic.id : GROUP.spiritMagic.id;
    let name = spell.name;

    if (isRuneMagic) {
      if (spell.cultId) {
        groupId = cultGroupId(spell.cultId);
        if (!subgroups.has(groupId)) {
          subgroups.set(groupId, {
            id: groupId,
            name: spell.cultName ?? spell.cultId,
            parentId: GROUP.runeMagic.id,
          });
        }
      }
      if (spell.sourceName) {
        name = `${spell.name} (${spell.sourceName})`;
      }
    } else if (spell.source !== "own") {
      groupId = spiritSourceGroupId(spell);
      if (!subgroups.has(groupId)) {
        subgroups.set(groupId, {
          id: groupId,
          name: spell.sourceName ?? spell.source,
          parentId: GROUP.spiritMagic.id,
        });
      }
    }

    addTo(
      grouped,
      groupId,
      action(
        isRuneMagic ? ACTION_TYPE.runeMagic : ACTION_TYPE.spiritMagic,
        spellKey(spell),
        {
          name,
          img: spell.img,
          info1: { text: `${spell.points}${spell.isVariable ? "+" : ""}` },
        },
        spell.uuid ? { itemUuid: spell.uuid } : {},
      ),
    );
  }

  const groupInfo = new Map<string, TahInfo>();
  const magicPoints = points(attributes.magicPoints.value, attributes.magicPoints.max);
  if (magicPoints) {
    groupInfo.set(GROUP.spiritMagic.id, magicPoints);
  }

  return {
    // Cults without any spells to cast are left out
    subgroups: [...subgroups.values()].filter((g) => grouped.has(g.id)),
    groupInfo,
  };
}

function cultGroupId(cultId: string): string {
  return `rune-magic-cult-${cultId}`;
}

/** Matrices are told apart by item id, spirits only by name since they have no id in the API. */
function spiritSourceGroupId(spell: CastableSpell): string {
  const key =
    spell.matrix?.itemId ?? (spell.sourceName ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-");
  return `spirit-magic-${spell.source}-${key}`;
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
