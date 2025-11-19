/**
 * Photo Value Calculation System
 * 
 * Calculates the monetary value of photos based on their tier/quality.
 * This represents the estimated market value or licensing potential.
 */

export type PhotoTier = 'elite' | 'stars' | 'archive';

/**
 * Base values per photo tier in USD
 * These represent average licensing/market values
 */
const TIER_VALUES = {
  elite: 2800,    // Premium portfolio pieces - high commercial value
  stars: 800,     // Strong commercial potential
  archive: 150,   // Stock/backup content value
} as const;

/**
 * Calculate the total value of a photo collection by tier
 */
export const calculateTierValue = (count: number, tier: PhotoTier): number => {
  return count * TIER_VALUES[tier];
};

/**
 * Calculate total portfolio value across all tiers
 */
export const calculateTotalValue = (
  eliteCount: number,
  starsCount: number,
  archiveCount: number
): number => {
  return (
    calculateTierValue(eliteCount, 'elite') +
    calculateTierValue(starsCount, 'stars') +
    calculateTierValue(archiveCount, 'archive')
  );
};

/**
 * Get the value of a single photo based on its score
 */
export const getPhotoValueByScore = (score: number | null): number => {
  if (score === null) return TIER_VALUES.archive;
  
  if (score >= 8.5) return TIER_VALUES.elite;
  if (score >= 7.0) return TIER_VALUES.stars;
  return TIER_VALUES.archive;
};

/**
 * Get the tier classification based on overall_score
 */
export const getTierFromScore = (score: number | null): PhotoTier => {
  if (score === null) return 'archive';
  
  if (score >= 8.5) return 'elite';
  if (score >= 7.0) return 'stars';
  return 'archive';
};

/**
 * Format currency value for display
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Get value breakdown by tier
 */
export const getValueBreakdown = (photos: Array<{ overall_score: number | null; tier?: string }>) => {
  let eliteValue = 0;
  let starsValue = 0;
  let archiveValue = 0;
  
  photos.forEach(photo => {
    const value = getPhotoValueByScore(photo.overall_score);
    const tier = getTierFromScore(photo.overall_score);
    
    switch (tier) {
      case 'elite':
        eliteValue += value;
        break;
      case 'stars':
        starsValue += value;
        break;
      case 'archive':
        archiveValue += value;
        break;
    }
  });
  
  return {
    elite: eliteValue,
    stars: starsValue,
    archive: archiveValue,
    total: eliteValue + starsValue + archiveValue,
  };
};
