import { describe, expect, it } from "vitest";

import { imageProviderRouting } from "./openRouterImage";

describe("imageProviderRouting", () => {
  it("pins the request to the configured endpoint, keeping fallbacks on", () => {
    // The flex tier is a best-effort queue at half the standard rate; falling
    // back beats failing an admin's form when it is unavailable.
    expect(imageProviderRouting("google-ai-studio/flex")).toEqual({
      order: ["google-ai-studio/flex"],
      allow_fallbacks: true,
    });
  });

  it("sends no routing block when the tier is switched off", () => {
    // `OPENROUTER_IMAGE_PROVIDER=""` is the documented escape hatch back to
    // OpenRouter's own routing — it must not send an empty `order`.
    expect(imageProviderRouting("")).toBeUndefined();
    expect(imageProviderRouting("   ")).toBeUndefined();
  });
});
