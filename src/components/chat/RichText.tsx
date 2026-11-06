import { Fragment } from "react";

/**
 * Model çıktısı için güvenli, minimal biçimlendirme: paragraflar, madde listeleri,
 * **kalın** ve *italik*. HTML yorumlanmaz (XSS riski yok).
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={i} className="my-2 list-disc space-y-1 pl-5 marker:text-gold-500">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="my-2 first:mt-0 last:mb-0">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l.replace(/^#{1,6}\s+/, ""))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function inline(s: string): React.ReactNode[] {
  const parts = s.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i} className="font-semibold text-gold-300">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
