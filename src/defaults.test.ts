import { describe, expect, it } from "vitest";
import { getDefaults } from "./defaults";

describe("getDefaults", () => {
  const { layout, groups } = getDefaults((key) => key);

  it("nests each group under a top level category", () => {
    expect(layout.map((n) => n.id)).toEqual([
      "combat",
      "skills",
      "magic",
      "passions-runes",
      "characteristics",
      "effects",
      "utility",
    ]);
    expect(layout[1]?.groups).toHaveLength(12);
    expect(layout[2]?.groups?.map((g) => g.nestId)).toEqual([
      "magic_spirit-magic",
      "magic_rune-magic",
    ]);
    expect(layout[2]?.groups?.map((g) => g.settings?.style)).toEqual(["tab", "tab"]);
  });

  it("lists every layout group once, without nest ids", () => {
    const layoutGroupIds = layout.flatMap((n) => n.groups ?? []).map((g) => g.id);
    expect(groups.map((g) => g.id)).toEqual(layoutGroupIds);
    expect(new Set(layoutGroupIds).size).toBe(layoutGroupIds.length);
    expect(groups.every((g) => g.nestId === undefined)).toBe(true);
  });
});
