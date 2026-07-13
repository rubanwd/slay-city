import Link from "next/link";

export interface AdminLocationItemData {
  id: string;
  district_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  map_x: number | null;
  map_y: number | null;
}

export interface AdminLocationItemProps {
  location: AdminLocationItemData;
  missionCount: number;
}

/** A location row in a district's detail — links into the location's detail (its missions). */
export default function AdminLocationItem({ location, missionCount }: AdminLocationItemProps) {
  return (
    <li>
      <Link
        href={`/admin/districts/${location.district_id}/locations/${location.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/30 hover:bg-white/10"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-body-strong text-white">{location.name}</span>
            <span
              className={[
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                location.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
              ].join(" ")}
            >
              {location.is_published ? "Published" : "Draft"}
            </span>
          </span>
          <span className="text-small text-white/50">
            {missionCount} mission{missionCount === 1 ? "" : "s"}
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
      </Link>
    </li>
  );
}
