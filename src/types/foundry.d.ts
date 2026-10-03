/**
 * Minimal declarations for the Foundry VTT globals this module uses. The full fvtt-types package
 * is large and slow to typecheck, and this module only touches a small surface.
 */

declare global {
  interface Actor {
    id: string;
    name: string;
    type: string;
    system: unknown;
    items: { get(id: string): Item | undefined; contents: Item[] };
    statuses: Set<string>;
    sheet: { render(options: { force: boolean }): unknown } | null;
    toggleStatusEffect(statusId: string, options?: { overlay?: boolean }): Promise<unknown>;
  }

  interface Item {
    id: string;
    name: string;
    type: string;
    system: unknown;
    sheet: { render(options: { force: boolean }): unknown } | null;
  }

  interface TokenDocument {
    id: string;
    name: string;
    actor: Actor | null;
  }

  interface Token {
    id: string;
    name: string;
    actor: Actor | null;
    document: TokenDocument;
  }

  interface StatusEffectConfig {
    id: string;
    name: string;
    img: string;
  }

  const game: {
    system: { id: string; api: import("./rqg-api").RqgApi };
    i18n: { localize(key: string): string };
    modules: { get(id: string): { api?: unknown } | undefined };
    settings: {
      register(namespace: string, key: string, config: Record<string, unknown>): void;
      get(namespace: string, key: string): unknown;
    };
  };

  const CONFIG: { statusEffects: StatusEffectConfig[] };

  function fromUuid(uuid: string): Promise<unknown>;

  const Hooks: {
    on(hook: string, fn: (...args: never[]) => unknown): number;
    once(hook: string, fn: (...args: never[]) => unknown): number;
    call(hook: string, ...args: unknown[]): boolean;
    callAll(hook: string, ...args: unknown[]): boolean;
  };
}

export {};
