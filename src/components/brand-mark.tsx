import { cn } from "@/lib/utils";

/**
 * NextRound mark: a violet rounded tile with an upward "next round" chevron
 * and a single lime dot as the brand's secondary accent.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="NextRound"
      className={cn("size-7 shrink-0", className)}
    >
      <defs>
        <linearGradient id="nr-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.58 0.19 285)" />
          <stop offset="100%" stopColor="oklch(0.45 0.18 278)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#nr-mark)" />
      <path
        d="M9 21.5 15 12.5 21 21.5"
        fill="none"
        stroke="oklch(0.99 0.004 285)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.6" cy="9.4" r="2.4" fill="var(--lime)" />
    </svg>
  );
}
