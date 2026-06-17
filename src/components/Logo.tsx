// Placeholder SVG version of the tieflab "TIEF" mark.
// Replace by uploading the official PNG via the asset pipeline.
export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="tieflab">
      <circle cx="50" cy="50" r="48" fill="#1a2754" />
      <path
        d="M10 78 L82 18"
        stroke="#c53030"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="white"
        letterSpacing="-1"
      >
        TIEF
      </text>
    </svg>
  );
}
