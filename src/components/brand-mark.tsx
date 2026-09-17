import { cn } from "@/lib/utils";
import markAsset from "@/assets/nextround-mark.png.asset.json";
import logoAsset from "@/assets/nextround-logo.png.asset.json";

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
    <img
      src={logoAsset.url}
      alt="NextRound"
      width={120}
      height={120}
      className={cn("size-20 shrink-0 rounded-2xl object-cover", className)}
    />
  );
}
