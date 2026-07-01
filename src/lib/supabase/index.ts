// Only the browser client is re-exported here so this barrel stays safe to
// import from Client Components. The server client depends on `next/headers`
// and must be imported directly from "@/lib/supabase/server" in Server
// Components, Route Handlers, or Server Actions.
export { createClient as createBrowserSupabaseClient } from "./client";
export type { Database } from "@/types/database";
