// Time-based housekeeping for the matching flow. Run it on a schedule (every
// 15 minutes is plenty) -- it is idempotent, so overlapping runs are harmless.
//
//   * lead windows that ran out          -> 'cold' + "lead went cold" notice
//   * badges 30/14/7/1 days from expiry  -> renewal reminder (once per mark)
//   * badges past expiry                 -> 'expired', priority ranking removed
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expected = Deno.env.get('SWEEP_KEY')
  if (!expected || req.headers.get('x-sweep-key') !== expected) {
    return json({ error: 'Forbidden' }, 403)
  }

  const results: Record<string, number | string> = {}
  for (const fn of ['expire_lead_windows', 'send_badge_renewal_reminders', 'expire_badges']) {
    const { data, error } = await admin.rpc(fn)
    results[fn] = error ? `error: ${error.message}` : Number(data ?? 0)
    if (error) console.error('partly-sweep', fn, error)
  }

  return json({ ok: true, ...results })
})
