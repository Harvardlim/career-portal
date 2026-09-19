// Stores an Expert's local-ID digits (last 5 of NRIC / MyKad / KTP / CCCD ...)
// for identity verification. The digits are collected but never displayed back
// to anyone: they are AES-GCM encrypted here with a key that lives only in the
// function's secrets, and the database column holding the ciphertext is
// unreadable by the client roles.
//
//   POST { country_code: 'SG'|'MY'|'ID'|'TH'|'VN', id_type: string, last5: '12345' }
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

const ID_TYPES: Record<string, string> = {
  SG: 'NRIC / FIN',
  MY: 'MyKad',
  ID: 'KTP',
  TH: 'Thai ID',
  VN: 'CCCD',
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
  const last5 = typeof body.last5 === 'string' ? body.last5.trim().toUpperCase() : ''
  if (!ID_TYPES[country]) return json({ error: 'Experts must be based in Singapore, Malaysia, Indonesia, Thailand or Vietnam.' }, 400)
  if (!/^[A-Z0-9]{5}$/.test(last5)) return json({ error: 'Enter exactly the last 5 characters of your ID.' }, 400)

  try {
    const cipher = await encrypt(last5)
    const { data, error } = await admin
      .from('candidates')
      .update({
        country_code: country,
        id_type: typeof body.id_type === 'string' && body.id_type ? body.id_type : ID_TYPES[country],
        id_last5_cipher: cipher,
        id_last5_key_version: KEY_VERSION,
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
