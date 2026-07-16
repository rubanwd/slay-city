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
    `Top-down illustrated map art for the "${name}" district of SLAY CITY, the city map in a mobile English-learning game for children aged 7-14.`
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
      `The district contains these landmarks. Show each one as a distinct, recognisable building or feature seen from directly above, spread evenly around the plaza so none overlap, each joined to the path network:\n${list}`
    );
  }

  sections.push(
    [
      `Composition: portrait ${MAP_IMAGE_WIDTH}x${MAP_IMAGE_HEIGHT} pixels, 3:4 aspect ratio.`,
      "Strict top-down orthographic bird's-eye view, camera pointing straight down at the ground, like a board-game map or a city tile — no horizon, no sky, no skyline.",
      "An open paved plaza with a central feature anchors the middle of the image. Roads, crosswalks and paved walkways form a connected network that links every landmark and runs off all four edges; buildings sit along the outer edges and are cropped by the frame.",
      "Fill the gaps with trees, hedges, planters, benches and lit street lamps. Keep the plaza and paths relatively open and readable at phone size (390px wide) — round interactive markers will be layered on top, so nothing fussy should compete with them there.",
    ].join(" ")
  );

  sections.push(
    [
      "Style: painterly, semi-realistic illustrated game-map art, richly detailed with soft diffuse lighting and gentle shadows. Calm, moody night scene lit warmly from below by street lamps and glowing windows, light pooling softly on the pavement. Atmospheric and cosy, never neon, never flat vector cartoon, never harsh contrast.",
      "Palette — muted and desaturated: near-black #111111 and dark charcoal-blue #1B1F26 asphalt, slate-blue rooftops #2E3A4E, deep forest-green foliage #2F4A32, warm sandstone paving #C8A87C, warm amber lamplight #F0B860. Small accents only in muted red #B5473F and muted blue #4A6C9B (awnings, canopies). No neon, no saturated pinks, limes or cyans, no glow bloom.",
    ].join(" ")
  );

  sections.push(
    "Hard constraints: no text, no letters, no numbers, no signage lettering, no logos, no watermarks. No people, characters, mascots or vehicles. No UI elements, map pins, markers, frames, or borders. Background art only, edge to edge."
  );

  if (extra) {
    sections.push(`Additional art direction from the designer (follow it closely): ${extra}`);
  }

  return sections.join("\n\n");
}
