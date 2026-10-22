// ONASKILL wordmark: a gold "O" whose top extends into a thin bar running over
// "NASKILL". `dark` = for navy backgrounds (white letters).
export default function Logo({ dark = false, className = 'h-9 w-auto' }) {
  const gold = dark ? '#e5b85a' : '#d4a03a';
  return (
    <svg viewBox="0 0 226 50" className={`notranslate ${className}`} translate="no" role="img" aria-label="ONASKILL">
      <circle cx="21" cy="30" r="15" fill="none" stroke={gold} strokeWidth="7" />
      <path d="M13 15.6 L219 15.6" stroke={gold} strokeWidth="2.6" strokeLinecap="round" />
      <text
        x="43"
        y="46"
        textLength="176"
        lengthAdjust="spacingAndGlyphs"
        fill={dark ? '#ffffff' : '#0b1b36'}
        style={{ fontFamily: 'var(--font-sans), Arial, sans-serif', fontWeight: 800, fontSize: 34 }}
      >
        NASKILL
      </text>
    </svg>
  );
}
