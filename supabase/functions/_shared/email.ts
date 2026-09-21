// Shared Resend sender for the partly.asia transactional emails
// (new applicant, business interested, job closed). Failure is always
// non-fatal to the caller -- the underlying DB write already happened, so a
// dropped email should never surface as a user-facing error.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS = Deno.env.get('RESEND_FROM') ?? 'partly.asia <no-reply@partly.asia>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://trial.partly.asia'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emailShell(title: string, bodyHtml: string, ctaHref?: string, ctaLabel?: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 20px; color: #1b2a4a;">${escapeHtml(title)}</h1>
      <div style="font-size: 14px; color: #475569; line-height: 1.6;">${bodyHtml}</div>
      ${
        ctaHref && ctaLabel
          ? `<a href="${ctaHref}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #d4a12a; color: #1b2a4a; text-decoration: none; border-radius: 6px; font-weight: 700;">${escapeHtml(ctaLabel)}</a>`
          : ''
      }
      <hr style="margin-top: 28px; border: none; border-top: 1px solid #e2e8f0;" />
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
        <a href="${SITE_URL}" style="color: #d4a12a; text-decoration: none;">partly.asia</a> — keep every conversation on-platform until contact is unlocked.
      </p>
    </div>
  `
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    })
    if (!res.ok) console.error('sendEmail resend error', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('sendEmail threw', err)
    return false
  }
}

export { SITE_URL }
