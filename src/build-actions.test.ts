import { describe, expect, it } from "vitest";
import {
  buildAbilityActions,
  buildCharacteristicActions,
  buildSpellActions,
  buildStatusEffectActions,
  buildWeaponActions,
  type GroupedActions,
  spellKey,
} from "./build-actions";
import type { AbilityInfo, CastableSpell, WeaponUsageInfo } from "./types/rqg-api";

const localize = (key: string) => `[${key}]`;

function ability(name: string, type: AbilityInfo["type"], extra: Partial<AbilityInfo> = {}) {
  return {
    id: `${name}-id`,
    uuid: `Actor.a.Item.${name}-id`,
    rqid: undefined,
    name,
    img: null,
    type,
    chance: 50,
    category: undefined,
    hasExperience: false,
    ...extra,
  } satisfies AbilityInfo;
}

function weaponUsage(
  weaponId: string,
  usage: WeaponUsageInfo["usage"],
  extra: Partial<WeaponUsageInfo> = {},
) {
  return {
    weaponId,
    weaponUuid: `Actor.a.Item.${weaponId}`,
    name: weaponId,
    img: null,
    usage,
    equippedStatus: "equipped",
    skillId: "s",
    skillName: "Skill",
    chance: 60,
    strikeRank: 2,
    unusable: false,
    ...extra,
  } satisfies WeaponUsageInfo;
}

function spell(name: string, extra: Partial<CastableSpell> = {}) {
  return {
    type: "spiritMagic",
    name,
    img: null,
    points: 2,
    isVariable: false,
    isOneUse: false,
    cultId: undefined,
    cultName: undefined,
    source: "own",
    sourceName: undefined,
    uuid: `Actor.a.Item.${name}`,
    matrix: undefined,
    ...extra,
  } satisfies CastableSpell;
}

describe("buildAbilityActions", () => {
  it("groups skills by category and passions and runes by type", () => {
    const grouped: GroupedActions = new Map();
    buildAbilityActions(
      [
        ability("Scan", "skill", { category: "perception", chance: 45 }),
        ability("Hate (Lunars)", "passion"),
        ability("Air", "rune"),
      ],
      grouped,
    );

    expect([...grouped.keys()]).toEqual(["skills-perception", "passions", "runes"]);
    expect(grouped.get("skills-perception")?.[0]).toMatchObject({
      id: "ability-Scan-id",
      name: "Scan",
      info1: { text: "45%" },
      system: { actionType: "ability", actionId: "Scan-id", itemUuid: "Actor.a.Item.Scan-id" },
    });
  });
});

describe("buildWeaponActions", () => {
  it("adds the usage to the name only when the weapon has more than one", () => {
    const grouped: GroupedActions = new Map();
    buildWeaponActions(
      [
        weaponUsage("Spear", "oneHand"),
        weaponUsage("Spear", "twoHand", { unusable: true }),
        weaponUsage("Fist", "oneHand"),
      ],
      localize,
      grouped,
    );

    const actions = grouped.get("weapons") ?? [];
    expect(actions.map((a) => a.name)).toEqual([
      "Spear ([RQG.Game.WeaponUsage.oneHand])",
      "Spear ([RQG.Game.WeaponUsage.twoHand])",
      "Fist",
    ]);
    expect(actions.map((a) => a.id)).toEqual([
      "weapon-Spear-oneHand",
      "weapon-Spear-twoHand",
      "weapon-Fist-oneHand",
    ]);
    expect(actions[1]).toMatchObject({
      cssClass: "disabled",
      system: { actionId: "Spear", usage: "twoHand" },
    });
    expect(actions[0]?.info2).toEqual({ text: "SR 2" });
  });
});

describe("buildSpellActions", () => {
  it("puts spirit and rune magic in their own groups, naming external sources", () => {
    const grouped: GroupedActions = new Map();
    buildSpellActions(
      [
        spell("Bladesharp", { isVariable: true }),
        spell("Heal", {
          source: "matrix",
          sourceName: "Crystal",
          uuid: undefined,
          matrix: { itemId: "g1", entryIndex: 0 },
        }),
        spell("Lightning", { type: "runeMagic", cultName: "Orlanth", points: 1 }),
      ],
      grouped,
    );

    expect(grouped.get("spirit-magic")?.map((a) => [a.name, a.info1?.text])).toEqual([
      ["Bladesharp", "2+"],
      ["Heal (Crystal)", "2"],
    ]);
    expect(grouped.get("spirit-magic")?.[1]?.system).toEqual({
      actionType: "spiritMagic",
      actionId: "matrix-g1-0",
    });
    expect(grouped.get("rune-magic")?.[0]).toMatchObject({
      name: "Lightning",
      info2: { text: "Orlanth" },
      system: { actionType: "runeMagic" },
    });
  });

  it("keys spells by uuid, or by matrix item and index", () => {
    expect(spellKey(spell("Heal"))).toBe("Actor.a.Item.Heal");
    expect(
      spellKey(spell("Heal", { uuid: undefined, matrix: { itemId: "g1", entryIndex: 3 } })),
    ).toBe("matrix-g1-3");
  });
});

describe("buildCharacteristicActions", () => {
  it("shows ×5 chances for a single actor", () => {
    const grouped: GroupedActions = new Map();
    buildCharacteristicActions(
      {
        strength: 13,
        constitution: 11,
        size: 14,
        dexterity: 10,
        intelligence: 12,
        power: 15,
        charisma: null,
      },
      20,
      localize,
      grouped,
    );

    const actions = grouped.get("characteristics") ?? [];
    expect(actions).toHaveLength(8);
    expect(actions[0]).toMatchObject({
      name: "[RQG.Actor.Characteristics.strength]",
      info1: { text: "65%" },
    });
    expect(actions[6]?.info1).toBeUndefined();
    expect(actions[7]).toMatchObject({ id: "reputation-reputation", info1: { text: "20%" } });
  });

  it("leaves out chances when there are several actors", () => {
    const grouped: GroupedActions = new Map();
    buildCharacteristicActions(undefined, undefined, localize, grouped);
    expect(grouped.get("characteristics")?.every((a) => a.info1 === undefined)).toBe(true);
  });
});

describe("buildStatusEffectActions", () => {
  it("marks an effect active only when every actor has it", () => {
    const grouped: GroupedActions = new Map();
    const effects = [
      { id: "prone", name: "EFFECT.StatusProne", img: "prone.svg" },
      { id: "dead", name: "EFFECT.StatusDead", img: "dead.svg" },
    ];
    buildStatusEffectActions(
      effects,
      [{ statuses: new Set(["prone", "dead"]) }, { statuses: new Set(["prone"]) }],
      localize,
      grouped,
    );

    expect(grouped.get("status-effects")?.map((a) => a.cssClass)).toEqual([
      "toggle active",
      "toggle",
    ]);
  });
});
