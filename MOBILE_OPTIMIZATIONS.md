# Mobile Performance Optimizations

This document outlines all mobile performance optimizations implemented in the Camera Vault application.

## Image Optimization Strategy

### 1. Lazy Loading
All images throughout the app use native browser lazy loading with `loading="lazy"` attribute:
- **PhotoCard**: Gallery thumbnails load as user scrolls
- **EditorialGrid**: Hero and grid images lazy load except featured image
- **PhotoBackgroundCard**: Category showcase backgrounds
- **Top10Showcase**: Grid photos except #1 featured photo
- **DynamicHero**: Hero carousel photos (background uses eager loading)
- **AnalysisLoadingOverlay**: Background rotation photos

### 2. Async Image Decoding
All images use `decoding="async"` to prevent blocking the main thread during image decode.

### 3. Automatic Image Compression
**Location**: `src/lib/imageOptimization.ts`

New utility functions for intelligent compression:
- `compressImage()`: Compresses individual images with configurable options
- `compressImages()`: Batch compression for multiple files
- `getOptimalQuality()`: Adapts compression quality based on:
  - Device pixel ratio (retina vs standard displays)
  - Network speed (2G, 3G, 4G detection)
  - Returns quality values from 0.6 (slow networks) to 0.9 (fast networks)

**Upload Integration**:
- Thumbnails generated at 400px max dimension, 0.2MB max size
- Uses device-optimized quality settings
- Automatic compression for files > 4MB before analysis

### 4. Responsive Image Sizing
Components adapted for mobile:
- Hero text: `4xl` → `9xl` responsive scaling
- Stats: Compact mobile layout with smaller icons
- Cards: `450px` → `650px` responsive min-heights
- Buttons: Compact mobile sizes with text hiding on small screens

## Mobile UI Enhancements

### Vault Button
- **Mobile**: Icon-only display for space efficiency
- **Desktop**: Full "Connect Your Photos" / "Nick's Vault" text
- **Responsive breakpoints**: Uses `hidden md:inline` pattern

### Navigation Tabs
- Compact sizing on mobile with smaller gaps
- Text adapts: Some labels shortened or hidden on smallest screens
- Icon sizes scale from `h-3` on mobile to `h-4` on desktop

### Stats Bar
- 2-column grid on mobile, 4-column on desktop
- Smaller icon containers and text on mobile
- Distribution legend shows abbreviated text on mobile

### Category Showcase
- Single column on mobile, 3 columns on large screens
- Card heights adapt to viewport size
- Reduced padding and spacing on mobile

## Performance Best Practices

1. **Eager vs Lazy Loading**:
   - Above-the-fold content: `loading="eager"` (hero bg, lightbox, detail modal)
   - Below-the-fold content: `loading="lazy"` (galleries, grids)

2. **Intersection Observer Ready**:
   - `OptimizedImage` component available for advanced lazy loading
   - Includes blur-up placeholder effect
   - Configurable viewport offset (50px default)

3. **Mobile-First Responsive Design**:
   - All spacing uses responsive utilities (`px-3 sm:px-4 md:px-6`)
   - Text scales smoothly across breakpoints
   - No horizontal scroll on any screen size

## Testing Recommendations

- Test on actual mobile devices (not just DevTools)
- Check network throttling (Fast 3G, Slow 3G)
- Verify lazy loading with Chrome DevTools Network tab
- Confirm no layout shifts during image loading
- Test with slow connections to see compression benefits

## Future Optimization Opportunities

- Implement srcset for art-directed responsive images
- Add WebP format support with fallbacks
- Consider thumbnail generation for immediate display
- Implement progressive image loading (blur-up technique)
- Add service worker for offline caching
