import DOMPurify from 'dompurify'

/**
 * Renders rich-text HTML produced by <RichTextEditor> (and the backoffice job
 * editor). Sanitised. Styling is applied with descendant selectors so it works
 * whether or not the editor's own class names survived.
 */
export function RichTextContent({ html }: { html: string | null | undefined }) {
  if (!html || !html.trim()) return null
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  return (
    <div
      className="
        text-base leading-7 text-muted-600
        [&_p]:mb-3 [&_p:last-child]:mb-0
        [&_a]:text-brand [&_a]:underline
        [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_u]:underline
        [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-ink
        [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink
        [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink
        [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1
        [&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted-600
        [&_code]:rounded [&_code]:bg-surface-alt [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]
        [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
        [&_th]:border [&_th]:border-line [&_th]:bg-surface-alt [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium
        [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2
      "
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
