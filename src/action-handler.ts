import {
  buildAbilityActions,
  buildCharacteristicActions,
  buildSpellActions,
  buildStatusEffectActions,
  buildWeaponActions,
  type GroupedActions,
  type SpellGroups,
} from "./build-actions";
import { getSetting } from "./settings";
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
      const attributes = query.attributes(actorRef);
      const spellGroups = buildSpellActions(query.spells(actorRef), attributes, grouped);
      this.addSpellGroups(spellGroups);
      buildCharacteristicActions(
        query.characteristics(actorRef),
        attributes.reputation,
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
