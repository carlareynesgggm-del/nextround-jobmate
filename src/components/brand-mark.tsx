import { cn } from "@/lib/utils";
import markAsset from "@/assets/nextround-mark.png.asset.json";

/**
 * NextRound mark: the official NR symbol on its black tile.
 * Discreet by default (sidebar, headers); use `BrandLogo` where the brand
 * should be the hero (sign-in, empty first screens).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="NextRound"
      width={32}
      height={32}
      className={cn("size-7 shrink-0 rounded-[9px] object-cover", className)}
    />
  );
}

/** Full lockup (symbol + wordmark) for prominent, welcoming moments. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3.5", className)}>
      <img
        src={markAsset.url}
        alt="NextRound"
        width={120}
        height={120}
        className="size-14 shrink-0 rounded-2xl object-cover"
      />
      <span className="font-display text-[22px] font-semibold tracking-tight">NextRound</span>
    </span>
  );
}
