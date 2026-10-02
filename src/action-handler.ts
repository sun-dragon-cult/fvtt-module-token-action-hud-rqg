import {
  buildAbilityActions,
  buildCharacteristicActions,
  buildSpellActions,
  buildStatusEffectActions,
  buildWeaponActions,
  type GroupedActions,
} from "./build-actions";
import { getSetting } from "./settings";
import type { TahCoreModule } from "./types/tah-core";

export function createActionHandler(coreModule: TahCoreModule) {
  const localize = (key: string) => coreModule.api.Utils.i18n(key);

  return class RqgActionHandler extends coreModule.api.ActionHandler {
    /** Called by Core whenever the HUD is (re)built. */
    async buildSystemActions(_groupIds: string[]): Promise<void> {
      const grouped: GroupedActions = new Map();

      if (this.actor) {
        this.buildSingleActorActions(this.actor, grouped);
      } else {
        this.buildMultipleActorActions(grouped);
      }

      for (const [groupId, actions] of grouped) {
        this.addActions(actions, { id: groupId, type: "system" });
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
      buildSpellActions(query.spells(actorRef), grouped);
      buildCharacteristicActions(
        query.characteristics(actorRef),
        query.attributes(actorRef).reputation,
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
