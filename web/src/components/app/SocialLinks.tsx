import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons'

const icons = [FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon, LinkedinIcon]

export function SocialLinks({ label }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {label && <p className="text-base font-medium text-ink">{label}</p>}
      <div className="flex gap-2">
        {icons.map((Icon, i) => (
          <a
            key={i}
            href="#"
            aria-label="Social link"
            className={`grid size-9 place-items-center rounded ${
              i === 1
                ? 'bg-brand text-white'
                : 'bg-brand-50 text-brand hover:bg-brand-100'
            }`}
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </div>
  )
}

export function ShareRow({ label = 'Share this job:' }: { label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      {[
        { Icon: FacebookIcon, text: 'Facebook', color: 'text-[#1877f2]' },
        { Icon: TwitterIcon, text: 'Twitter', color: 'text-[#1da1f2]' },
        { Icon: InstagramIcon, text: 'Pinterest', color: 'text-[#e60023]' },
      ].map(({ Icon, text, color }) => (
        <a
          key={text}
          href="#"
          className="flex items-center gap-2 rounded border border-line px-3 py-2 text-sm font-medium text-ink-600"
        >
          <Icon className={`size-4 ${color}`} />
          {text}
        </a>
      ))}
    </div>
  )
}
