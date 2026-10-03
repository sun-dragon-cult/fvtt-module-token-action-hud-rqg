/**
 * The RQG data model fields this module reads. Mirrors the data models in fvtt-system-rqg
 * (src/data-model/), which are part of the system's public API. Only fields used here are declared.
 */

import type { CharacteristicName } from "./rqg-api";

export type RqgResource = { value: number | null; max: number | null };

export type CharacterSystemData = {
  characteristics: Record<CharacteristicName, { value: number | null }>;
  background: { reputation: number | null };
  attributes: { magicPoints: RqgResource };
};

export type CultSystemData = { runePoints: RqgResource };
