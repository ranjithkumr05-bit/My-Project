// components/Icon.jsx — the site's inline icon set.
// One 24px grid, stroke-based, inheriting currentColor: no icon package and no
// emoji/text glyphs (↗ ☰ ✕ ✔ ← render at different weights on every OS).
// Decorative by default; pass `label` only when the icon carries meaning alone.
const ICON_PATHS = {
  arrow: 'M7 17 17 7M9 7h8v8', // up-right (was ↗)
  back: 'M15 18l-6-6 6-6', // left chevron (was ←)
  menu: 'M4 7h16M4 12h16M4 17h16', // was ☰
  close: 'M6 6l12 12M18 6 6 18', // was ✕
  check: 'M20 6 9 17l-5-5', // was ✔
  // Outline glyphs for the footer contact stack + social row. Brand marks are drawn
  // as outline sub-paths so they stay on the same 24px stroke grid as the rest of the
  // set (a filled brand glyph would render as a blob under stroke-only rules).
  phone:
    'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.2.4 2.4.6 3.6.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.6a1 1 0 0 1-.2 1L6.6 10.8Z',
  mail: 'M3 6h18v12H3V6Zm.6 1.3 8.4 5.6 8.4-5.6',
  pin: 'M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.5V12l3.5 2.2',
  instagram:
    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm5.5-10.5h.01',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z',
  linkedin:
    'M2 9h4v12H2zM4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 6a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z',
}

export default function Icon({name, size = 16, className = '', label, strokeWidth = 2}) {
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
