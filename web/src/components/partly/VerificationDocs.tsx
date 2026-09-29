import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CloudUploadIcon } from '@/components/icons'
import { Pill, SecondaryButton } from '@/components/partly/ui'
import { fetchMyVerificationDocs, uploadVerificationDoc, type VerificationDoc } from '@/lib/partly'
import { formatDate } from '@/lib/format'
import { tr, useT } from '@/lib/i18n'

const LABEL: Record<VerificationDoc['doc_type'], string> = {
  get identity() {
    return tr('doc.identity')
  },
  get business_registration() {
    return tr('doc.business')
  },
  get credential() {
    return tr('doc.credential')
  },
}

/**
 * Upload + status list for one document type. Files go to a private bucket;
 * an admin approves them by hand in the backoffice (OCR automation is phase 3).
 */
export function VerificationDocs({
  userId,
  ownerKind,
  ownerId,
  docType,
  hint,
  onChange,
}: {
  userId: string
  ownerKind: 'candidate' | 'employer'
  ownerId: string
  docType: VerificationDoc['doc_type']
  hint: string
  onChange?: () => void
}) {
  const t = useT()
  const [docs, setDocs] = useState<VerificationDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      setDocs((await fetchMyVerificationDocs(userId)).filter((d) => d.doc_type === docType))
    } catch (err) {
      console.error('verification docs', err)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, docType])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('ui.please_keep_the_file_under_10'))
      return
    }
    setUploading(true)
    try {
      await uploadVerificationDoc({ userId, ownerKind, ownerId, docType, file })
      toast.success(t('ui.uploaded_we_ll_review_it_shortly'))
      await load()
      onChange?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.upload_failed'))
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  const latest = docs[0]
  const hasPending = docs.some((d) => d.status === 'pending')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{LABEL[docType]}</p>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        {latest && (
          <Pill tone={latest.status === 'approved' ? 'success' : latest.status === 'rejected' ? 'danger' : 'warning'}>
            {latest.status === 'approved' ? t('ui.approved') : latest.status === 'rejected' ? t('ui.rejected') : t('ui.under_review')}
          </Pill>
        )}
      </div>
      {latest?.status === 'rejected' && latest.notes && (
        <p className="rounded-md bg-danger-50 px-3 py-2 text-xs text-danger">{latest.notes}</p>
      )}
      {latest?.purged_at && (
        <p className="text-xs text-muted">{t('ui.the_file_itself_was_securely_deleted', { purged_at: formatDate(latest.purged_at) })}</p>
      )}
      {latest?.status !== 'approved' && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <SecondaryButton onClick={() => input.current?.click()} disabled={uploading || hasPending} className="w-fit">
            <CloudUploadIcon className="size-4" />
            {uploading ? t('ui.uploading') : hasPending ? t('ui.waiting_for_review') : latest ? t('ui.upload_a_clearer_copy') : t('ui.upload_document')}
          </SecondaryButton>
        </>
      )}
      <p className="text-xs text-muted">{t('ui.documents_are_stored_privately_and_seen')}</p>
    </div>
  )
}
