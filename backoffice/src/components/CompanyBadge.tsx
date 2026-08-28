const BRANDS: Record<string, { bg: string; fg?: string; label: string }> = {
  Google: { bg: '#ffffff', fg: '#4285F4', label: 'G' },
  Webflow: { bg: '#146EF5', label: 'W' },
  Facebook: { bg: '#1877F2', label: 'f' },
  Twitter: { bg: '#1DA1F2', label: 't' },
  YouTube: { bg: '#FF0000', label: '▶' },
  Reddit: { bg: '#FF4500', label: 'r' },
  Spotify: { bg: '#1DB954', label: '♪' },
  Pinterest: { bg: '#E60023', label: 'P' },
  Twitch: { bg: '#9146FF', label: 't' },
  LinkedIn: { bg: '#0A66C2', label: 'in' },
}

export const CompanyBadge = ({ name }: { name: string }) => {
  const b = BRANDS[name] ?? { bg: '#343b4f', label: name.slice(0, 1) }
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink-200">
      <span
        className="grid size-6 place-items-center rounded-full text-[11px] font-bold"
        style={{ background: b.bg, color: b.fg ?? '#ffffff' }}
      >
        {b.label}
      </span>
      {name}
    </span>
  )
}
