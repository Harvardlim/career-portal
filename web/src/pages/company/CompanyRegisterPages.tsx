import { Link } from 'react-router-dom'
import {
  CompanyRegLayout,
  WizardButtons,
} from '@/components/company/CompanyRegLayout'
import {
  Dropzone,
  Field,
  RichText,
  Select,
  TextInput,
} from '@/components/dashboard/form'
import { ArrowRightIcon, CheckIcon, LinkIcon, MailIcon, PlusCircleIcon } from '@/components/icons'

const socialPlatforms = ['Facebook', 'Twitter', 'Instagram', 'Youtube']

export function CompanyInfoStep() {
  return (
    <CompanyRegLayout progress={0}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        <h2 className="text-lg font-medium text-ink">Logo &amp; Banner Image</h2>
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink">Upload document</span>
            <Dropzone
              className="h-[190px]"
              title={
                <>
                  <span className="font-medium text-ink">Browse photo</span> or
                  drop here
                </>
              }
              hint="A photo larger than 400 pixels work best. Max photo size 5 MB."
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink">Banner Image</span>
            <Dropzone
              className="h-[190px]"
              title={
                <>
                  <span className="font-medium text-ink">Browse photo</span> or
                  drop here
                </>
              }
              hint="Bannar images optical dimension 1520×400. Supported format JPEG, PNG. Max photo size 5 MB."
            />
          </div>
        </div>
        <hr className="border-line" />
        <Field label="Company name">
          <TextInput />
        </Field>
        <Field label="About Us">
          <RichText placeholder="Write down about your company here. Let the candidate know who we are..." />
        </Field>
        <WizardButtons next="/company/register/founding" />
      </form>
    </CompanyRegLayout>
  )
}

export function FoundingInfoStep() {
  return (
    <CompanyRegLayout progress={25}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Organization Type">
            <Select options={['Select...', 'Private Company', 'Government', 'NGO']} />
          </Field>
          <Field label="Industry Types">
            <Select options={['Select...', 'Technology', 'Finance', 'Healthcare']} />
          </Field>
          <Field label="Team Size">
            <Select options={['Select...', '1-10', '10-50', '50-100', '100-500']} />
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Year of Establishment">
            <TextInput placeholder="dd/mm/yyyy" />
          </Field>
          <Field label="Company Website">
            <TextInput placeholder="Website url..." icon={<LinkIcon className="size-5" />} />
          </Field>
        </div>
        <Field label="Company Vision">
          <RichText placeholder="Tell us about your company vision..." />
        </Field>
        <WizardButtons next="/company/register/social" prev="/company/register" />
      </form>
    </CompanyRegLayout>
  )
}

export function CompanySocialStep() {
  return (
    <CompanyRegLayout progress={50}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="text-sm text-ink">Social Link {i + 1}</span>
            <div className="flex items-center gap-3">
              <select
                defaultValue={socialPlatforms[i] ?? 'Facebook'}
                className="h-12 w-[180px] shrink-0 appearance-none rounded-md border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-brand"
              >
                {socialPlatforms.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <input
                type="url"
                placeholder="Profile link/url..."
                className="h-12 flex-1 rounded-md border border-line bg-surface px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
              />
              <button
                type="button"
                aria-label="Remove"
                className="grid size-12 shrink-0 place-items-center rounded-md bg-surface-alt text-muted"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-surface-alt py-3 text-sm font-medium text-ink"
        >
          <PlusCircleIcon className="size-5" />
          Add New Social Link
        </button>
        <WizardButtons next="/company/register/contact" prev="/company/register/founding" />
      </form>
    </CompanyRegLayout>
  )
}

export function CompanyContactStep() {
  return (
    <CompanyRegLayout progress={75}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
        <Field label="Map Location">
          <TextInput />
        </Field>
        <Field label="Phone">
          <div className="flex gap-3">
            <select className="h-12 w-[120px] shrink-0 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand">
              <option>+880</option>
              <option>+1</option>
              <option>+91</option>
            </select>
            <input
              type="tel"
              placeholder="Phone number.."
              className="h-12 flex-1 rounded-md border border-line bg-surface px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
          </div>
        </Field>
        <Field label="Email">
          <TextInput type="email" placeholder="Email address" icon={<MailIcon className="size-5" />} />
        </Field>
        <WizardButtons
          next="/company/register/success"
          nextLabel="Finish Editing"
          prev="/company/register/social"
        />
      </form>
    </CompanyRegLayout>
  )
}

export function CompanyRegisterSuccess() {
  return (
    <CompanyRegLayout progress={100} tabs={false}>
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-brand-50 text-brand">
          <CheckIcon className="size-10" />
        </span>
        <h1 className="text-2xl font-medium text-ink">
          🎉 Congratulations, You profile is 100% complete!
        </h1>
        <p className="max-w-md text-muted-600">
          Donec hendrerit, ante mattis pellentesque eleifend, tortor urna
          malesuada ante, eget aliquam nulla augue hendrerit ligula. Nunc mauris
          arcu, mattis sed sem vitae.
        </p>
        <div className="flex gap-3">
          <Link
            to="/employer/dashboard"
            className="rounded-[4px] bg-brand-50 px-6 py-3 text-base font-semibold text-brand"
          >
            View Dashboard
          </Link>
          <Link
            to="/employer/post-job"
            className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >
            Post Job
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </CompanyRegLayout>
  )
}
