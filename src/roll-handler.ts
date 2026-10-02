import { spellKey } from "./build-actions";
import { ACTION_TYPE, type RqgActionSystemData } from "./constants";
import type { CharacteristicName, UsageType } from "./types/rqg-api";
import type { TahCoreModule } from "./types/tah-core";

export function createRollHandler(coreModule: TahCoreModule) {
  return class RqgRollHandler extends coreModule.api.RollHandler {
    /**
     * Called by Core when an action is clicked. Shift-click rolls without the dialog, right-click
     * opens the item's sheet. With several tokens selected the action is done for each of them.
     */
    async handleActionClick(_event: Event, _buttonValue: string): Promise<void> {
      const data = this.action?.system as RqgActionSystemData | undefined;
      if (!data) {
        return;
      }

      if (this.actor) {
        await this.handleAction(data, this.actor, this.token);
        return;
      }
      for (const token of coreModule.api.Utils.getControlledTokens()) {
        if (token.actor) {
          await this.handleAction(data, token.actor, token);
        }
      }
    }

    private async handleAction(
      data: RqgActionSystemData,
      actor: Actor,
      token: Token | null,
    ): Promise<void> {
      if (this.isRightClick && data.itemUuid) {
        const item = (await fromUuid(data.itemUuid)) as Item | null;
        item?.sheet?.render({ force: true });
        return;
      }

      const { rolls, query } = game.system.api;
      const actorRef = token?.document ?? actor;
      const skipDialog = this.isShift;

      switch (data.actionType) {
        case ACTION_TYPE.ability:
          await rolls.ability(data.actionId, { actor: actorRef, skipDialog });
          break;
        case ACTION_TYPE.characteristic:
          await rolls.characteristic(data.actionId as CharacteristicName, {
            actor: actorRef,
            skipDialog,
          });
          break;
        case ACTION_TYPE.reputation:
          await rolls.reputation({ actor: actorRef, skipDialog });
          break;
        case ACTION_TYPE.weapon:
          await rolls.attack(data.actionId, {
            actor: actorRef,
            usage: data.usage as UsageType,
          });
          break;
        case ACTION_TYPE.spiritMagic:
        case ACTION_TYPE.runeMagic: {
          // Look the spell up again, its source (an allied spirit or a matrix) may have changed
          const spell = query.spells(actorRef).find((s) => spellKey(s) === data.actionId);
          if (!spell) {
            return;
          }
          const cast =
            data.actionType === ACTION_TYPE.runeMagic ? rolls.runeMagic : rolls.spiritMagic;
          await cast(spell, { actor: actorRef, skipDialog });
          break;
        }
        case ACTION_TYPE.statusEffect:
          await actor.toggleStatusEffect(data.actionId, { overlay: this.isRightClick });
          Hooks.callAll("forceUpdateTokenActionHud");
          break;
      }
    }
  };
}
