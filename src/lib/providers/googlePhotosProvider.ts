import { PhotoProvider, PhotoProviderInterface } from '@/types/vault';

// ═══════════════════════════════════════════════════════════
// GOOGLE PHOTOS PROVIDER
// ═══════════════════════════════════════════════════════════

// Google Photos provider uses helper functions with userId
// The main provider object is for metadata/capabilities only
export const googlePhotosProvider: PhotoProviderInterface = {
  name: 'Google Photos',
  id: 'google_photos' as PhotoProvider,
  icon: '📷',
  description: 'Import from your Google Photos library',

  getCapabilities: () => ({
    canRead: true,
    canWrite: false,
    hasMetadata: true,
    hasLocation: true,
    hasCameraData: true,
    supportsAlbums: true,
    requiresAuth: true,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    rateLimit: 10000,
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff']
  })
};
