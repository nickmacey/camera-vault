/**
 * Photo Value Calculation System
 * 
 * Calculates the monetary value of photos based on their tier/quality.
 * Values are derived from market research on stock photography licensing,
 * print sales, and social media monetization potential.
 */

export type PhotoTier = 'elite' | 'stars' | 'archive';

/**
 * Value breakdown by revenue stream (in USD)
 * Based on industry averages:
 * - Print: Fine art prints, canvas, merchandise (Printful/Printify margins)
 * - Social: Sponsored posts, licensing for social media use
 * - Stock: Traditional stock photography licensing
 */
const VALUE_STREAMS = {
  elite: {
    print: 1200,    // Premium gallery prints, limited editions
    social: 800,    // High engagement potential, brand partnerships
    stock: 800,     // Exclusive licensing rights
  },
  stars: {
    print: 350,     // Standard prints, merchandise
    social: 250,    // Good engagement, micro-influencer rates
    stock: 200,     // Standard licensing
  },
  archive: {
    print: 50,      // Basic prints, personal use
    social: 50,     // Low commercial appeal
    stock: 50,      // Economy licensing
  },
} as const;

/**
 * Calculate total value for a tier (sum of all streams)
 */
const getTierTotal = (tier: PhotoTier): number => {
  const streams = VALUE_STREAMS[tier];
  return streams.print + streams.social + streams.stock;
};

/**
 * Calculate the total value of a photo collection by tier
 */
export const calculateTierValue = (count: number, tier: PhotoTier): number => {
  return count * getTierTotal(tier);
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
  const tier = getTierFromScore(score);
  return getTierTotal(tier);
};

/**
 * Get detailed value breakdown for a single photo
 */
export const getPhotoValueBreakdown = (score: number | null) => {
  const tier = getTierFromScore(score);
  const streams = VALUE_STREAMS[tier];
  
  return {
    tier,
    print: {
      value: streams.print,
      description: tier === 'elite' 
        ? 'Gallery-quality prints, limited editions, premium canvas'
        : tier === 'stars'
        ? 'Standard prints, posters, merchandise'
        : 'Personal prints, basic merchandise',
    },
    social: {
      value: streams.social,
      description: tier === 'elite'
        ? 'Brand partnerships, sponsored content, high engagement'
        : tier === 'stars'
        ? 'Micro-influencer rates, organic reach potential'
        : 'Personal sharing, minimal commercial value',
    },
    stock: {
      value: streams.stock,
      description: tier === 'elite'
        ? 'Exclusive rights, premium stock licensing'
        : tier === 'stars'
        ? 'Standard stock licensing, editorial use'
        : 'Economy licensing, personal use',
    },
    total: streams.print + streams.social + streams.stock,
    methodology: `Value based on ${tier.toUpperCase()} tier classification (score: ${score?.toFixed(1) || 'N/A'}). ` +
      'Estimates derived from average market rates for stock photography licensing, ' +
      'print-on-demand margins (Printful/Printify), and social media monetization benchmarks.',
  };
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
 * Get value breakdown by tier for a collection
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
