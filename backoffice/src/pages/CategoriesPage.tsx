import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button, Card } from '../components/ui'
import { IconLayers, IconTag, IconTrash } from '../components/Icons'
import {
  categoriesEnabled,
  createCategory,
  createSubcategories,
  deleteCategory,
  deleteSubcategory,
  fetchCategories,
  type Category,
} from '../lib/categories'

const Plus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const AddForm = ({
  placeholder,
  label,
  hint,
  busy,
  onAdd,
}: {
  placeholder: string
  label: string
  hint?: string
  busy: boolean
  onAdd: (value: string) => void
}) => {
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || busy) return
    onAdd(trimmed)
    setValue('')
  }
  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted focus:border-brand-2 focus:outline-none"
        />
        <Button type="submit" className="shrink-0 px-3 py-2.5" disabled={busy}>
          <Plus />
          {label}
        </Button>
      </div>
      {hint ? <p className="mt-1.5 text-[11px] text-muted">{hint}</p> : null}
    </form>
  )
}

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(categoriesEnabled)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!categoriesEnabled) return
    let alive = true
    fetchCategories()
      .then((rows) => {
        if (!alive) return
        setCategories(rows)
        setSelectedId((current) => current ?? rows[0]?.id ?? null)
      })
      .catch((e: unknown) => alive && setError(errMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? null,
    [categories, selectedId],
  )

  const run = async (task: () => Promise<void>) => {
    setPending(true)
    setError(null)
    try {
      await task()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setPending(false)
    }
  }

  const addCategory = (name: string) =>
    run(async () => {
      const created = await createCategory(name)
      setCategories((prev) => [...prev, created])
      setSelectedId(created.id)
    })

  const removeCategory = (id: string) =>
    run(async () => {
      await deleteCategory(id)
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id)
        setSelectedId((current) => (current === id ? next[0]?.id ?? null : current))
        return next
      })
    })

  const addSubcategories = (raw: string) => {
    if (!selected) return
    const categoryId = selected.id
    const names = raw.split(/[,\n]/).map((n) => n.trim()).filter(Boolean)
    if (names.length === 0) return
    return run(async () => {
      const created = await createSubcategories(categoryId, names)
      if (created.length === 0) return
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: [...c.subcategories, ...created] }
            : c,
        ),
      )
    })
  }

  const removeSubcategory = (subId: string) => {
    if (!selected) return
    const categoryId = selected.id
    return run(async () => {
      await deleteSubcategory(subId)
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
            : c,
        ),
      )
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-ink">Categories</h1>
        <p className="mt-1 text-[13px] text-muted">
          Create categories and organise them into subcategories.
        </p>
      </div>

      {!categoriesEnabled ? (
        <Card className="p-6 text-[13px] text-ink-200">
          <p className="font-semibold text-ink">Connect Supabase to manage categories</p>
          <p className="mt-1 text-muted">
            Set <code className="text-ink-200">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-ink-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
            <code className="text-ink-200">backoffice/.env</code>, then run the{' '}
            <code className="text-ink-200">supabase/migrations/20260903120000_categories.sql</code>{' '}
            migration.
          </p>
        </Card>
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Categories column */}
            <Card className="flex flex-col">
              <div className="flex items-center gap-2 px-5 py-4">
                <span className="grid size-8 place-items-center rounded-full bg-brand/15 text-brand">
                  <IconTag width={16} height={16} />
                </span>
                <h2 className="text-[15px] font-semibold text-ink">All categories</h2>
                <span className="ml-auto text-[12px] text-muted">{categories.length}</span>
              </div>

              <div className="border-t border-line px-5 py-4">
                <AddForm
                  label="Add"
                  placeholder="New category name"
                  busy={pending}
                  onAdd={addCategory}
                />
              </div>

              <div className="scroll-slim max-h-[420px] overflow-y-auto border-t border-line">
                {loading ? (
                  <p className="px-5 py-6 text-[13px] text-muted">Loading…</p>
                ) : categories.length === 0 ? (
                  <p className="px-5 py-6 text-[13px] text-muted">No categories yet.</p>
                ) : (
                  <ul>
                    {categories.map((c) => {
                      const active = c.id === selectedId
                      return (
                        <li key={c.id}>
                          <div
                            className={`flex items-center gap-2 border-b border-line/60 px-5 py-3 ${
                              active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedId(c.id)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${
                                  active ? 'bg-brand' : 'bg-muted'
                                }`}
                              />
                              <span
                                className={`truncate text-[13px] ${
                                  active ? 'font-semibold text-ink' : 'text-ink-200'
                                }`}
                              >
                                {c.name}
                              </span>
                              <span className="ml-1 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-muted">
                                {c.subcategories.length}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${c.name}`}
                              disabled={pending}
                              onClick={() => removeCategory(c.id)}
                              className="shrink-0 text-muted hover:text-danger disabled:opacity-40"
                            >
                              <IconTrash width={15} height={15} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </Card>

            {/* Subcategories column */}
            <Card className="flex flex-col">
              <div className="flex items-center gap-2 px-5 py-4">
                <span className="grid size-8 place-items-center rounded-full bg-cyan/15 text-cyan">
                  <IconLayers width={16} height={16} />
                </span>
                <h2 className="text-[15px] font-semibold text-ink">
                  {selected ? `${selected.name} · subcategories` : 'Subcategories'}
                </h2>
                {selected ? (
                  <span className="ml-auto text-[12px] text-muted">
                    {selected.subcategories.length}
                  </span>
                ) : null}
              </div>

              {selected ? (
                <>
                  <div className="border-t border-line px-5 py-4">
                    <AddForm
                      label="Add"
                      placeholder="e.g. Logo Design, Brand Identity, Packaging"
                      hint="Add several at once — separate names with commas."
                      busy={pending}
                      onAdd={(raw) => addSubcategories(raw)}
                    />
                  </div>
                  <div className="border-t border-line p-5">
                    {selected.subcategories.length === 0 ? (
                      <p className="text-[13px] text-muted">No subcategories yet.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {selected.subcategories.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 py-1.5 pl-3 pr-2 text-[13px] text-ink-200"
                          >
                            {s.name}
                            <button
                              type="button"
                              aria-label={`Delete ${s.name}`}
                              disabled={pending}
                              onClick={() => removeSubcategory(s.id)}
                              className="text-muted hover:text-danger disabled:opacity-40"
                            >
                              <IconTrash width={13} height={13} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <p className="border-t border-line px-5 py-6 text-[13px] text-muted">
                  {loading ? 'Loading…' : 'Select a category to manage its subcategories.'}
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message)
  return 'Something went wrong'
}
