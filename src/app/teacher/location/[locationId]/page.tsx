import { notFound } from "next/navigation";

import { BottomNav, BOTTOM_NAV_CLEARANCE, ScrollScreen } from "@/components/layout";
import NavLink from "@/components/ui/NavLink";
import { requireTeacherPage } from "@/features/teacher/guard";

interface TeacherLocationPageProps {
  params: Promise<{ locationId: string }>;
}

/**
 * Every mission at one location, for a teacher to walk through.
 *
 * This is the step the student map doesn't need: a student is always handed the
 * next mission in order, while a teacher checking the content wants to open any
 * of them. Missions run in review mode (`/teacher/mission/[missionId]`) — no
 * progress, no rewards — so nothing here reports whether anything is "done".
 */
export default async function TeacherLocationPage({ params }: TeacherLocationPageProps) {
  const { locationId } = await params;
  const { supabase } = await requireTeacherPage();

  const [locationRes, missionsRes] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, description, districts(name)")
      .eq("id", locationId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("missions")
      .select("id, title, description, order_index")
      .eq("location_id", locationId)
      .eq("is_published", true)
      .order("order_index"),
  ]);

  const location = locationRes.data;
  if (!location) {
    notFound();
  }

  const missions = missionsRes.data ?? [];
  // The FK relationship comes back as a single related row (or null).
  const district = location.districts as { name: string } | null;

  return (
    <ScrollScreen footer={<BottomNav role="teacher" />}>
      <div className={`mx-auto flex w-full max-w-md flex-col px-5 ${BOTTOM_NAV_CLEARANCE}`}>
        <header className="flex items-start justify-between gap-3 py-5">
          <div className="min-w-0">
            {district && (
              <p className="truncate text-label uppercase tracking-widest text-white/40">
                {district.name}
              </p>
            )}
            <h1 className="text-h2 font-black text-white">{location.name}</h1>
            {location.description && (
              <p className="text-small text-white/50">{location.description}</p>
            )}
          </div>
          <NavLink
            href="/teacher/map"
            className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
          >
            Map
          </NavLink>
        </header>

        {missions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No published missions at this location yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {missions.map((mission, index) => (
              <li key={mission.id}>
                <NavLink
                  href={`/teacher/mission/${mission.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3 transition-colors hover:border-lime-green/40"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-green/15 text-sm font-black text-lime-green">
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-strong text-white">{mission.title}</span>
                    {mission.description && (
                      <span className="truncate text-small text-white/50">
                        {mission.description}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0 text-xs font-black uppercase tracking-wide text-lime-green">
                    ▶ Play
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollScreen>
  );
}
