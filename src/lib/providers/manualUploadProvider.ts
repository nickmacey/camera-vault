import { PhotoProviderInterface, ProviderCapabilities } from '@/types/vault';
import exifr from 'exifr';

// ═══════════════════════════════════════════════════════════
// MANUAL UPLOAD PROVIDER
// ═══════════════════════════════════════════════════════════

export const manualUploadProvider: PhotoProviderInterface = {
  name: 'Manual Upload',
  id: 'manual_upload',
  icon: '📤',
  description: 'Upload photos directly from your device',
  
  getCapabilities: (): ProviderCapabilities => ({
    canRead: true,
    canWrite: false,
    hasMetadata: true,           // Extract from EXIF
    hasLocation: true,            // If in EXIF
    hasCameraData: true,          // If in EXIF
    supportsAlbums: false,
    requiresAuth: false,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    rateLimit: undefined,
    supportedFormats: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/webp'
    ]
  }),
};

// EXIF extraction helper
export async function extractExifData(file: File) {
  try {
    const exif = await exifr.parse(file, {
      pick: [
        'Make', 'Model', 'LensModel',
        'FocalLength', 'FNumber', 'ExposureTime', 'ISO',
        'DateTimeOriginal', 'CreateDate',
        'GPSLatitude', 'GPSLongitude',
        'ImageWidth', 'ImageHeight', 'Orientation'
      ]
    });
    
    if (!exif) return null;

    return {
      camera: exif.Make || exif.Model ? {
        make: exif.Make,
        model: exif.Model,
        lens: exif.LensModel,
        focalLength: exif.FocalLength,
        aperture: exif.FNumber,
        shutterSpeed: exif.ExposureTime ? `1/${Math.round(1 / exif.ExposureTime)}` : undefined,
        iso: exif.ISO
      } : undefined,
      
      location: exif.GPSLatitude && exif.GPSLongitude ? {
        latitude: exif.GPSLatitude,
        longitude: exif.GPSLongitude
      } : undefined,
      
      dimensions: {
        width: exif.ImageWidth,
        height: exif.ImageHeight,
        orientation: exif.Orientation
      },
      
      dateTaken: exif.DateTimeOriginal || exif.CreateDate
    };
  } catch (error) {
    console.error('EXIF extraction failed:', error);
    return null;
  }
}

// Determine orientation from dimensions
export function calculateOrientation(width: number, height: number): 'portrait' | 'landscape' | 'square' {
  const ratio = width / height;
  if (ratio > 1.05) return 'landscape';
  if (ratio < 0.95) return 'portrait';
  return 'square';
}

// Validate file format
export function isValidImageFormat(file: File): boolean {
  const caps = manualUploadProvider.getCapabilities();
  return caps.supportedFormats.includes(file.type);
}

// Validate file size
export function isValidFileSize(file: File): boolean {
  const caps = manualUploadProvider.getCapabilities();
  return file.size <= caps.maxFileSize;
}
