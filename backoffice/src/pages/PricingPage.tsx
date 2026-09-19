import { useEffect, useState } from 'react'
import { Button, Card, controlClass } from '../components/ui'
import { fetchPricing, partlyEnabled, updatePricing, type PricingRow } from '../lib/partly'

const errMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

const FIELDS: { key: keyof PricingRow; label: string; group: string }[] = [
  { key: 'lead_fee_local', label: 'Lead fee (local)', group: 'Released-lead fee' },
  { key: 'lead_fee_usd', label: 'Lead fee (USD)', group: 'Released-lead fee' },
  { key: 'badge_fee_local', label: 'Badge / yr (local)', group: 'Verified badge' },
  { key: 'badge_fee_usd', label: 'Badge / yr (USD)', group: 'Verified badge' },
  { key: 'affiliate_lead_local', label: 'Lead commission (local)', group: 'Affiliate' },
  { key: 'affiliate_lead_usd', label: 'Lead commission (USD)', group: 'Affiliate' },
  { key: 'affiliate_badge_local', label: 'Badge commission (local)', group: 'Affiliate' },
  { key: 'affiliate_badge_usd', label: 'Badge commission (USD)', group: 'Affiliate' },
]

/**
 * Per-country price catalog. Values are fixed per market and charged exactly
 * as entered; affiliate commissions are stored, not derived, so changing a fee
 * never silently moves what affiliates earn.
 */
export const PricingPage = () => {
  const [rows, setRows] = useState<PricingRow[]>([])
  const [draft, setDraft] = useState<Record<string, Partial<PricingRow>>>({})
  const [loading, setLoading] = useState(partlyEnabled)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await fetchPricing())
      setDraft({})
      setError(null)
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (partlyEnabled) void load()
  }, [])

  function edit(code: string, key: keyof PricingRow, value: string | boolean) {
    setDraft((d) => ({
      ...d,
      [code]: { ...d[code], [key]: typeof value === 'boolean' ? value : value === '' ? 0 : Number(value) },
    }))
  }

  async function save(code: string) {
    const patch = draft[code]
    if (!patch) return
    setSaving(code)
    try {
      await updatePricing(code, patch)
      await load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setSaving(null)
    }
  }

  const val = (r: PricingRow, key: keyof PricingRow) => (draft[r.code]?.[key] ?? r[key]) as number | boolean

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Pricing by country</h1>
        <p className="text-[13px] text-muted">
          Fixed local prices — not live-converted. The USD figure is the forex-absorbed alternative offered at checkout.
          Affiliate commissions are frozen on each event when it fires.
        </p>
      </div>

      {!partlyEnabled && <Card className="p-6 text-[13px] text-muted">Connect Supabase to edit pricing.</Card>}
      {error && <Card className="border-danger/40 p-4 text-[13px] text-danger">{error}</Card>}
      {loading && <Card className="p-6 text-[13px] text-muted">Loading…</Card>}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((r) => {
          const dirty = !!draft[r.code]
          return (
            <Card key={r.code} className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-ink">
                    {r.name} <span className="text-muted">· {r.currency}</span>
                  </p>
                  <p className="text-[12px] text-muted">
                    Updated {new Date(r.updated_at).toLocaleDateString()}
                    {r.zero_decimal ? ' · zero-decimal currency' : ''}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink-200">
                  <input
                    type="checkbox"
                    checked={val(r, 'active') as boolean}
                    onChange={(e) => edit(r.code, 'active', e.target.checked)}
                  />
                  Active
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">{f.label}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={String(val(r, f.key))}
                      onChange={(e) => edit(r.code, f.key, e.target.value)}
                      className={controlClass}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                {dirty && (
                  <Button variant="ghost" onClick={() => setDraft((d) => ({ ...d, [r.code]: undefined as never }))}>
                    Discard
                  </Button>
                )}
                <Button disabled={!dirty || saving === r.code} onClick={() => save(r.code)}>
                  {saving === r.code ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
