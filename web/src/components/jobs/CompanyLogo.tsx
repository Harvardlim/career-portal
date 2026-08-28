import { BriefcaseIcon } from '@/components/icons'

export function CompanyLogo({
  bg,
  lightLogo = false,
  size = 56,
  rounded = 'rounded',
}: {
  bg: string
  lightLogo?: boolean
  size?: number
  rounded?: string
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${rounded}`}
      style={{ background: bg, width: size, height: size }}
    >
      <BriefcaseIcon
        className={lightLogo ? 'text-ink' : 'text-white'}
        style={{ width: size * 0.43, height: size * 0.43 }}
      />
    </span>
  )
}
