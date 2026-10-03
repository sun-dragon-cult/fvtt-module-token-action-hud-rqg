/**
 * The parts of Token Action HUD Core's API used by this module. Core hands its API to system
 * modules in the `tokenActionHudCoreApiReady` hook, so the base classes only exist at runtime.
 * See https://github.com/Larkinabout/fvtt-token-action-hud-core
 */

export type TahInfo = { text?: string; title?: string; class?: string };

export type TahActionData = {
  id: string;
  name: string;
  listName?: string;
  img?: string | null;
  cssClass?: string;
  tooltip?: string;
  info1?: TahInfo;
  info2?: TahInfo;
  info3?: TahInfo;
  system: Record<string, unknown>;
};

export type TahGroupData = {
  id: string;
  type?: "system" | "system-derived" | "custom" | "core";
};

/** Per group settings users can change in the HUD. `style` "tab" shows subgroups as tabs. */
export type TahGroupSettings = { style?: "tab" | "list"; showTitle?: boolean };

export type TahGroup = TahGroupData & {
  name: string;
  listName?: string;
  nestId?: string;
  settings?: TahGroupSettings;
  groups?: TahGroup[];
};

export type TahDefaults = { layout: TahGroup[]; groups: TahGroup[] };

export interface TahActionHandler {
  actor: Actor | null;
  token: Token | null;
  actors: Actor[];
  tokens: Token[];
  addActions(actionsData: TahActionData[], groupData: TahGroupData): void;
  /** Adds a group below every group matching `parentGroupData`. */
  addGroup(
    groupData: TahGroupData & { name: string; listName?: string; info1?: TahInfo },
    parentGroupData: TahGroupData,
    update?: boolean,
  ): void;
  addGroupInfo(
    groupData: TahGroupData & { info: { info1?: TahInfo; info2?: TahInfo; info3?: TahInfo } },
  ): void;
}

export interface TahRollHandler {
  action: { id: string; system: Record<string, unknown> } | null;
  actor: Actor | null;
  token: Token | null;
  isRightClick: boolean;
  isShift: boolean;
}

export type TahSystemManager = object;

export type TahCoreModule = {
  api: {
    ActionHandler: abstract new () => TahActionHandler;
    RollHandler: abstract new () => TahRollHandler;
    SystemManager: abstract new (moduleId: string) => TahSystemManager;
    Utils: {
      i18n(key: string): string;
      getControlledTokens(): Token[];
    };
  };
};
