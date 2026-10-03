import {
  buildAbilityActions,
  buildCharacteristicActions,
  buildSpellActions,
  buildStatusEffectActions,
  buildWeaponActions,
  type GroupedActions,
  type SpellGroups,
  type SpellPoints,
} from "./build-actions";
import { getSetting } from "./settings";
import type { CharacteristicName } from "./types/rqg-api";
import type { CharacterSystemData, CultSystemData } from "./types/rqg-schema";
import type { TahCoreModule } from "./types/tah-core";

export function createActionHandler(coreModule: TahCoreModule) {
  const localize = (key: string) => coreModule.api.Utils.i18n(key);

  return class RqgActionHandler extends coreModule.api.ActionHandler {
    /** Called by Core whenever the HUD is (re)built. */
    async buildSystemActions(_groupIds: string[]): Promise<void> {
      const grouped: GroupedActions = new Map();
      this.derivedGroupIds.clear();

      if (this.actor) {
        this.buildSingleActorActions(this.actor, grouped);
      } else {
        this.buildMultipleActorActions(grouped);
      }

      for (const [groupId, actions] of grouped) {
        const type = this.derivedGroupIds.has(groupId) ? "system-derived" : "system";
        this.addActions(actions, { id: groupId, type });
      }
    }

    /** Ids of the groups added for the current actor, see `addSpellGroups` */
    private derivedGroupIds = new Set<string>();

    /** Adds the cult and spell source subgroups, and magic and rune points as group info. */
    private addSpellGroups({ subgroups, groupInfo }: SpellGroups): void {
      for (const { id, name, parentId, info1 } of subgroups) {
        this.addGroup(
          { id, name, listName: `Group: ${name}`, type: "system-derived", info1 },
          { id: parentId, type: "system" },
          true,
        );
        this.derivedGroupIds.add(id);
      }
      for (const [id, info1] of groupInfo) {
        this.addGroupInfo({ id, type: "system", info: { info1 } });
      }
    }

    private buildSingleActorActions(actor: Actor, grouped: GroupedActions): void {
      const { query } = game.system.api;
      const actorRef = this.token?.document ?? actor;

      buildWeaponActions(
        query.weaponUsages(actorRef, {
          includeUnequipped: getSetting("showUnequippedWeapons"),
        }),
        localize,
        grouped,
      );
      buildAbilityActions(query.abilities(actorRef), grouped);
      const system = actor.system as CharacterSystemData;
      const spellGroups = buildSpellActions(
        query.spells(actorRef),
        spellPoints(actor, system),
        grouped,
      );
      this.addSpellGroups(spellGroups);
      buildCharacteristicActions(
        characteristicValues(system),
        system.background.reputation ?? 0,
        localize,
        grouped,
      );
      buildStatusEffectActions(CONFIG.statusEffects, [actor], localize, grouped);
    }

    /** With several tokens selected, offer what makes sense to do for all of them at once. */
    private buildMultipleActorActions(grouped: GroupedActions): void {
      const actors = this.actors.filter((a) => a != null);
      if (actors.length === 0) {
        return;
      }
      buildCharacteristicActions(undefined, undefined, localize, grouped);
      buildStatusEffectActions(CONFIG.statusEffects, actors, localize, grouped);
    }
  };
}

function characteristicValues(
  system: CharacterSystemData,
): Record<CharacteristicName, number | null> {
  const values = {} as Record<CharacteristicName, number | null>;
  for (const [name, { value }] of Object.entries(system.characteristics)) {
    values[name as CharacteristicName] = value;
  }
  return values;
}

function spellPoints(actor: Actor, system: CharacterSystemData): SpellPoints {
  return {
    magicPoints: system.attributes.magicPoints,
    runePoints: actor.items.contents
      .filter((item) => item.type === "cult")
      .map((cult) => ({
        cultId: cult.id,
        cultName: cult.name,
        ...(cult.system as CultSystemData).runePoints,
      })),
  };
}
