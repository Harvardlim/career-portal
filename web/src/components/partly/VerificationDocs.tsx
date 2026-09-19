import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CloudUploadIcon } from '@/components/icons'
import { Pill, SecondaryButton } from '@/components/partly/ui'
import { fetchMyVerificationDocs, uploadVerificationDoc, type VerificationDoc } from '@/lib/partly'

const LABEL: Record<VerificationDoc['doc_type'], string> = {
  identity: 'Identity document',
  business_registration: 'Business registration',
  credential: 'Professional credential',
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
      toast.error('Please keep the file under 10 MB.')
      return
    }
    setUploading(true)
    try {
      await uploadVerificationDoc({ userId, ownerKind, ownerId, docType, file })
      toast.success('Uploaded. We’ll review it shortly.')
      await load()
      onChange?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
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
            {latest.status === 'approved' ? 'Approved' : latest.status === 'rejected' ? 'Rejected' : 'Under review'}
          </Pill>
        )}
      </div>
      {latest?.status === 'rejected' && latest.notes && (
        <p className="rounded-md bg-danger-50 px-3 py-2 text-xs text-danger">{latest.notes}</p>
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
            {uploading ? 'Uploading…' : hasPending ? 'Waiting for review' : latest ? 'Upload a clearer copy' : 'Upload document'}
          </SecondaryButton>
        </>
      )}
      <p className="text-xs text-muted">
        Documents are stored privately and seen only by our verification team. Nothing from them is shown on your profile.
      </p>
    </div>
  )
}
