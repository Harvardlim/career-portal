import { BrowseCandidatePage } from '@/pages/BrowseCandidatePage'
import { Dialog } from '@/components/app/Dialog'
import { CandidateProfileBody } from '@/components/candidates/CandidateProfileBody'
import { BookmarkIcon, MailIcon } from '@/components/icons'

export function SendEmailPage() {
  return (
    <>
      <BrowseCandidatePage />
      <Dialog closeTo="/browse-candidate" width="max-w-[940px]">
        <CandidateProfileBody
          actions={
            <>
              <button
                type="button"
                aria-label="Save candidate"
                className="rounded-[5px] bg-brand-50 p-3 text-brand"
              >
                <BookmarkIcon className="size-6" />
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <MailIcon className="size-5" />
                Send Mail
              </button>
            </>
          }
        />
      </Dialog>
    </>
  )
}
