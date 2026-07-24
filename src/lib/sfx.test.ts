import { describe, expect, it } from "vitest";

import {
  MAP_TRAVEL_DURATION_S,
  MISSION_START_NOTES,
  MISSION_START_NOTE_DURATION_S,
  playMapTravelSfx,
  playMissionStartSfx,
  playRewardFanfareSfx,
  REWARD_FANFARE_NOTE_DURATION_S,
  REWARD_FANFARE_NOTE_GAP_S,
  REWARD_FANFARE_NOTES,
} from "./sfx";

describe("sound effect shapes", () => {
  it("mission start rises from one note to a higher one", () => {
    expect(MISSION_START_NOTES.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < MISSION_START_NOTES.length; i += 1) {
      expect(MISSION_START_NOTES[i]).toBeGreaterThan(MISSION_START_NOTES[i - 1]);
    }
    expect(MISSION_START_NOTE_DURATION_S).toBeGreaterThan(0);
  });

  it("map travel whoosh has a positive, short duration", () => {
    expect(MAP_TRAVEL_DURATION_S).toBeGreaterThan(0);
    expect(MAP_TRAVEL_DURATION_S).toBeLessThan(1);
  });

  it("reward fanfare climbs through at least three notes", () => {
    expect(REWARD_FANFARE_NOTES.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < REWARD_FANFARE_NOTES.length; i += 1) {
      expect(REWARD_FANFARE_NOTES[i]).toBeGreaterThan(REWARD_FANFARE_NOTES[i - 1]);
    }
    expect(REWARD_FANFARE_NOTE_GAP_S).toBeGreaterThan(0);
    expect(REWARD_FANFARE_NOTE_DURATION_S).toBeGreaterThan(0);
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

  it("playRewardFanfareSfx resolves", async () => {
    await expect(playRewardFanfareSfx()).resolves.toBeUndefined();
  });
});
