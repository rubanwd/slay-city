import type { ReactNode } from "react";

/**
 * Renders an {@link InstallMessages} body string: splits it on the single
 * `{{icon}}` marker to place the Share glyph, and turns `**text**` spans into
 * bold `<span>`s so the words that name an on-screen button stand out.
 */
export function renderInstallTemplate(template: string, icon: ReactNode): ReactNode {
  const [before, after = ""] = template.split("{{icon}}");
  return (
    <>
      {renderBoldSpans(before, "before")}
      {icon}
      {renderBoldSpans(after, "after")}
    </>
  );
}

function renderBoldSpans(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((chunk, index) =>
    index % 2 === 1 ? (
      <span key={`${keyPrefix}-${index}`} className="font-semibold text-white">
        {chunk}
      </span>
    ) : (
      chunk
    )
  );
}
