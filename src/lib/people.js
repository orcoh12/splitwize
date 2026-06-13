/**
 * The trip roster. Each person gets a stable, distinct color used for their
 * avatar and for color-coding expenses across the app.
 *
 * `name` is the canonical value stored in the DB (`paid_by`, `split_between`).
 * `label` is the Hebrew display name shown in the UI.
 */
export const PEOPLE = [
  { name: 'Or', label: 'אור', color: '#22d3ee' }, // cyan
  { name: 'Jamie', label: "ג'יימי", color: '#a78bfa' }, // violet
  { name: 'Nir', label: 'ניר', color: '#34d399' }, // emerald
  { name: 'Avishai', label: 'אבישי', color: '#fbbf24' }, // amber
  { name: 'Jackie', label: "ג'קי", color: '#f472b6' }, // pink
  { name: 'Barel', label: 'בראל', color: '#60a5fa' }, // blue
  { name: 'Oren', label: 'אורן', color: '#fb7185' }, // rose
]

export const PEOPLE_NAMES = PEOPLE.map((p) => p.name)

const byName = Object.fromEntries(PEOPLE.map((p) => [p.name, p]))

/** Display label for a stored name (falls back to the raw name). */
export function labelOf(name) {
  return byName[name]?.label ?? name
}

/** Brand color for a person (falls back to slate). */
export function colorOf(name) {
  return byName[name]?.color ?? '#94a3b8'
}

/** Initials for the avatar — Hebrew first character of the label. */
export function initialsOf(name) {
  const label = labelOf(name)
  return label.slice(0, 2)
}

export const CURRENCY = '€'

/** Format a number as € currency for display (LTR-safe). */
export function formatMoney(n) {
  const num = Number(n || 0)
  return `${CURRENCY}${num.toLocaleString('he-IL', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
