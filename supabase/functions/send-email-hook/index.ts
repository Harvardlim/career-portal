// Supabase Auth "Send Email" hook.
//
// Configure this in the Supabase Dashboard under Authentication > Hooks >
// "Send Email hook", pointing it at this deployed function. Once enabled,
// Supabase calls this function instead of its own email sender for every
// auth email -- signup confirmation, password recovery, magic link, etc --
// and we send it ourselves via Resend.
//
// Required secrets (set with `supabase secrets set NAME=value`):
//   RESEND_API_KEY        - from resend.com
//   SEND_EMAIL_HOOK_SECRET - the "Webhook secret" shown when you enable the
//                            hook in the dashboard. The dashboard displays it
//                            as `v1,whsec_...` -- that `v1,` is a version
//                            label, not part of the key, so it's stripped
//                            below regardless of whether it was pasted in.
//   SITE_URL               - e.g. https://yourapp.com, used for branding only
//
// Local dev: `supabase functions serve send-email-hook --no-verify-jwt`

import { Webhook } from 'npm:standardwebhooks@1.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const HOOK_SECRET = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace(/^v1,/, '')
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://trial.partly.asia'
// The GoTrue verify endpoint lives on the Supabase project, not the site.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const FROM_ADDRESS = Deno.env.get('RESEND_FROM') ?? 'Partly Asia <no-reply@partly.asia>'

type EmailActionType =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'magiclink'
  | 'email_change'
  | 'email_change_new'

type HookPayload = {
  user: { id: string; email: string }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: EmailActionType
    site_url: string
  }
}

const copyByAction: Record<EmailActionType, { subject: string; heading: string; cta: string }> = {
  signup: {
    subject: 'Confirm your Partly Asia account',
    heading: 'Confirm your email to activate your account',
    cta: 'Confirm email',
  },
  recovery: {
    subject: 'Reset your Partly Asia password',
    heading: 'Reset your password',
    cta: 'Reset password',
  },
  invite: {
    subject: "You've been invited to Partly Asia",
    heading: "You've been invited to join Partly Asia",
    cta: 'Accept invite',
  },
  magiclink: {
    subject: 'Your Partly Asia sign-in link',
    heading: 'Sign in to Partly Asia',
    cta: 'Sign in',
  },
  email_change: {
    subject: 'Confirm your new email address',
    heading: 'Confirm your new email address',
    cta: 'Confirm email change',
  },
  email_change_new: {
    subject: 'Confirm your new email address',
    heading: 'Confirm your new email address',
    cta: 'Confirm email change',
  },
}

function buildActionLink(data: HookPayload['email_data']) {
  // Clicking this hits GoTrue's verify endpoint (on the Supabase project),
  // which validates the token and 302-redirects the browser to `redirect_to`
  // -- the home page for signup, /reset-password for recovery.
  const authBase = SUPABASE_URL || data.site_url || SITE_URL
  const params = new URLSearchParams({
    token: data.token_hash,
    type: data.email_action_type,
    redirect_to: data.redirect_to || SITE_URL,
  })
  return `${authBase}/auth/v1/verify?${params.toString()}`
}

function renderHtml(heading: string, cta: string, link: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 20px; color: #0f172a;">${heading}</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Click the button below to continue. This link expires shortly, so use it soon.
      </p>
      <a href="${link}"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">
        ${cta}
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
}

Deno.serve(async (req) => {
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let event: HookPayload
  try {
    const wh = new Webhook(HOOK_SECRET)
    event = wh.verify(payload, headers) as HookPayload
  } catch {
    return new Response(
      JSON.stringify({ error: { message: 'Invalid webhook signature' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { user, email_data } = event
  const copy = copyByAction[email_data.email_action_type]
  if (!copy) {
    return new Response(JSON.stringify({ error: { message: 'Unsupported email action' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const link = buildActionLink(email_data)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [user.email],
      subject: copy.subject,
      html: renderHtml(copy.heading, copy.cta, link),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(
      JSON.stringify({ error: { message: `Resend failed: ${body}` } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
