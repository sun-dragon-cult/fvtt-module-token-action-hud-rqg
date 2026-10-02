import { createActionHandler } from "./action-handler";
import { MODULE_ID, REQUIRED_CORE_MODULE_VERSION } from "./constants";
import { getDefaults } from "./defaults";
import { createRollHandler } from "./roll-handler";
import { registerSettings } from "./settings";
import type { TahCoreModule } from "./types/tah-core";

// Core hands over its API in this hook. The system module answers with its SystemManager,
// which Core then uses to create the action and roll handlers.
Hooks.on("tokenActionHudCoreApiReady", (coreModule: TahCoreModule) => {
  const localize = (key: string) => coreModule.api.Utils.i18n(key);
  const ActionHandler = createActionHandler(coreModule);
  const RollHandler = createRollHandler(coreModule);

  class SystemManager extends coreModule.api.SystemManager {
    getActionHandler() {
      return new ActionHandler();
    }

    getAvailableRollHandlers() {
      return { core: "Core RuneQuest Glorantha" };
    }

    getRollHandler(_rollHandlerId: string) {
      return new RollHandler();
    }

    registerSettings(onChange: (key: string, value: unknown) => void) {
      registerSettings(onChange);
    }

    async registerDefaults() {
      return getDefaults(localize);
    }
  }

  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = { requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION, SystemManager };
  }
  Hooks.call("tokenActionHudSystemReady", module);
});
