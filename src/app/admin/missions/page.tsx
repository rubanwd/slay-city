import NavLink from "@/components/ui/NavLink";

import AdminHeader from "@/features/admin/AdminHeader";
import { publishMission, unpublishMission } from "@/features/admin/actions";
import { requireAdminPage } from "@/features/admin/guard";

/**
 * Lists every mission (admins see drafts too, via the
 * `missions_select_published_or_admin` RLS policy) with its published status and
 * a publish/unpublish control.
 */
export default async function AdminMissionsPage() {
  const { supabase } = await requireAdminPage();

  const { data: missions } = await supabase
    .from("missions")
    .select(
      "id, title, is_published, xp_reward, coin_reward, locations(id, name, district_id, districts(name))"
    )
    .order("created_at", { ascending: false });

  const rows = missions ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Missions" backHref="/admin" />

        <div className="mb-4 flex items-center justify-between">
          <p className="text-small text-white/50">
            {rows.length} mission{rows.length === 1 ? "" : "s"}
          </p>
          <NavLink
            href="/admin/missions/new"
            className="flex items-center gap-1.5 rounded-full border border-lime-green/50 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-lime-green transition-colors hover:bg-lime-green/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </NavLink>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-8 text-center text-small text-white/50">
            No missions yet. Create your first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body-strong text-white">{m.title}</span>
                    <StatusBadge published={m.is_published} />
                  </div>
                  <p className="truncate text-small text-white/50">
                    {m.locations ? (
                      <NavLink
                        href={`/admin/districts/${m.locations.district_id}/locations/${m.locations.id}`}
                        className="underline decoration-white/20 underline-offset-2 hover:text-white"
                      >
                        {m.locations.districts?.name ?? "—"} • {m.locations.name}
                      </NavLink>
                    ) : (
                      "—"
                    )}
                    <span className="text-white/30">
                      {" "}
                      · {m.xp_reward} XP · {m.coin_reward} coins
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <NavLink
                    href={`/admin/missions/${m.id}/tasks`}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10"
                  >
                    Tasks
                  </NavLink>
                  <form action={m.is_published ? unpublishMission : publishMission}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                        m.is_published
                          ? "border-white/20 text-white/60 hover:bg-white/10"
                          : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
                      ].join(" ")}
                    >
                      {m.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={[
        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
        published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
      ].join(" ")}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
