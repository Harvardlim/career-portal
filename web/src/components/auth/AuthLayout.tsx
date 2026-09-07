import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseIcon } from '@/components/icons'
import { AuthPanel } from '@/components/auth/AuthPanel'

function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className ?? ''}`}>
      <BriefcaseIcon className="size-10 text-brand" />
      <span className="text-2xl font-semibold text-ink">Partly Asia</span>
    </Link>
  )
}

type AuthLayoutProps = {
  variant?: 'split' | 'centered'
  children: ReactNode
}

export function AuthLayout({ variant = 'split', children }: AuthLayoutProps) {
  if (variant === 'centered') {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
        <div className="flex justify-center px-6 py-10">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[536px]">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[1fr_47%]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-0">
        <Logo className="lg:pl-[clamp(24px,7vw,120px)]" />
        <div className="flex flex-1 items-center py-12 lg:py-8">
          <div className="mx-auto w-full max-w-[536px] lg:mx-0 lg:pl-[clamp(24px,7vw,120px)]">
            {children}
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <AuthPanel />
      </div>
    </div>
  )
}
