import { describe, expect, it, vi } from "vitest";
import { abilityInfos, hitLocationInfos, weaponUsageInfos } from "./rqg-data";

function item(overrides: Record<string, unknown>) {
  return {
    id: "i",
    uuid: "Actor.a.Item.i",
    name: "Item",
    img: "i.svg",
    sort: 0,
    type: "skill",
    system: {},
    getFlag: vi.fn(),
    ...overrides,
  };
}

const actorWith = (...items: object[]) => ({ items: { contents: items } }) as unknown as Actor;

describe("abilityInfos", () => {
  it("lists skills, runes and passions by name and sets the category for skills only", () => {
    const actor = actorWith(
      item({ id: "s", name: "Scan", system: { chance: 45, category: "perception" } }),
      item({ id: "p", name: "Hate", type: "passion", system: { chance: 70, category: "x" } }),
      item({ id: "w", name: "Spear", type: "weapon" }),
    );

    const result = abilityInfos(actor);

    expect(result.map((a) => a.name)).toEqual(["Hate", "Scan"]);
    expect(result.map((a) => a.category)).toEqual([undefined, "perception"]);
  });

  it("reads the rqid from the document flags", () => {
    const flagged = item({ getFlag: vi.fn(() => ({ id: "i.skill.scan" })) });

    expect(abilityInfos(actorWith(flagged))[0]?.rqid).toBe("i.skill.scan");
  });
});

describe("weaponUsageInfos", () => {
  const usage = (rqid?: string) => ({ skillRqidLink: rqid ? { rqid } : undefined, strikeRank: 7 });
  const weapon = (id: string, equippedStatus: string, sort = 0, isNatural = false) =>
    item({
      id,
      name: id,
      type: "weapon",
      sort,
      system: {
        equippedStatus,
        isNatural,
        usage: {
          oneHand: usage("i.skill.spear"),
          offHand: usage(),
          twoHand: usage("i.skill.spear"),
          missile: usage(),
        },
        getUsageInfo: vi.fn(() => ({
          skillItem: { id: "s", name: "Spear" },
          totalChance: 80,
          unusable: false,
        })),
      },
    });

  it("lists equipped weapon usages that have a linked skill", () => {
    const actor = actorWith(weapon("Spear", "equipped"), weapon("Axe", "carried"));

    const result = weaponUsageInfos(actor, { includeUnequipped: false });

    expect(result.map((u) => [u.name, u.usage])).toEqual([
      ["Spear", "oneHand"],
      ["Spear", "twoHand"],
    ]);
    expect(result[0]).toMatchObject({
      chance: 80,
      skillName: "Spear",
      strikeRank: 7,
      unusable: false,
    });
  });

  it("lists natural weapons whatever their equipped status", () => {
    const actor = actorWith(weapon("Fist", "notCarried", 0, true), weapon("Axe", "carried"));

    const result = weaponUsageInfos(actor, { includeUnequipped: false });

    expect(result.map((u) => u.name)).toEqual(["Fist", "Fist"]);
  });

  it("includes carried weapons on request, in sheet order", () => {
    const actor = actorWith(weapon("Spear", "equipped", 2), weapon("Axe", "carried", 1));

    const result = weaponUsageInfos(actor, { includeUnequipped: true });

    expect(result.map((u) => u.name)).toEqual(["Axe", "Axe", "Spear", "Spear"]);
  });
});

describe("hitLocationInfos", () => {
  const location = (id: string, dieFrom: number) =>
    item({
      id,
      name: id,
      type: "hitLocation",
      system: { dieFrom, hitPoints: { value: 3, max: 5 } },
    });

  it("lists hit locations from the head down", () => {
    const actor = actorWith(location("Left Leg", 1), location("Head", 19), location("Chest", 12));

    expect(hitLocationInfos(actor).map((l) => [l.name, l.hitPoints.value])).toEqual([
      ["Head", 3],
      ["Chest", 3],
      ["Left Leg", 3],
    ]);
  });
});
