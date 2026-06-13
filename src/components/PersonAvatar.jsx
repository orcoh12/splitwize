import { colorOf, initialsOf, labelOf } from '../lib/people'

/**
 * Initials-based circular avatar, tinted with the person's brand color.
 *
 * @param {string} name   canonical person name
 * @param {number} size   diameter in px
 * @param {boolean} showName  render the label next to the avatar
 */
export default function PersonAvatar({ name, size = 36, showName = false, className = '' }) {
  const color = colorOf(name)
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-slate-950 ring-2"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          boxShadow: `0 2px 12px ${color}40`,
          '--tw-ring-color': `${color}55`,
        }}
        title={labelOf(name)}
      >
        {initialsOf(name)}
      </span>
      {showName && <span className="truncate font-medium text-slate-200">{labelOf(name)}</span>}
    </span>
  )
}
