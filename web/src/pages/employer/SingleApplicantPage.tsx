import { JobApplicationsPage } from '@/pages/employer/JobApplicationsPage'
import { Dialog } from '@/components/app/Dialog'
import { CandidateProfileBody } from '@/components/candidates/CandidateProfileBody'
import { MailIcon, StarIcon } from '@/components/icons'

export function SingleApplicantPage() {
  return (
    <>
      <JobApplicationsPage />
      <Dialog closeTo="/employer/applications" width="max-w-[940px]">
        <CandidateProfileBody
          actions={
            <>
              <button
                type="button"
                aria-label="Shortlist"
                className="rounded-[5px] bg-brand-50 p-3 text-brand"
              >
                <StarIcon className="size-6" />
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[4px] border border-brand px-6 py-3 text-base font-semibold text-brand"
              >
                <MailIcon className="size-5" />
                Send Mail
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Hire Candidates
              </button>
            </>
          }
        />
      </Dialog>
    </>
  )
}
