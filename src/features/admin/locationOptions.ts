/** A location the admin can attach a mission to, in a `<select>`. */
export interface LocationOption {
  id: string;
  /** Display label, e.g. "Downtown District • Central Café". */
  label: string;
}

interface LocationRow {
  id: string;
  name: string;
  districts: { name: string } | null;
}

/** Builds the district-prefixed labels the mission forms show in their picker. */
export function toLocationOptions(rows: LocationRow[] | null): LocationOption[] {
  return (rows ?? []).map((loc) => ({
    id: loc.id,
    label: `${loc.districts?.name ?? "—"} • ${loc.name}`,
  }));
}
