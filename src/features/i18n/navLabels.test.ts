import { describe, expect, it } from "vitest";

import { LOCALES } from "./locales";
import { studentNavLabels } from "./navLabels";

describe("studentNavLabels", () => {
  it("labels every student tab in every language", () => {
    for (const locale of LOCALES) {
      const labels = studentNavLabels(locale);
      expect(Object.keys(labels).sort()).toEqual(["homework", "map", "profile", "wardrobe"]);
      for (const label of Object.values(labels)) {
        expect(label?.trim()).toBeTruthy();
      }
    }
  });

  it("actually translates rather than falling through to English", () => {
    expect(studentNavLabels("en").map).toBe("Map");
    expect(studentNavLabels("uk").map).toBe("Карта");
    expect(studentNavLabels("ru").wardrobe).toBe("Гардероб");
  });

  it("keeps the bar readable — no label long enough to wrap a tab", () => {
    for (const locale of LOCALES) {
      for (const label of Object.values(studentNavLabels(locale))) {
        expect(label!.length).toBeLessThanOrEqual(12);
      }
    }
  });
});
