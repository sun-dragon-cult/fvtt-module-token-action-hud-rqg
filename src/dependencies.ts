import type { CastableSpell, MagicPointSource } from "./types/rqg-api";

const REFRESH_HOOKS = [
  "updateActor",
  "deleteActor",
  "createItem",
  "updateItem",
  "deleteItem",
  "createActiveEffect",
  "updateActiveEffect",
  "deleteActiveEffect",
];

/** Uuids of the actors, other than the HUD's own, whose spells or magic points it shows. */
export function dependencyActorUuids(
  actorUuid: string,
  spells: CastableSpell[],
  sources: MagicPointSource[],
): Set<string> {
  const uuids = new Set<string>();
  for (const { source, sourceId } of spells) {
    if (source === "allied") {
      uuids.add(sourceId);
    } else if (source === "boundSpirit") {
      // "boundSpirit:<itemId>:<spiritUuid>"
      uuids.add(sourceId.split(":").slice(2).join(":"));
    }
  }
  for (const { type, uuid } of sources) {
    if (type === "ally" || type === "boundSpirit") {
      uuids.add(uuid);
    }
  }
  uuids.delete(actorUuid);
  uuids.delete("");
  return uuids;
}

let dependencies = new Set<string>();

export function setDependencies(uuids: Set<string>): void {
  dependencies = uuids;
}

type DocumentLike = { documentName?: string; uuid?: string; parent?: DocumentLike | null };

function owningActorUuid(document: DocumentLike | null | undefined): string | undefined {
  let current = document;
  while (current && current.documentName !== "Actor") {
    current = current.parent;
  }
  return current?.uuid;
}

/** Core only refreshes on changes to the controlled actor, so refresh on its dependencies too. */
export function registerDependencyHooks(): void {
  const onChange = (document: DocumentLike) => {
    const uuid = owningActorUuid(document);
    if (uuid && dependencies.has(uuid)) {
      Hooks.callAll("forceUpdateTokenActionHud");
    }
  };
  for (const hook of REFRESH_HOOKS) {
    Hooks.on(hook, onChange);
  }
}
