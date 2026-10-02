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

export type TahGroupData = { id: string; type?: "system" | "custom" | "core" };

export type TahGroup = TahGroupData & {
  name: string;
  listName?: string;
  nestId?: string;
  groups?: TahGroup[];
};

export type TahDefaults = { layout: TahGroup[]; groups: TahGroup[] };

export interface TahActionHandler {
  actor: Actor | null;
  token: Token | null;
  actors: Actor[];
  tokens: Token[];
  addActions(actionsData: TahActionData[], groupData: TahGroupData): void;
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
