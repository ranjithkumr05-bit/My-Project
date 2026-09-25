// components/Icon.jsx — the site's inline icon set.
// One 24px grid, stroke-based, inheriting currentColor: no icon package and no
// emoji/text glyphs (↗ ☰ ✕ ✔ ← render at different weights on every OS).
// Decorative by default; pass `label` only when the icon carries meaning alone.
export const ICON_PATHS = {
  arrow: 'M7 17 17 7M9 7h8v8', // up-right (was ↗)
  back: 'M15 18l-6-6 6-6', // left chevron (was ←)
  menu: 'M4 7h16M4 12h16M4 17h16', // was ☰
  close: 'M6 6l12 12M18 6 6 18', // was ✕
  check: 'M20 6 9 17l-5-5', // was ✔
}

export default function Icon({ name, size = 16, className = '', label, strokeWidth = 2 }) {
  const d = ICON_PATHS[name]
  if (!d) return null
  return (
    <svg
      className={`cw-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {label ? <title>{label}</title> : null}
      <path d={d} />
    </svg>
  )
}
