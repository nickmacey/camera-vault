// ═══════════════════════════════════════════════════════════
// VAULT TYPE DEFINITIONS & INTERFACES
// ═══════════════════════════════════════════════════════════

// Provider types
export type PhotoProvider = 
  | 'manual_upload'
  | 'google_photos'
  | 'instagram'
  | 'apple_photos'
  | 'dropbox'
  | 'adobe_lightroom'
  | 'icloud';

// Camera metadata
export interface CameraData {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
}

// Location metadata
export interface LocationData {
  latitude: number;
  longitude: number;
  placeName?: string;
  country?: string;
  city?: string;
}

// Standard photo format (all providers convert to this)
export interface StandardPhoto {
  // Identifiers
  id: string;                    // Vault's UUID
  externalId: string;           // Provider's ID (or filename for uploads)
  provider: PhotoProvider;      // Source type
  
  // URLs
  url: string;                  // Download URL
  thumbnailUrl: string;         // Preview
  sourceUrl?: string;           // Link back to original platform
  
  // File metadata
  filename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape' | 'square';
  
  // Dates
  dateTaken: Date;
  dateUploaded: Date;
  
  // Optional metadata
  camera?: CameraData;
  location?: LocationData;
  
  // Provider-specific extras (stored as JSON)
  providerMetadata: Record<string, any>;
}

// Provider capabilities
export interface ProviderCapabilities {
  canRead: boolean;              // Can fetch photos
  canWrite: boolean;             // Can post/update photos
  hasMetadata: boolean;          // Provides EXIF data
  hasLocation: boolean;          // Provides GPS data
  hasCameraData: boolean;        // Provides camera settings
  supportsAlbums: boolean;       // Has album/collection concept
  requiresAuth: boolean;         // Needs OAuth
  maxFileSize: number;          // Max upload size in bytes
  rateLimit?: number;           // Requests per hour/day
  supportedFormats: string[];   // ['image/jpeg', 'image/png', etc.]
}

// Filter options for photo fetching
export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  excludeScreenshots?: boolean;
  minFileSize?: number;          // Skip tiny files
  onlyCamera?: boolean;          // Skip non-camera photos
  orientation?: 'portrait' | 'landscape' | 'square';
  hasLocation?: boolean;
}

// OAuth result
export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  userId?: string;
}

// Photo provider interface
export interface PhotoProviderInterface {
  // Identity
  name: string;
  id: PhotoProvider;
  icon: string;
  description: string;
  
  // Capabilities
  getCapabilities(): ProviderCapabilities;
  
  // Connection (if requiresAuth)
  connect?(): Promise<AuthResult>;
  disconnect?(): Promise<void>;
  isConnected?(): boolean;
  refreshAuth?(): Promise<void>;
  
  // Data fetching
  getPhotoCount?(filters?: FilterOptions): Promise<number>;
  listPhotos?(filters?: FilterOptions): AsyncIterableIterator<StandardPhoto[]>;
  downloadPhoto?(externalId: string): Promise<Blob>;
  
  // Sync
  getNewPhotosSince?(date: Date): AsyncIterableIterator<StandardPhoto[]>;
  
  // Optional: Write operations
  publishPhoto?(photo: Blob, metadata: any): Promise<string>;
  updatePhoto?(externalId: string, edits: any): Promise<void>;
  deletePhoto?(externalId: string): Promise<void>;
}

// Sync job progress
export interface SyncJobProgress {
  total: number;
  processed: number;
  vaultWorthy: number;
  highValue: number;
  archived: number;
}

// Sync job
export interface SyncJob {
  id: string;
  userId: string;
  providerId: string;
  status: 'pending' | 'running' | 'paused' | 'complete' | 'failed';
  progress: SyncJobProgress;
  filters?: FilterOptions;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  error?: string;
}

// Photo scores from AI analysis
export interface PhotoScores {
  technical: number;
  commercial: number;
  artistic: number;
  emotional: number;
  overall: number;
  tier: 'vault-worthy' | 'high-value' | 'archive';
  analysis: string;
}

// User settings
export interface UserSettings {
  technical_weight: number;
  commercial_weight: number;
  artistic_weight: number;
  emotional_weight: number;
  tone: string;
  style: string;
  personality: string[];
  emoji_preference: string;
  auto_generate_captions: boolean;
  auto_analyze_uploads: boolean;
  notification_preferences: Record<string, boolean>;
}

// Social content
export interface SocialContent {
  title: string;
  captions: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
  altText: string;
}
