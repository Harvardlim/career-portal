// Stores an Expert's local-ID digits (last 4 of NRIC/FIN / MyKad / KTP /
// Thai ID / CCCD / PhilSys) for the FREE basic identity check. Self-serve: this is the
// whole check -- it sets identity_verified immediately, with no admin wait,
// so a free account can apply to jobs right away. (The paid Verified badge is
// a separate, stricter step: it additionally requires an uploaded ID document
// that an admin reviews -- see verification_documents / admin_review_verification.)
//
// The digits are collected but never displayed back to anyone: they are
// AES-GCM encrypted here with a key that lives only in the function's
// secrets, and the database column holding the ciphertext is unreadable by
// the client roles.
//
//   POST { country_code: 'SG'|'MY'|'ID'|'TH'|'VN'|'PH', id_type: string, last4: '567D' }
//
// Required secrets:
//   EXPERT_ID_KEY                - 32 random bytes, base64 (openssl rand -base64 32)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - injected by the platform

import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import { corsHeaders, json } from '../_shared/cors.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const KEY_VERSION = 1

// Each country's ID format is different; the "last 4" is what a bank/KYC
// form usually asks for. Singapore's NRIC/FIN ends in a checksum LETTER, so
// its last 4 is 3 digits + that letter -- everyone else's is purely numeric.
const ID_FORMATS: Record<string, { label: string; pattern: RegExp; hint: string }> = {
  SG: { label: 'NRIC / FIN', pattern: /^[0-9]{3}[A-Z]$/, hint: '3 digits + the checksum letter, e.g. 567D' },
  MY: { label: 'MyKad', pattern: /^[0-9]{4}$/, hint: 'last 4 digits of the serial number, e.g. 1234' },
  ID: { label: 'KTP', pattern: /^[0-9]{4}$/, hint: 'last 4 digits of your 16-digit NIK' },
  TH: { label: 'Thai National ID', pattern: /^[0-9]{4}$/, hint: 'last 4 digits of your 13-digit ID' },
  VN: { label: 'CCCD', pattern: /^[0-9]{4}$/, hint: 'last 4 digits of your 12-digit CCCD' },
  PH: { label: 'PhilSys National ID', pattern: /^[0-9]{4}$/, hint: 'last 4 digits of your 12-digit PhilSys number (PSN)' },
}

async function importKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('EXPERT_ID_KEY')
  if (!raw) throw new Error('EXPERT_ID_KEY is not configured')
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  if (bytes.length !== 32) throw new Error('EXPERT_ID_KEY must be 32 bytes')
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt'])
}

async function encrypt(plain: string): Promise<string> {
  const key = await importKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)),
  )
  const out = new Uint8Array(iv.length + cipher.length)
  out.set(iv)
  out.set(cipher, iv.length)
  return btoa(String.fromCharCode(...out))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in' }, 401)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'Not signed in' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const country = typeof body.country_code === 'string' ? body.country_code.toUpperCase() : ''
  const last4 = typeof body.last4 === 'string' ? body.last4.trim().toUpperCase() : ''
  const format = ID_FORMATS[country]
  if (!format) return json({ error: 'Experts must be based in Singapore, Malaysia, Indonesia, Thailand, Vietnam or the Philippines.' }, 400)
  if (!format.pattern.test(last4)) {
    return json({ error: `That doesn't look like a ${format.label} — enter the ${format.hint}.` }, 400)
  }

  try {
    const cipher = await encrypt(last4)
    const { data, error } = await admin
      .from('candidates')
      .update({
        country_code: country,
        id_type: typeof body.id_type === 'string' && body.id_type ? body.id_type : format.label,
        id_last5_cipher: cipher,
        id_last5_key_version: KEY_VERSION,
        // Self-serve: submitting the digits IS the free basic check.
        identity_verified: true,
        identity_verified_at: new Date().toISOString(),
      })
      .eq('user_id', userData.user.id)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) return json({ error: 'No expert profile for this account' }, 400)
    return json({ ok: true })
  } catch (err) {
    console.error('expert-identity', err)
    return json({ error: err instanceof Error ? err.message : 'Could not save' }, 400)
  }
})
