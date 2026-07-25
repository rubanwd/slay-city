import { describe, expect, it } from "vitest";

import { isProtectedMedia, type MediaGuardTarget } from "./mediaGuard";

/** Builds a nesting chain, outermost tag first, and returns the innermost node. */
function chain(...tags: string[]): MediaGuardTarget {
  return tags.reduce<MediaGuardTarget | null>(
    (parentElement, tagName) => ({ tagName, parentElement }),
    null
  ) as MediaGuardTarget;
}

describe("isProtectedMedia", () => {
  it("claims the artwork tags themselves", () => {
    for (const tag of ["IMG", "PICTURE", "SVG", "VIDEO", "CANVAS"]) {
      expect(isProtectedMedia({ tagName: tag })).toBe(true);
    }
  });

  it("matches case-insensitively, as inline SVG reports its tags", () => {
    expect(isProtectedMedia({ tagName: "svg" })).toBe(true);
  });

  it("claims a long press that landed on a shape inside an inline SVG", () => {
    expect(isProtectedMedia(chain("SVG", "G", "path"))).toBe(true);
  });

  it("leaves text fields alone so long-press Copy/Paste still works", () => {
    expect(isProtectedMedia(chain("FORM", "LABEL", "INPUT"))).toBe(false);
    expect(isProtectedMedia(chain("DIV", "P", "TEXTAREA"))).toBe(false);
  });

  it("does not claim a whole subtree just because something above is artwork", () => {
    expect(isProtectedMedia(chain("PICTURE", "DIV", "DIV", "DIV", "SPAN"))).toBe(false);
  });

  it("handles a missing target", () => {
    expect(isProtectedMedia(null)).toBe(false);
    expect(isProtectedMedia(undefined)).toBe(false);
    expect(isProtectedMedia({})).toBe(false);
  });
});
