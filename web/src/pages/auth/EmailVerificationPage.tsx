import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'

export function EmailVerificationPage() {
  return (
    <AuthLayout variant="centered">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-9"
      >
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Email Verification
          </h1>
          <p className="text-base leading-6 text-muted">
            We&rsquo;ve sent an verification to{' '}
            <span className="text-ink">emailaddress@gmail.com</span> to verify
            your email address and activate your account.
          </p>
        </div>

        <AuthField label="Verification Code" name="code" size="lg" />

        <AuthSubmit>Verify my Account</AuthSubmit>

        <p className="text-base text-ink-600">
          Didn&rsquo;t recieve any code!{' '}
          <button type="button" className="font-medium text-brand">
            Resends
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
