import { AnalyzedPhoto } from "@/hooks/useTop10Photos";

export interface CuratedLayout {
  hero: AnalyzedPhoto | null;
  secondary: AnalyzedPhoto[];
  tertiary: AnalyzedPhoto[];
  strip: AnalyzedPhoto[];
}

export const curateLayout = (photos: AnalyzedPhoto[]): CuratedLayout => {
  if (photos.length === 0) {
    return { hero: null, secondary: [], tertiary: [], strip: [] };
  }

  const layout: CuratedLayout = {
    hero: null,
    secondary: [],
    tertiary: [],
    strip: [],
  };

  // 1. Hero: Highest scoring landscape or square
  const landscapePhotos = photos.filter(p => p.aspectRatio >= 1);
  layout.hero = landscapePhotos.sort((a, b) => b.score - a.score)[0] || photos[0];

  // 2. Secondary: Next 2 highest, prefer variety in orientation
  const remaining = photos.filter(p => p.id !== layout.hero?.id);
  const landscape = remaining.find(p => p.aspectRatio > 1.2);
  const portrait = remaining.find(p => p.aspectRatio < 0.8);
  
  layout.secondary = [landscape, portrait].filter(Boolean).slice(0, 2) as AnalyzedPhoto[];
  
  // Fill secondary if we don't have 2
  if (layout.secondary.length < 2) {
    const additionalPhotos = remaining
      .filter(p => !layout.secondary.some(s => s.id === p.id))
      .slice(0, 2 - layout.secondary.length);
    layout.secondary.push(...additionalPhotos);
  }

  // 3. Tertiary: Balance warm/cool colors
  const unusedRemaining = remaining.filter(p => 
    !layout.secondary.some(s => s.id === p.id)
  );
  
  layout.tertiary = balanceColorTemperature(unusedRemaining.slice(0, 3));

  // 4. Strip: Remaining photos, sorted by complexity
  layout.strip = unusedRemaining
    .slice(3, 7)
    .sort((a, b) => (a.visualComplexity || 0) - (b.visualComplexity || 0));

  return layout;
};

const balanceColorTemperature = (photos: AnalyzedPhoto[]): AnalyzedPhoto[] => {
  const warm = photos.filter(p => p.colorTemperature === 'warm');
  const cool = photos.filter(p => p.colorTemperature === 'cool');
  const neutral = photos.filter(p => p.colorTemperature === 'neutral');
  
  const balanced: AnalyzedPhoto[] = [];
  
  while (balanced.length < 3 && (warm.length || cool.length || neutral.length)) {
    if (warm.length) balanced.push(warm.shift()!);
    if (balanced.length >= 3) break;
    if (cool.length) balanced.push(cool.shift()!);
    if (balanced.length >= 3) break;
    if (neutral.length) balanced.push(neutral.shift()!);
  }
  
  return balanced.slice(0, 3);
};

export const getSpacingClass = (complexity: number = 0.5): string => {
  return complexity > 0.7 ? 'gap-6 md:gap-8' : 'gap-3 md:gap-4';
};
