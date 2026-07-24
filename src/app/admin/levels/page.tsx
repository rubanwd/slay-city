import NavLink from "@/components/ui/NavLink";
import AdminHeader from "@/features/admin/AdminHeader";
import { requireAdminPage } from "@/features/admin/guard";
import {
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_LEVEL_DESCRIPTIONS,
  KNOWLEDGE_LEVEL_LABELS,
} from "@/features/levels/levels";
import type { KnowledgeLevel } from "@/types";

/**
 * Top of the content hierarchy: Level → District → Location → Mission → Task.
 * Every level is always listed, even empty ones, because this is where an admin
 * goes to start filling one in. A level only becomes selectable for children
 * once it has a published district with a published location — the "Live for
 * kids" flag below mirrors that rule.
 */
export default async function AdminLevelsPage() {
  const { supabase } = await requireAdminPage();

  const [{ data: districts }, { data: locations }] = await Promise.all([
    supabase.from("districts").select("id, level, is_published"),
    supabase.from("locations").select("district_id, is_published"),
  ]);

  const publishedLocationsByDistrict = new Map<string, number>();
  for (const loc of locations ?? []) {
    if (!loc.is_published) continue;
    publishedLocationsByDistrict.set(
      loc.district_id,
      (publishedLocationsByDistrict.get(loc.district_id) ?? 0) + 1
    );
  }

  const districtCounts = new Map<KnowledgeLevel, number>();
  const liveLevels = new Set<KnowledgeLevel>();
  for (const district of districts ?? []) {
    districtCounts.set(district.level, (districtCounts.get(district.level) ?? 0) + 1);
    if (district.is_published && (publishedLocationsByDistrict.get(district.id) ?? 0) > 0) {
      liveLevels.add(district.level);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Levels" backHref="/admin" />

        <h2 className="mb-2 mt-2 text-label text-white/50">Levels ({KNOWLEDGE_LEVELS.length})</h2>

        <nav className="mb-6 flex flex-col gap-3">
          {KNOWLEDGE_LEVELS.map((level) => {
            const count = districtCounts.get(level) ?? 0;
            const live = liveLevels.has(level);
            return (
              <NavLink
                key={level}
                href={`/admin/levels/${level}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-h3 font-bold text-white">
                      {KNOWLEDGE_LEVEL_LABELS[level]}
                    </span>
                    <span
                      className={[
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                        live ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
                      ].join(" ")}
                    >
                      {live ? "Live for kids" : "Not live"}
                    </span>
                  </span>
                  <span className="truncate text-small text-white/50">
                    {KNOWLEDGE_LEVEL_DESCRIPTIONS[level]}
                  </span>
                  <span className="text-small text-white/50">
                    {count} district{count === 1 ? "" : "s"}
                  </span>
                </span>

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 text-white/40"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </NavLink>
            );
          })}
        </nav>

        <p className="text-center text-xs text-white/30">
          A level appears in the kids&apos; level picker once it has a published district with at
          least one published location.
        </p>
      </div>
    </main>
  );
}
