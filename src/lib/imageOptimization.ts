import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compresses an image file for optimal web performance
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1920, // Maximum dimension
    useWebWorker: true,
    quality: 0.85, // Quality (0-1)
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original file if compression fails
  }
}

/**
 * Compresses multiple images in parallel
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Array of compressed image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Creates responsive image sizes for different screen sizes
 * @param file - The image file
 * @returns Object with different size variations
 */
export async function createResponsiveImages(file: File) {
  const sizes = {
    mobile: await compressImage(file, { maxWidthOrHeight: 640, maxSizeMB: 0.3 }),
    tablet: await compressImage(file, { maxWidthOrHeight: 1024, maxSizeMB: 0.6 }),
    desktop: await compressImage(file, { maxWidthOrHeight: 1920, maxSizeMB: 1 }),
  };

  return sizes;
}

/**
 * Lazy loads an image using Intersection Observer
 * @param img - The image element
 */
export function setupLazyLoading(img: HTMLImageElement) {
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    img.loading = 'lazy';
  } else {
    // Fallback to Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
          }
          observer.unobserve(lazyImage);
        }
      });
    });
    observer.observe(img);
  }
}

/**
 * Gets optimal image quality based on device pixel ratio and network speed
 */
export function getOptimalQuality(): number {
  const dpr = window.devicePixelRatio || 1;
  const connection = (navigator as any).connection;
  
  // Check network speed
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 0.6;
    } else if (effectiveType === '3g') {
      return 0.75;
    }
  }
  
  // Adjust quality based on pixel ratio
  if (dpr > 2) {
    return 0.8;
  } else if (dpr > 1) {
    return 0.85;
  }
  
  return 0.9;
}
