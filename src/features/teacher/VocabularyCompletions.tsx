export interface VocabularyCompletionRow {
  childId: string;
  username: string;
  passed: boolean;
}

export interface VocabularyCompletionsProps {
  rows: VocabularyCompletionRow[];
}

/**
 * Read-only roster showing which children in the group have passed this topic's
 * vocabulary (finished every word card and the test). Rendered on the teacher's
 * topic page so they can see progress at a glance. Presentational only — the
 * page supplies the joined data.
 */
export default function VocabularyCompletions({ rows }: VocabularyCompletionsProps) {
  if (rows.length === 0) return null;

  const passedCount = rows.filter((r) => r.passed).length;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-label text-white/50">
        Vocabulary Passed ({passedCount}/{rows.length})
      </h2>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.childId}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2"
          >
            <span className="truncate text-small text-white">{row.username}</span>
            <span
              className={[
                "shrink-0 text-xs font-bold uppercase tracking-wide",
                row.passed ? "text-lime-green" : "text-white/40",
              ].join(" ")}
            >
              {row.passed ? "Passed ✓" : "Not yet"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
