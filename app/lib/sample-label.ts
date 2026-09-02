import type { LibrarySample } from "~/lib/backend.server";

/** Keeps a stray quote or angle bracket in a coffee name out of the markup. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The label that goes on the bag. The tag is the largest thing on it and set in
 * a monospace face, because it gets read aloud across a room, copied into a
 * logbook, and typed into search off a stained label.
 *
 * Opened in its own window so the app's own layout and print rules stay out of
 * it, and so the sheet size is the label's rather than the page's.
 */
export function sampleLabelHtml(sample: LibrarySample, labels: Record<string, string>) {
  const rows = [
    [labels.roastedOn, sample.taggedOn],
    [labels.species, sample.species],
    [labels.country, sample.details.country],
    [labels.producer, sample.details.producerName],
  ].filter(([, value]) => Boolean(value));

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(sample.tag)}</title>
<style>
  @page { size: 62mm 40mm; margin: 3mm; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; }
  .label { width: 56mm; padding: 2mm 0; }
  .tag { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
         font-size: 20pt; font-weight: 700; letter-spacing: .5pt; line-height: 1.1; }
  .name { font-size: 11pt; font-weight: 600; margin-top: 1mm;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  dl { margin: 2mm 0 0; font-size: 7.5pt; line-height: 1.35; }
  .row { display: flex; gap: 2mm; }
  dt { color: #555; min-width: 16mm; margin: 0; }
  dd { margin: 0; font-weight: 600; }
  @media screen { body { padding: 12px; background: #f4f4f4; }
                  .label { background: #fff; padding: 6mm; box-shadow: 0 1px 4px rgba(0,0,0,.2); } }
</style></head>
<body onload="window.print()">
  <div class="label">
    <div class="tag">${escapeHtml(sample.tag)}</div>
    <div class="name">${escapeHtml(sample.name)}</div>
    <dl>
      ${rows
        .map(
          ([label, value]) =>
            `<div class="row"><dt>${escapeHtml(String(label))}</dt><dd>${escapeHtml(String(value))}</dd></div>`,
        )
        .join("\n      ")}
    </dl>
  </div>
</body></html>`;
}
