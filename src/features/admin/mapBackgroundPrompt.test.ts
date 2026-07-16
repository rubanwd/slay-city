import { describe, expect, it } from "vitest";

import { MAP_ASPECT } from "../map/mapConstants";
import {
  MAP_IMAGE_HEIGHT,
  MAP_IMAGE_WIDTH,
  buildMapBackgroundPrompt,
} from "./mapBackgroundPrompt";

describe("MAP_IMAGE dimensions", () => {
  it("match the map aspect ratio the cropper uses", () => {
    expect(MAP_IMAGE_WIDTH / MAP_IMAGE_HEIGHT).toBeCloseTo(MAP_ASPECT, 3);
  });
});

describe("buildMapBackgroundPrompt", () => {
  it("names the district", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour" });
    expect(prompt).toContain("Neon Harbour");
  });

  it("includes the district description when given", () => {
    const prompt = buildMapBackgroundPrompt({
      districtName: "Neon Harbour",
      districtDescription: "A busy port full of container cranes",
    });
    expect(prompt).toContain("A busy port full of container cranes");
  });

  it("lists every location as a numbered landmark", () => {
    const prompt = buildMapBackgroundPrompt({
      districtName: "Neon Harbour",
      locations: [
        { name: "Fish Market", description: "Stalls under neon awnings" },
        { name: "Lighthouse" },
      ],
    });
    expect(prompt).toContain("1. Fish Market — Stalls under neon awnings");
    expect(prompt).toContain("2. Lighthouse");
  });

  it("omits the landmark section when there are no locations", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour", locations: [] });
    expect(prompt).not.toContain("landmarks");
  });

  it("skips locations with a blank name", () => {
    const prompt = buildMapBackgroundPrompt({
      districtName: "Neon Harbour",
      locations: [{ name: "  " }, { name: "Lighthouse" }],
    });
    expect(prompt).toContain("1. Lighthouse");
  });

  it("states the map size and aspect ratio", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour" });
    expect(prompt).toContain(`${MAP_IMAGE_WIDTH}x${MAP_IMAGE_HEIGHT}`);
    expect(prompt).toContain("3:4");
  });

  it("states the muted top-down palette", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour" });
    for (const hex of ["#111111", "#1B1F26", "#2E3A4E", "#2F4A32", "#C8A87C", "#F0B860"]) {
      expect(prompt).toContain(hex);
    }
  });

  it("asks for a straight top-down view and rules out neon", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour" });
    expect(prompt).toContain("top-down orthographic");
    expect(prompt).toContain("No neon");
  });

  it("bans text so the model does not fight the location labels", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "Neon Harbour" });
    expect(prompt).toContain("no text");
  });

  it("appends the admin's extra instructions", () => {
    const prompt = buildMapBackgroundPrompt({
      districtName: "Neon Harbour",
      extraInstructions: "heavy rain and puddles",
    });
    expect(prompt).toContain("heavy rain and puddles");
  });

  it("collapses whitespace from form input", () => {
    const prompt = buildMapBackgroundPrompt({
      districtName: "  Neon   Harbour \n",
      extraInstructions: "heavy\n\nrain",
    });
    expect(prompt).toContain('"Neon Harbour"');
    expect(prompt).toContain("heavy rain");
  });

  it("falls back to a placeholder rather than an empty district name", () => {
    const prompt = buildMapBackgroundPrompt({ districtName: "   " });
    expect(prompt).toContain("Unnamed District");
  });
});
