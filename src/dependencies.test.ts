import { afterEach, describe, expect, it, vi } from "vitest";
import { dependencyActorUuids, registerDependencyHooks, setDependencies } from "./dependencies";
import type { CastableSpell, MagicPointSource } from "./types/rqg-api";

const spell = (source: CastableSpell["source"], sourceId: string) =>
  ({ source, sourceId }) as CastableSpell;
const mpSource = (type: MagicPointSource["type"], uuid: string) =>
  ({ id: uuid, type, name: "", magicPoints: { value: 0, max: 0 }, uuid }) as MagicPointSource;

describe("dependencyActorUuids", () => {
  it("collects allies and bound spirits from spells and magic point sources", () => {
    const result = dependencyActorUuids(
      "Actor.me",
      [
        spell("own", "Actor.me"),
        spell("allied", "Actor.ally"),
        spell("boundSpirit", "boundSpirit:item1:Actor.spirit1"),
        spell("matrix", "Actor.me.Item.matrix"),
      ],
      [
        mpSource("self", "Actor.me"),
        mpSource("item", "Actor.me.Item.crystal"),
        mpSource("boundSpirit", "Actor.spirit2"),
      ],
    );

    expect([...result].sort()).toEqual(["Actor.ally", "Actor.spirit1", "Actor.spirit2"]);
  });

  it("leaves out the HUD's own actor", () => {
    expect(dependencyActorUuids("Actor.me", [], [mpSource("ally", "Actor.me")]).size).toBe(0);
  });
});

describe("registerDependencyHooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setDependencies(new Set());
  });

  function register() {
    const handlers = new Map<string, (document: unknown) => void>();
    const callAll = vi.fn();
    vi.stubGlobal("Hooks", { on: (hook: string, fn: never) => handlers.set(hook, fn), callAll });
    registerDependencyHooks();
    return { handlers, callAll };
  }

  const actor = (uuid: string) => ({ documentName: "Actor", uuid });

  it("forces a HUD update when a dependency or a document embedded in it changes", () => {
    const { handlers, callAll } = register();
    setDependencies(new Set(["Actor.ally"]));
    const ally = actor("Actor.ally");

    handlers.get("updateActor")?.(ally);
    handlers.get("updateItem")?.({ documentName: "Item", parent: ally });
    handlers.get("createActiveEffect")?.({
      documentName: "ActiveEffect",
      parent: { documentName: "Item", parent: ally },
    });

    expect(callAll).toHaveBeenCalledTimes(3);
    expect(callAll).toHaveBeenCalledWith("forceUpdateTokenActionHud");
  });

  it("ignores other actors", () => {
    const { handlers, callAll } = register();
    setDependencies(new Set(["Actor.ally"]));

    handlers.get("updateActor")?.(actor("Actor.other"));
    handlers.get("deleteItem")?.({ documentName: "Item", parent: null });

    expect(callAll).not.toHaveBeenCalled();
  });
});
