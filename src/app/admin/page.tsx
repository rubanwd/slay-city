import Link from "next/link";

import AdminHeader from "@/features/admin/AdminHeader";
import { requireAdminPage } from "@/features/admin/guard";

/**
 * Admin content manager landing at `/admin`. Admin-only (enforced by middleware
 * and {@link requireAdminPage}). Links out to the mission and taxonomy tools.
 */
export default async function AdminPage() {
  const { supabase } = await requireAdminPage();

  const [missionsRes, districtsRes, locationsRes] = await Promise.all([
    supabase.from("missions").select("id", { count: "exact", head: true }),
    supabase.from("districts").select("id", { count: "exact", head: true }),
    supabase.from("locations").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      href: "/admin/missions",
      title: "Missions",
      count: missionsRes.count ?? 0,
      description: "Create, publish, and manage missions.",
      accent: "text-lime-green",
    },
    {
      href: "/admin/districts/new",
      title: "Districts & Locations",
      count: (districtsRes.count ?? 0) + (locationsRes.count ?? 0),
      description: "Add districts and the locations inside them.",
      accent: "text-cyan",
    },
    {
      href: "/admin/admins",
      title: "Manage Admins",
      count: null,
      description: "Add or remove admin access by email.",
      accent: "text-purple",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Content Manager" />

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="Districts" value={districtsRes.count ?? 0} />
          <Stat label="Locations" value={locationsRes.count ?? 0} />
          <Stat label="Missions" value={missionsRes.count ?? 0} />
        </div>

        <nav className="flex flex-col gap-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 transition-colors hover:border-white/30 hover:bg-white/5"
            >
              <span className="flex flex-col">
                <span className={`text-h3 font-bold ${card.accent}`}>{card.title}</span>
                <span className="text-small text-white/50">{card.description}</span>
              </span>
              <span className="flex items-center gap-2 text-white/40">
                {card.count !== null && <span className="text-body-strong">{card.count}</span>}
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
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#1a1a1a] p-3">
      <span className="text-2xl font-black leading-none text-white">{value}</span>
      <span className="text-label text-white/50">{label}</span>
    </div>
  );
}
