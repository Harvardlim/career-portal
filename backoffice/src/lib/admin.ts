import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

export const adminAuthEnabled = isSupabaseConfigured

export type AdminSession = { id: string; name: string; email: string }
export type AdminRow = AdminSession & { created_at: string }

const STORAGE_KEY = 'bo_admin_session'

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/* ---------- session (localStorage) ---------- */

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSession
    if (parsed && parsed.id && parsed.email) return parsed
    return null
  } catch {
    return null
  }
}

function setAdminSession(session: AdminSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('bo-admin-session'))
}

export function signOut() {
  setAdminSession(null)
}

/** Subscribes to session changes (login / logout in this tab). */
export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession())
  useEffect(() => {
    const sync = () => setSession(getAdminSession())
    window.addEventListener('bo-admin-session', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('bo-admin-session', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return session
}

/* ---------- RPCs ---------- */

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  const { data, error } = await client().rpc('admin_login', {
    p_email: email,
    p_password: password,
  })
  if (error) throw error
  const row = (data as AdminSession[] | null)?.[0]
  if (!row) throw new Error('Incorrect email or password')
  setAdminSession(row)
  return row
}

export async function adminList(): Promise<AdminRow[]> {
  const { data, error } = await client().rpc('admin_list')
  if (error) throw error
  return (data ?? []) as AdminRow[]
}

export async function adminCreate(
  name: string,
  email: string,
  password: string,
): Promise<AdminRow> {
  const { data, error } = await client().rpc('admin_create', {
    p_name: name,
    p_email: email,
    p_password: password,
  })
  if (error) throw error
  const row = (data as AdminRow[] | null)?.[0]
  if (!row) throw new Error('Could not create admin')
  return row
}

export async function adminDelete(id: string): Promise<void> {
  const { error } = await client().rpc('admin_delete', { p_id: id })
  if (error) throw error
}

export async function adminChangePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { error } = await client().rpc('admin_change_password', {
    p_email: email,
    p_current: currentPassword,
    p_new: newPassword,
  })
  if (error) throw error
}
