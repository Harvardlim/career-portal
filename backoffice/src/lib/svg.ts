export type Pt = [number, number]

/** Catmull-Rom → cubic bezier, produces a smooth "d" through the given points. */
export function smoothLine(pts: Pt[], tension = 0.5): string {
  if (pts.length < 2) return ''
  const d: string[] = [`M ${pts[0][0]} ${pts[0][1]}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`)
  }
  return d.join(' ')
}

export function areaFromLine(pts: Pt[], baselineY: number, tension = 0.5): string {
  const line = smoothLine(pts, tension)
  const first = pts[0]
  const last = pts[pts.length - 1]
  return `${line} L ${last[0]} ${baselineY} L ${first[0]} ${baselineY} Z`
}

/** Map a list of values to [x,y] points inside a box. */
export function toPoints(
  values: number[],
  box: { x: number; y: number; w: number; h: number },
  domain: [number, number],
): Pt[] {
  const [min, max] = domain
  const span = max - min || 1
  return values.map((v, i) => {
    const px = box.x + (box.w * i) / (values.length - 1)
    const py = box.y + box.h - ((v - min) / span) * box.h
    return [px, py]
  })
}
