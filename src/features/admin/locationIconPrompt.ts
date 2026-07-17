export interface LocationIconPromptInput {
  /** District the location belongs to — anchors the icon in its scene. */
  districtName: string;
  locationName: string;
  locationDescription?: string | null;
  /** Free-form extra requirements typed by the admin. */
  extraInstructions?: string | null;
}

/** Collapses whitespace and trims — model input should not carry form artefacts. */
function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Builds the OpenRouter prompt for a location's round map icon. Deliberately
 * compact — a single centred subject needs far less art direction than a full
 * map scene, and a short prompt keeps generation cheap. The palette lines
 * mirror `buildMapBackgroundPrompt` so icons sit naturally on the district art.
 */
export function buildLocationIconPrompt(input: LocationIconPromptInput): string {
  const district = clean(input.districtName) || "Central";
  const name = clean(input.locationName) || "Unnamed Location";
  const description = clean(input.locationDescription);
  const extra = clean(input.extraInstructions);

  const lines = [
    `Square game icon of "${name}", a landmark in the ${district} district of SLAY CITY, a cosy illustrated city map for a kids' English-learning game.`,
    description ? `It is: ${description}.` : "",
    "One charming building or object that instantly reads as this place, centred, filling most of the frame, gentle 3/4 top-down view, on a plain dark backdrop.",
    "Style: painterly illustrated game art, warm amber night lighting, muted palette (charcoal-blue #1B1F26, sandstone #C8A87C, forest green #2F4A32, amber #F0B860). Not flat vector, no neon.",
    "No text, letters, people, mascots, borders or UI. The icon is shown cropped in a circle, so keep the subject well inside the frame.",
    extra ? `Extra art direction: ${extra}.` : "",
  ];

  return lines.filter(Boolean).join("\n");
}
