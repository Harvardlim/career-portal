import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BookmarkIcon } from '@/components/icons'
import { useSavedJobs } from '@/lib/useSavedJobs'

export function SaveJobButton({
  jobId,
  size = 'md',
  className = '',
}: {
  jobId: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const { isSaved, toggle, canSave } = useSavedJobs()
  const navigate = useNavigate()
  const saved = isSaved(jobId)

  const pad = size === 'sm' ? 'p-2' : 'p-3'
  const icon = size === 'sm' ? 'size-5' : 'size-6'

  async function handleClick(e: MouseEvent) {
    // JobCard wraps its content in a <Link>; don't navigate on bookmark click.
    e.preventDefault()
    e.stopPropagation()
    if (!canSave) {
      toast.error('Sign in as a candidate to save jobs.')
      navigate('/sign-in')
      return
    }
    const result = await toggle(jobId)
    if (result === 'saved') toast.success('Saved to favourites')
    else if (result === 'removed') toast('Removed from favourites')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark this job'}
      aria-pressed={saved}
      className={`grid shrink-0 place-items-center rounded-[5px] transition-colors ${pad} ${
        saved
          ? 'bg-brand text-white'
          : 'bg-brand-50 text-brand hover:bg-brand-100'
      } ${className}`}
    >
      <BookmarkIcon className={`${icon} ${saved ? 'fill-current' : ''}`} />
    </button>
  )
}
