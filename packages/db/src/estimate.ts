// Formula-based cost estimation — see "Real-time cost estimation" in the
// technical spec. Lives here (not in apps/portal) so both the seed script
// and any future admin action share one source of truth for the numbers.

export const HOURLY_RATE_ZAR = 950;

export const TIER_HOURS = {
  SMALL: 2,
  MEDIUM: 8,
  LARGE: 20,
} as const;

export type SizeTierKey = keyof typeof TIER_HOURS;

export function estimateForTier(tier: SizeTierKey): {
  hours: number;
  amount: number;
} {
  const hours = TIER_HOURS[tier];
  return { hours, amount: hours * HOURLY_RATE_ZAR };
}
