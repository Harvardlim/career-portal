import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SavedJobRow } from '@/components/dashboard/JobRows'
import {
  fetchSavedJobs,
  toggleSavedJob,
  useCandidate,
  type SavedJobRecord,
} from '@/lib/dashboard'

export function FavoriteJobsPage() {
  const { candidate, session, loading: candidateLoading } = useCandidate()
  const [rows, setRows] = useState<SavedJobRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) {
      if (!candidateLoading) setLoading(false)
      return
    }
    let alive = true
    fetchSavedJobs(candidate.id)
      .then((data) => alive && setRows(data))
      .catch((err) => console.error('favorite jobs', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [candidate, candidateLoading])

  async function handleRemove(jobId: string) {
    if (!candidate || !session) return
    setRows((r) => r.filter((rec) => rec.job?.id !== jobId))
    try {
      await toggleSavedJob(candidate.id, session.user.id, jobId, true)
    } catch (err) {
      console.error('remove saved job', err)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-medium text-ink">
          Favorite Jobs <span className="text-muted">({rows.length})</span>
        </h1>
        {rows.length > 0 ? (
          <div className="flex flex-col divide-y divide-line">
            {rows.map(
              (rec) =>
                rec.job && (
                  <SavedJobRow
                    key={rec.id}
                    job={rec.job}
                    saved
                    onToggleSave={() => handleRemove(rec.job!.id)}
                  />
                ),
            )}
          </div>
        ) : (
          <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">
            {loading ? 'Loading…' : 'No favorite jobs yet. Tap the bookmark on any job to save it.'}
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
