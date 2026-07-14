import Link from "next/link";

export interface AdminDistrictItemData {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  background_image_url: string | null;
}

export interface AdminDistrictItemProps {
  district: AdminDistrictItemData;
  locationCount: number;
}

/** A district row in the list — links into the district's detail (its locations). */
export default function AdminDistrictItem({ district, locationCount }: AdminDistrictItemProps) {
  return (
    <li>
      <Link
        href={`/admin/districts/${district.id}`}
        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 transition-colors hover:border-white/30 hover:bg-white/5"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-h3 font-bold text-white">{district.name}</span>
            <span
              className={[
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                district.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
              ].join(" ")}
            >
              {district.is_published ? "Published" : "Draft"}
            </span>
          </span>
          <span className="text-small text-white/50">
            {locationCount} location{locationCount === 1 ? "" : "s"}
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
