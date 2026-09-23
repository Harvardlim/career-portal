// Time-based housekeeping for the matching flow. Run it on a schedule (every
// 15 minutes is plenty) -- it is idempotent, so overlapping runs are harmless.
//
//   * lead windows that ran out          -> 'cold' + "lead went cold" notice
//   * badges 30/14/7/1 days from expiry  -> renewal reminder (once per mark)
//   * badges past expiry                 -> 'expired', priority ranking removed
//   * contacts lapsing within 24 h       -> "expires tomorrow" notice to both sides
//   * verification documents reviewed
//     90+ days ago                       -> the file is deleted from storage;
//                                           only the decision record survives
//
// Protected by a shared secret rather than a user JWT, since the caller is a
// scheduler, not a person:
//   POST /partly-sweep   with header  x-sweep-key: $SWEEP_KEY
//
// Schedule with pg_cron + pg_net, e.g.
//   select cron.schedule('partly-sweep', '*/15 * * * *', $$
//     select net.http_post(
//       url := '<SUPABASE_URL>/functions/v1/partly-sweep',
//       headers := '{"x-sweep-key": "<SWEEP_KEY>"}'::jsonb
//     ) $$);

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { json } from '../_shared/cors.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RETENTION_DAYS = 90

// Deleting a Storage object needs the Storage API (service role), so this
// can't be a plain SQL function like the others in the loop below.
async function purgeExpiredDocuments(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()

  const { data: rows, error } = await admin
    .from('verification_documents')
    .select('id, doc_path')
    .in('status', ['approved', 'rejected'])
    .lte('reviewed_at', cutoff)
    .is('purged_at', null)
    .not('doc_path', 'is', null)
    .limit(200) // a bite per run; the next run picks up whatever's left

  if (error) {
    console.error('partly-sweep purge_documents (select)', error)
    return 0
  }
  if (!rows || rows.length === 0) return 0

  const paths = rows.map((r) => r.doc_path as string)
  const { error: removeError } = await admin.storage.from('verification-docs').remove(paths)
  if (removeError) {
    // If the bucket delete partially fails we still don't want to mark rows
    // purged that weren't actually removed -- bail and retry next run.
    console.error('partly-sweep purge_documents (storage remove)', removeError)
    return 0
  }

  const ids = rows.map((r) => r.id as string)
  const { error: updateError } = await admin
    .from('verification_documents')
    .update({ doc_path: null, purged_at: new Date().toISOString() })
    .in('id', ids)
  if (updateError) {
    console.error('partly-sweep purge_documents (mark purged)', updateError)
    return 0
  }

  return rows.length
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expected = Deno.env.get('SWEEP_KEY')
  if (!expected || req.headers.get('x-sweep-key') !== expected) {
    return json({ error: 'Forbidden' }, 403)
  }

  const results: Record<string, number | string> = {}
  for (const fn of ['expire_lead_windows', 'notify_contact_expiry', 'send_badge_renewal_reminders', 'expire_badges', 'expire_employer_badges']) {
    const { data, error } = await admin.rpc(fn)
    results[fn] = error ? `error: ${error.message}` : Number(data ?? 0)
    if (error) console.error('partly-sweep', fn, error)
  }

  try {
    results.purge_expired_documents = await purgeExpiredDocuments()
  } catch (err) {
    results.purge_expired_documents = `error: ${err instanceof Error ? err.message : String(err)}`
    console.error('partly-sweep purge_expired_documents', err)
  }

  return json({ ok: true, ...results })
})
