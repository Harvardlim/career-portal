import type { ReactNode } from 'react'
import { InfoCard, OverviewGrid, ContactRow } from '@/components/app/InfoCard'
import { SocialLinks } from '@/components/app/SocialLinks'
import {
  BriefcaseIcon,
  CakeIcon,
  DownloadIcon,
  FileIcon,
  GlobeIcon,
  LayersIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
} from '@/components/icons'

const coverLetter = [
  'Dear Sir,',
  'I am writing to express my interest in the fourth grade instructional position that is currently available in the Fort Wayne Community School System. I learned of the opening through a notice posted on JobZone, IPFW’s job database. I am confident that my academic background and curriculum development skills would be successfully utilized in this teaching position.',
  'I have just completed my Bachelor of Science degree in Elementary Education and have successfully completed Praxis I and Praxis II. During my student teaching experience, I developed and initiated a three-week curriculum sequence on animal species and earth resources. This collaborative unit involved working with three other third grade teachers within my team, and culminated in a field trip to the Indianapolis Zoo Animal Research Unit.',
  'Sincerely,',
  'Esther Howard',
]

export function CandidateProfileBody({ actions }: { actions: ReactNode }) {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-muted-slate/40 text-lg font-medium text-white">
            EH
          </span>
          <div>
            <p className="text-2xl font-medium text-ink">Esther Howard</p>
            <p className="text-sm text-muted">Website Designer (UI/UX)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wide text-muted-400">Biography</h3>
            <p className="text-sm leading-6 text-muted-600">
              I&apos;ve been passionate about graphic design and digital art from an
              early age with a keen interest in Website and Mobile Application User
              Interfaces. I can create high-quality and aesthetically pleasing
              designs in a quick turnaround time. Check out the portfolio section of
              my profile to see samples of my work and feel free to discuss your
              designing needs. I mostly use Adobe Photoshop, Illustrator, XD and
              Figma.
            </p>
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wide text-muted-400">Cover Letter</h3>
            {coverLetter.map((p, i) => (
              <p key={i} className="text-sm leading-6 text-muted-600">
                {p}
              </p>
            ))}
          </section>
          <SocialLinks label="Follow me Social Media" />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard>
            <OverviewGrid
              columns={2}
              items={[
                { Icon: CakeIcon, label: 'Date of birth', value: '14 June, 2021' },
                { Icon: GlobeIcon, label: 'Notionality', value: 'Bangladesh' },
                { Icon: UsersIcon, label: 'Marital Status', value: 'Single' },
                { Icon: UsersIcon, label: 'Gender', value: 'Male' },
                { Icon: BriefcaseIcon, label: 'Experience', value: '7 Years' },
                { Icon: LayersIcon, label: 'Educations', value: 'Master Degree' },
              ]}
            />
          </InfoCard>
          <InfoCard title="Download My Resume">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-3">
              <span className="flex items-center gap-3">
                <FileIcon className="size-8 text-brand" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-ink">Esther Howard</span>
                  <span className="text-xs text-muted">PDF</span>
                </span>
              </span>
              <button
                type="button"
                aria-label="Download resume"
                className="grid size-9 place-items-center rounded bg-brand text-white"
              >
                <DownloadIcon className="size-5" />
              </button>
            </div>
          </InfoCard>
          <InfoCard title="Contact Information">
            <ContactRow Icon={GlobeIcon} label="Website" value="www.estherhoward.com" />
            <ContactRow
              Icon={MapPinIcon}
              label="Location"
              value="Beverly Hills, California 90202, Zone/Block Basement 1 Unit B2, 1372 Spring Avenue, Portland,"
            />
            <ContactRow Icon={PhoneIcon} label="Phone" value="+1-202-555-0141" />
            <ContactRow Icon={PhoneIcon} label="Secondary Phone" value="+1-202-555-0189" />
            <ContactRow Icon={MailIcon} label="Email address" value="esther.howard@gmail.com" />
          </InfoCard>
        </aside>
      </div>
    </div>
  )
}
