// Freezes or reinstates a Business or Expert account from the backoffice.
// This is the only place that can actually block sign-in: it bans the account
// at the Supabase Auth level (via the Admin API, which needs the service
// role -- plain SQL can't do this) and flips public.candidates/employers
// .suspended via admin_set_candidate_suspended / admin_set_employer_suspended,
// which also cascades to that business's postings when suspending an employer.
//
// Body: { kind: 'candidate' | 'employer', id: uuid, suspended: boolean,
//         reason?: string, admin_id: uuid }
//
// Auth note: the backoffice has no Supabase session of its own (it runs its
// own bcrypt-backed admin table, see 20260906150000_admin.sql), so -- like
// every other admin_* RPC the backoffice calls -- this is reached with only
// the anon key and trusts the caller. Same accepted gap as the rest of the
// backoffice until it moves behind real auth; verify_jwt is off in config.toml.
//
// Required secrets: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (injected)
// Local dev: supabase functions serve admin-suspend-account --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Supabase's ban_duration has no "forever" literal; a very long duration is
// the standard stand-in. 'none' lifts a ban immediately.
const PERMANENT_BAN = '876000h' // ~100 years

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const kind = body.kind === 'candidate' || body.kind === 'employer' ? body.kind : null
  const id = typeof body.id === 'string' ? body.id : ''
  const suspended = body.suspended === true
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null
  const adminId = typeof body.admin_id === 'string' ? body.admin_id : null

  if (!kind || !id || !adminId) {
    return json({ error: 'Missing kind, id or admin_id' }, 400)
  }

  try {
    const { data: userId, error: rpcError } = await admin.rpc(
      kind === 'candidate' ? 'admin_set_candidate_suspended' : 'admin_set_employer_suspended',
      kind === 'candidate'
        ? { p_candidate_id: id, p_suspended: suspended, p_reason: reason, p_admin_id: adminId }
        : { p_employer_id: id, p_suspended: suspended, p_reason: reason, p_admin_id: adminId },
    )
    if (rpcError) throw rpcError
    if (!userId) return json({ error: `${kind === 'candidate' ? 'Expert' : 'Business'} not found` }, 404)

    // No auth account yet (e.g. a row inserted before the user confirmed
    // email) -- the DB flag is enough on its own until one exists.
    const { error: banError } = await admin.auth.admin.updateUserById(userId as string, {
      ban_duration: suspended ? PERMANENT_BAN : 'none',
    })
    if (banError) throw banError

    return json({ ok: true })
  } catch (err) {
    console.error('admin-suspend-account', err)
    return json({ error: err instanceof Error ? err.message : 'Could not update suspension' }, 400)
  }
})
