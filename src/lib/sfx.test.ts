import { describe, expect, it } from "vitest";

import {
  applauseSwell,
  APPLAUSE_CLAP_COUNT,
  APPLAUSE_DURATION_S,
  buildApplauseClaps,
  DRUM_ROLL_ACCENT_GAP_S,
  DRUM_ROLL_TAP_COUNT,
  drumRollTapOffsets,
  MAP_TRAVEL_DURATION_S,
  playMapTravelSfx,
  playMissionStartSfx,
  playRewardApplauseSfx,
} from "./sfx";

describe("sound effect shapes", () => {
  it("map travel whoosh has a positive, short duration", () => {
    expect(MAP_TRAVEL_DURATION_S).toBeGreaterThan(0);
    expect(MAP_TRAVEL_DURATION_S).toBeLessThan(1);
  });

  describe("mission start drum roll", () => {
    it("produces one offset per tap, starting at zero", () => {
      const offsets = drumRollTapOffsets();
      expect(offsets).toHaveLength(DRUM_ROLL_TAP_COUNT);
      expect(offsets[0]).toBe(0);
    });

    it("accelerates — each gap between taps is shorter than the last", () => {
      const offsets = drumRollTapOffsets();
      const gaps = offsets.slice(1).map((t, i) => t - offsets[i]);
      for (let i = 1; i < gaps.length; i += 1) {
        expect(gaps[i]).toBeLessThan(gaps[i - 1]);
      }
    });

    it("honours custom count/interval/accel arguments", () => {
      const offsets = drumRollTapOffsets(4, 0.1, 0.5);
      expect(offsets).toHaveLength(4);
      [0, 0.1, 0.15, 0.175].forEach((expected, i) => {
        expect(offsets[i]).toBeCloseTo(expected);
      });
    });

    it("closes with a positive gap before the accent hit", () => {
      expect(DRUM_ROLL_ACCENT_GAP_S).toBeGreaterThan(0);
    });
  });

  describe("reward applause", () => {
    it("swell ramps up, holds, then ramps back down", () => {
      expect(applauseSwell(0)).toBe(0);
      expect(applauseSwell(0.18)).toBeCloseTo(1);
      expect(applauseSwell(0.4)).toBe(1);
      expect(applauseSwell(1)).toBe(0);
    });

    it("never lets the swell go negative or above 1", () => {
      for (let f = 0; f <= 1; f += 0.05) {
        expect(applauseSwell(f)).toBeGreaterThanOrEqual(0);
        expect(applauseSwell(f)).toBeLessThanOrEqual(1);
      }
    });

    it("builds the expected number of claps, all within the total duration", () => {
      const claps = buildApplauseClaps(APPLAUSE_CLAP_COUNT, APPLAUSE_DURATION_S, () => 0.5);
      expect(claps).toHaveLength(APPLAUSE_CLAP_COUNT);
      for (const clap of claps) {
        expect(clap.startOffset).toBeGreaterThanOrEqual(0);
        expect(clap.startOffset).toBeLessThanOrEqual(APPLAUSE_DURATION_S);
        expect(clap.duration).toBeGreaterThan(0);
        expect(clap.gain).toBeGreaterThanOrEqual(0);
        expect(clap.frequency).toBeGreaterThan(0);
      }
    });

    it("is deterministic given a fixed random source", () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.9, 0.5, 0.6, 0.7];
      let i = 0;
      const random = () => values[i++];
      const claps = buildApplauseClaps(2, 1, random);
      expect(claps.map((c) => c.startOffset)).toEqual([0.1, 0.9]);
    });
  });
});

describe("playback without a browser audio context", () => {
  // These tests run under Node (no `window`), matching how the module behaves
  // when Web Audio is unavailable: it should resolve quietly instead of throwing.
  it("playMissionStartSfx resolves", async () => {
    await expect(playMissionStartSfx()).resolves.toBeUndefined();
  });

  it("playMapTravelSfx resolves", async () => {
    await expect(playMapTravelSfx()).resolves.toBeUndefined();
  });

  it("playRewardApplauseSfx resolves", async () => {
    await expect(playRewardApplauseSfx()).resolves.toBeUndefined();
  });
});
