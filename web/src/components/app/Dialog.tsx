import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircleIcon } from '@/components/icons'

/**
 * Centered modal used by the Apply Job and candidate-profile flows.
 * Closing navigates back to the page the dialog sits on top of.
 */
export function Dialog({
  children,
  closeTo,
  width = 'max-w-[600px]',
}: {
  children: ReactNode
  closeTo: string
  width?: string
}) {
  const navigate = useNavigate()
  const close = () => navigate(closeTo)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10">
      <div className={`relative w-full ${width} rounded-xl bg-surface shadow-2xl`}>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute -right-3 -top-3 grid size-9 place-items-center rounded-full bg-surface text-ink shadow-md"
        >
          <XCircleIcon className="size-5" />
        </button>
        {children}
      </div>
    </div>
  )
}
