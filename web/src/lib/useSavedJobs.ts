import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'
import { useDisplayUser } from './useDisplayUser'
import { toggleSavedJob } from './dashboard'

export type ToggleResult = 'signed-out' | 'saved' | 'removed'

/**
 * Tracks which jobs the signed-in candidate has bookmarked and toggles them
 * against public.saved_jobs. `canSave` is false for signed-out users and for
 * employer accounts.
 */
export function useSavedJobs() {
  const { session } = useSession()
  const { user } = useDisplayUser()
  const candidateId = user?.role === 'candidate' ? user.profileId : null
  const userId = session?.user.id ?? null

  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!candidateId) {
      setSaved(new Set())
      setReady(true)
      return
    }
    let alive = true
    supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('candidate_id', candidateId)
      .then(({ data }) => {
        if (!alive) return
        setSaved(new Set((data ?? []).map((r) => r.job_id as string)))
        setReady(true)
      })
    return () => {
      alive = false
    }
  }, [candidateId])

  const isSaved = useCallback((jobId: string) => saved.has(jobId), [saved])

  const toggle = useCallback(
    async (jobId: string): Promise<ToggleResult> => {
      if (!candidateId || !userId) return 'signed-out'
      const currentlySaved = saved.has(jobId)
      setSaved((prev) => {
        const next = new Set(prev)
        if (currentlySaved) next.delete(jobId)
        else next.add(jobId)
        return next
      })
      try {
        await toggleSavedJob(candidateId, userId, jobId, currentlySaved)
      } catch (err) {
        console.error('toggle saved job', err)
        setSaved((prev) => {
          const next = new Set(prev)
          if (currentlySaved) next.add(jobId)
          else next.delete(jobId)
          return next
        })
      }
      return currentlySaved ? 'removed' : 'saved'
    },
    [candidateId, userId, saved],
  )

  return { isSaved, toggle, canSave: !!candidateId, ready }
}
