import { PhotoProvider, PhotoProviderInterface } from '@/types/vault';
import { manualUploadProvider } from './manualUploadProvider';

// ═══════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════

const providerRegistry: Record<PhotoProvider, PhotoProviderInterface> = {
  manual_upload: manualUploadProvider,
  // Future providers will be added here
  google_photos: {
    name: 'Google Photos',
    id: 'google_photos',
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
      maxFileSize: 200 * 1024 * 1024,
      rateLimit: 10000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    }),
  },
  instagram: {
    name: 'Instagram',
    id: 'instagram',
    icon: '📱',
    description: 'Import from your Instagram account',
    getCapabilities: () => ({
      canRead: true,
      canWrite: true,
      hasMetadata: false,
      hasLocation: false,
      hasCameraData: false,
      supportsAlbums: true,
      requiresAuth: true,
      maxFileSize: 100 * 1024 * 1024,
      rateLimit: 5000,
      supportedFormats: ['image/jpeg', 'image/png']
    }),
  },
  apple_photos: {
    name: 'Apple Photos',
    id: 'apple_photos',
    icon: '🍎',
    description: 'Import from Apple Photos (iCloud)',
    getCapabilities: () => ({
      canRead: true,
      canWrite: false,
      hasMetadata: true,
      hasLocation: true,
      hasCameraData: true,
      supportsAlbums: true,
      requiresAuth: true,
      maxFileSize: 200 * 1024 * 1024,
      rateLimit: 10000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/heic']
    }),
  },
  dropbox: {
    name: 'Dropbox',
    id: 'dropbox',
    icon: '📦',
    description: 'Import from your Dropbox folders',
    getCapabilities: () => ({
      canRead: true,
      canWrite: false,
      hasMetadata: false,
      hasLocation: false,
      hasCameraData: false,
      supportsAlbums: false,
      requiresAuth: true,
      maxFileSize: 2 * 1024 * 1024 * 1024,
      rateLimit: 10000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
    }),
  },
  adobe_lightroom: {
    name: 'Adobe Lightroom',
    id: 'adobe_lightroom',
    icon: '🎨',
    description: 'Import from Adobe Lightroom Cloud',
    getCapabilities: () => ({
      canRead: true,
      canWrite: false,
      hasMetadata: true,
      hasLocation: true,
      hasCameraData: true,
      supportsAlbums: true,
      requiresAuth: true,
      maxFileSize: 500 * 1024 * 1024,
      rateLimit: 5000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/dng', 'image/tiff']
    }),
  },
  icloud: {
    name: 'iCloud Photos',
    id: 'icloud',
    icon: '☁️',
    description: 'Import from iCloud Photo Library',
    getCapabilities: () => ({
      canRead: true,
      canWrite: false,
      hasMetadata: true,
      hasLocation: true,
      hasCameraData: true,
      supportsAlbums: true,
      requiresAuth: true,
      maxFileSize: 200 * 1024 * 1024,
      rateLimit: 10000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/heic']
    }),
  },
};

// Get a specific provider
export function getProvider(providerId: PhotoProvider): PhotoProviderInterface {
  const provider = providerRegistry[providerId];
  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }
  return provider;
}

// Get all providers
export function getAllProviders(): PhotoProviderInterface[] {
  return Object.values(providerRegistry);
}

// Get only providers that require authentication
export function getConnectableProviders(): PhotoProviderInterface[] {
  return getAllProviders().filter(p => p.getCapabilities().requiresAuth);
}

// Get providers that don't require authentication
export function getDirectProviders(): PhotoProviderInterface[] {
  return getAllProviders().filter(p => !p.getCapabilities().requiresAuth);
}
