import { describe, expect, it } from "vitest";

import { createBrowserSupabaseClient } from "./index";

describe("supabase barrel exports", () => {
  it("exports a callable browser client factory", () => {
    expect(typeof createBrowserSupabaseClient).toBe("function");
  });
});
