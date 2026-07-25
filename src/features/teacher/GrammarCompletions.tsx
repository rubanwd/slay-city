export interface GrammarCompletionRow {
  studentId: string;
  username: string;
  passed: boolean;
}

export interface GrammarCompletionsProps {
  rows: GrammarCompletionRow[];
}

/**
 * Read-only roster showing which students in the group have passed this topic's
 * grammar (finished every rule card and the test). The sibling of
 * {@link VocabularyCompletions}. Presentational only — the page supplies the
 * joined data.
 */
export default function GrammarCompletions({ rows }: GrammarCompletionsProps) {
  if (rows.length === 0) return null;

  const passedCount = rows.filter((r) => r.passed).length;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-label text-white/50">
        Grammar Passed ({passedCount}/{rows.length})
      </h2>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.studentId}
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
