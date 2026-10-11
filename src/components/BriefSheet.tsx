import type { Brief } from '../lib/brief/generate'

export function BriefSheet({ brief: b }: { brief: Brief }) {
  return (
    <article lang={b.lang} className="brief-sheet rounded-lg border border-divider bg-white p-5 sm:p-8">
      <h2 className="text-2xl font-bold leading-8">{b.title}</h2>
      <p className="mt-1 text-sm font-semibold">{b.forLine}</p>
      <p className="text-sm text-ink-2">{b.dateLine}</p>
      <p className="mt-1 text-xs text-ink-3">{b.draftLine}</p>
      {b.sections.map((s) => (
        <section key={s.id} className="mt-5">
          <h3 className="label-caps !text-black">{s.heading}</h3>
          {s.paragraphs.map((p) => <p key={p} className="mt-2 text-sm leading-6">{p}</p>)}
          {s.bullets.length > 0 && <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{s.bullets.map((x) => <li key={x}>{x}</li>)}</ul>}
        </section>
      ))}
      <p className="mt-6 border-t border-divider pt-4 text-sm font-medium">{b.closing}</p>
    </article>
  )
}
