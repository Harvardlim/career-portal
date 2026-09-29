import type { ReactNode } from 'react'
import { InfoCard, OverviewGrid, ContactRow } from '@/components/app/InfoCard'
import { SocialLinks } from '@/components/app/SocialLinks'
import {
  BriefcaseIcon,
  DownloadIcon,
  FileIcon,
  GlobeIcon,
  LayersIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
} from '@/components/icons'
import { useT } from '@/lib/i18n'

const coverLetter = [
  'Dear Sir,',
  'I am writing to express my interest in the fourth grade instructional position that is currently available in the Fort Wayne Community School System. I learned of the opening through a notice posted on JobZone, IPFW’s job database. I am confident that my academic background and curriculum development skills would be successfully utilized in this teaching position.',
  'I have just completed my Bachelor of Science degree in Elementary Education and have successfully completed Praxis I and Praxis II. During my student teaching experience, I developed and initiated a three-week curriculum sequence on animal species and earth resources. This collaborative unit involved working with three other third grade teachers within my team, and culminated in a field trip to the Indianapolis Zoo Animal Research Unit.',
  'Sincerely,',
  'Esther Howard',
]

export function CandidateProfileBody({ actions }: { actions: ReactNode }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-muted-slate/40 text-lg font-medium text-white">{t('ui.eh')}</span>
          <div>
            <p className="text-2xl font-medium text-ink">{t('ui.esther_howard')}</p>
            <p className="text-sm text-muted">{t('ui.website_designer_ui_ux')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wide text-muted-400">{t('ui.biography')}</h3>
            <p className="text-sm leading-6 text-muted-600">{t('ui.i_ve_been_passionate_about_graphic')}</p>
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wide text-muted-400">{t('ui.cover_letter')}</h3>
            {coverLetter.map((p, i) => (
              <p key={i} className="text-sm leading-6 text-muted-600">
                {p}
              </p>
            ))}
          </section>
          <SocialLinks label={t('ui.follow_me_social_media')} />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard>
            <OverviewGrid
              columns={2}
              items={[
                { Icon: GlobeIcon, label: t('ui.notionality'), value: 'Bangladesh' },
                { Icon: UsersIcon, label: t('ui.gender'), value: 'Male' },
                { Icon: BriefcaseIcon, label: t('ui.experience'), value: '7 Years' },
                { Icon: LayersIcon, label: t('ui.educations'), value: 'Master Degree' },
              ]}
            />
          </InfoCard>
          <InfoCard title={t('ui.download_my_resume')}>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-3">
              <span className="flex items-center gap-3">
                <FileIcon className="size-8 text-brand" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-ink">{t('ui.esther_howard')}</span>
                  <span className="text-xs text-muted">{t('ui.pdf')}</span>
                </span>
              </span>
              <button
                type="button"
                aria-label={t('ui.download_resume')}
                className="grid size-9 place-items-center rounded bg-brand text-white"
              >
                <DownloadIcon className="size-5" />
              </button>
            </div>
          </InfoCard>
          <InfoCard title={t('ui.contact_information')}>
            <ContactRow Icon={GlobeIcon} label={t('ui.website')} value="www.estherhoward.com" />
            <ContactRow
              Icon={MapPinIcon}
              label={t('ui.location')}
              value="Beverly Hills, California 90202, Zone/Block Basement 1 Unit B2, 1372 Spring Avenue, Portland,"
            />
            <ContactRow Icon={PhoneIcon} label={t('ui.phone')} value="+1-202-555-0141" />
            <ContactRow Icon={PhoneIcon} label={t('ui.secondary_phone')} value="+1-202-555-0189" />
            <ContactRow Icon={MailIcon} label={t('ui.email_address')} value="esther.howard@gmail.com" />
          </InfoCard>
        </aside>
      </div>
    </div>
  )
}
