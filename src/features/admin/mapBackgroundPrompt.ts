import { MAP_ASPECT } from "../map/mapConstants";

/**
 * Pixel size requested from the image model, matched to `MAP_ASPECT` so a
 * generated background needs no cropping before it becomes the map backdrop.
 */
export const MAP_IMAGE_WIDTH = 1024;
export const MAP_IMAGE_HEIGHT = Math.round(MAP_IMAGE_WIDTH / MAP_ASPECT);

/** A location already added to the district, used to shape the scene. */
export interface MapBackgroundLocation {
  name: string;
  description?: string | null;
}

export interface MapBackgroundPromptInput {
  districtName: string;
  districtDescription?: string | null;
  /** Locations already added to this district, in map order. May be empty. */
  locations?: MapBackgroundLocation[];
  /** Free-form extra requirements typed by the admin. */
  extraInstructions?: string | null;
}

/** Collapses whitespace and trims — model input should not carry form artefacts. */
function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Builds the OpenRouter prompt for a district map background.
 *
 * The style block is fixed so every district reads as the same city: brand
 * palette, night-time neon, illustrated game art. Only the district's own
 * identity and the admin's extra notes vary. Text is banned outright — location
 * names are drawn by `MapLocationNode` on top of this image, and image models
 * render lettering poorly.
 */
export function buildMapBackgroundPrompt(input: MapBackgroundPromptInput): string {
  const name = clean(input.districtName) || "Unnamed District";
  const description = clean(input.districtDescription);
  const extra = clean(input.extraInstructions);

  const locations = (input.locations ?? [])
    .map((loc) => ({ name: clean(loc.name), description: clean(loc.description) }))
    .filter((loc) => loc.name !== "");

  const sections: string[] = [];

  sections.push(
    `Illustrated background art for the "${name}" district of SLAY CITY, a neon city map in a mobile English-learning game for children aged 7-14.`
  );

  if (description) {
    sections.push(`District concept: ${description}`);
  }

  if (locations.length > 0) {
    const list = locations
      .map((loc, i) =>
        loc.description ? `${i + 1}. ${loc.name} — ${loc.description}` : `${i + 1}. ${loc.name}`
      )
      .join("\n");
    sections.push(
      `The district contains these landmarks. Show each one as a distinct, recognisable building or feature, spread across the scene so none overlap:\n${list}`
    );
  }

  sections.push(
    [
      `Composition: portrait ${MAP_IMAGE_WIDTH}x${MAP_IMAGE_HEIGHT} pixels, 3:4 aspect ratio.`,
      "Slightly elevated three-quarter view looking down over the district, like a stylised game world map.",
      "Landmarks sit in the middle band of the image. Keep the composition uncluttered and readable at phone size (390px wide) — round interactive markers will be layered on top, so avoid busy detail that would compete with them.",
      "The skyline hugs the bottom edge; the night sky fills the top.",
    ].join(" ")
  );

  sections.push(
    [
      "Style: bold, playful, vibrant cartoon/vector game art with clean shapes and thick outlines. Night-time neon city energy — glowing signs, light bloom, wet reflective streets. Fun and high-energy, never school-like or corporate.",
      "Palette — use these colours only: neon pink #FF2D8E, lime green #9DFF00, cyan #00F0FF, purple #6A00FF, on a near-black #111111 background.",
    ].join(" ")
  );

  sections.push(
    "Hard constraints: no text, no letters, no numbers, no signage lettering, no logos, no watermarks. No people, characters, or mascots. No UI elements, map pins, markers, frames, or borders. Background art only, edge to edge."
  );

  if (extra) {
    sections.push(`Additional art direction from the designer (follow it closely): ${extra}`);
  }

  return sections.join("\n\n");
}
