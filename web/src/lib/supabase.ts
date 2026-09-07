import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env vars')
}

/**
 * "Remember me" support. The flag itself lives in localStorage (so the choice
 * survives a reload); the auth session is then kept in localStorage when
 * remembered, or sessionStorage when not (cleared once the browser closes).
 */
const REMEMBER_KEY = 'sb-remember'

function pickStorage(): Storage {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '0' ? sessionStorage : localStorage
  } catch {
    return localStorage
  }
}

const switchingStorage = {
  getItem: (key: string) => {
    try {
      return pickStorage().getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      pickStorage().setItem(key, value)
    } catch {
      /* storage unavailable */
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: switchingStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** Call before signing in: true = keep me signed in across sessions. */
export function setRememberMe(remember: boolean) {
  try {
    if (remember) localStorage.removeItem(REMEMBER_KEY)
    else localStorage.setItem(REMEMBER_KEY, '0')
  } catch {
    /* storage unavailable */
  }
}

const REMEMBER_EMAIL_KEY = 'sb-remember-email'

/** Remembered sign-in email — stored only when "Remember Me" is checked. */
export function getRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setRememberedEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBER_EMAIL_KEY, email)
    else localStorage.removeItem(REMEMBER_EMAIL_KEY)
  } catch {
    /* storage unavailable */
  }
}
