# Camera Vault — Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Design System](#design-system)
4. [Routing & Navigation](#routing--navigation)
5. [Authentication](#authentication)
6. [Database Schema](#database-schema)
7. [Storage](#storage)
8. [Edge Functions (Backend)](#edge-functions-backend)
9. [AI Integration](#ai-integration)
10. [Core Features](#core-features)
11. [Contexts & Global State](#contexts--global-state)
12. [Third-Party Integrations](#third-party-integrations)
13. [Key Components Reference](#key-components-reference)
14. [File Structure Overview](#file-structure-overview)
15. [Design Philosophy & UX Decisions](#design-philosophy--ux-decisions)

---

## Project Overview

**Camera Vault** (published at `camera-vault.lovable.app`) is an AI-powered photography platform that helps photographers organize, analyze, curate, and monetize their photos. The core value proposition:

1. **Upload photos** (manual drag-drop or Google Photos sync)
2. **AI analyzes every photo** using Anthropic Claude Vision, scoring across 4 dimensions (technical, commercial, artistic, emotional)
3. **Auto-curates into tiers** — Vault-Worthy (8.5+), Stars/High-Value (7.0–8.4), Gems/Archive (<7.0)
4. **AI acts as a quality gate** — photos below the user's configurable threshold are rejected at upload time, keeping only quality work in the vault
5. **Marketplace ecosystem** — print-on-demand partnerships, social sharing, AI-generated captions
6. **Personal storytelling** — "Through My Lens" AI profile analysis, highlight reel, music video creation with Spotify

The app is dark-themed with a luxury "vault" aesthetic (gold, black, emerald accents) using Bebas Neue for headings and Montserrat for body text.

---

## Architecture & Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom design tokens (HSL-based)
- **shadcn/ui** component library (all components in `src/components/ui/`)
- **Framer Motion** for animations
- **React Router DOM v6** for routing
- **TanStack React Query** for server state
- **Sonner** + **Radix Toast** for notifications
- **Fabric.js** for photo editing canvas
- **Three.js** / **React Three Fiber** for 3D vault door animation
- **Recharts** for data visualization

### Backend (Lovable Cloud / Supabase)
- **Supabase Auth** — email/password authentication
- **Supabase PostgreSQL** — data storage with Row Level Security
- **Supabase Storage** — photo file storage (3 buckets)
- **Supabase Edge Functions (Deno)** — serverless backend logic
- **Anthropic Claude API** — all AI features (photo analysis, search, social content, lens profiling)

### Key Libraries
- `exifr` — EXIF metadata extraction from photos
- `heic2any` — HEIC to JPEG conversion
- `browser-image-compression` — client-side image compression
- `jszip` — ZIP file creation for batch downloads
- `fabric` — Canvas-based photo editing
- `mapbox-gl` / `@googlemaps/js-api-loader` — map visualization

---

## Design System

### Color Palette (defined in `src/index.css`)
All colors use HSL format via CSS custom properties:

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `210 25% 8%` | Dark navy-black page background |
| `--foreground` | `210 15% 95%` | Primary text color |
| `--primary` / `--vault-gold` | `45 70% 52%` | Gold accent — primary brand color |
| `--accent` / `--vault-green` | `158 100% 50%` | Emerald green — success/positive |
| `--destructive` / `--vault-red` | `4 90% 58%` | Red — errors/warnings |
| `--card` | `210 20% 12%` | Card backgrounds |
| `--muted` | `210 20% 18%` | Subdued backgrounds |
| `--border` | `210 20% 20%` | Borders |

### Custom Vault Colors (Tailwind classes)
Defined in `tailwind.config.ts` under `vault.*`:
- `vault-gold`, `vault-green`, `vault-red`, `vault-black`, `vault-platinum`
- `vault-dark-gray`, `vault-mid-gray`, `vault-light-gray`
- `vault-dynamic` — dynamically set from top photo colors

### Score Colors
- `score-excellent` = gold (8.5+)
- `score-good` = green (7.0-8.4)
- `score-average` = amber (<7.0)
- `score-poor` = red

### Typography
- **Headings**: `Bebas Neue` (font-display) — tracking: 0.15em, weight 400
- **Body**: `Montserrat` (font-sans) — tracking: 0.05em
- **Mono**: `JetBrains Mono` (font-mono) — scores, data

### Animations (in tailwind.config.ts)
- `fade-in`, `scale-in`, `glow`, `float-up`, `lock-open`, `color-shift`
- `particle-explode`, `flash-burst`, `heartbeat`
- Custom CSS: `marquee`, `spin-slow`, `grain` (film grain overlay), `float` (particles)

### Utility Classes (in index.css)
- `.vault-glow-gold` / `.vault-glow-green` — box-shadow glows
- `.vault-text-gradient` — gold-to-green gradient text
- `.text-glow-gold` / `.text-vault-gold` — glowing gold text with text-shadow
- `.film-grain` — pseudo-element film grain texture overlay
- `.animate-glow` — pulsing brightness/drop-shadow

---

## Routing & Navigation

### Route Structure (in `App.tsx`)

| Path | Component | Auth Required | Description |
|------|-----------|--------------|-------------|
| `/` | `LandingPage` | No | Marketing landing page |
| `/auth` | `Auth` | No | Login/signup form |
| `/privacy` | `Privacy` | No | Privacy policy |
| `/terms` | `Terms` | No | Terms of service |
| `/story` | `HighlightReelPage` | Yes | Personal highlight reel — first page after login |
| `/app` | `Index` | Yes | Main dashboard (upload, gallery, settings) |
| `/app/vault` | `VaultPage` | Yes | Top-tier photos (8.5+ score) |
| `/app/stars` | `StarsPage` | Yes | High-value photos (7.0-8.4) |
| `/app/gems` | `GemsPage` | Yes | Archive photos (<7.0) |
| `/app/lens` | `LensPage` | Yes | AI photography profile |
| `/app/music` | `MusicPage` | Yes | Spotify music video creator |
| `/auth/google/callback` | `GoogleCallback` | No | Google Photos OAuth callback |

### Feature Navigation (`FeatureNav.tsx`)
A 6-button horizontal nav bar displayed on all authenticated pages:
1. **My Story** → `/story` (purple)
2. **My Lens** → `/app/lens` (cyan)
3. **Video Lab** → `/app/music` (green)
4. **My Vault** → `/app/vault` (gold/primary)
5. **Photo Lab** → `/app/stars` (amber)
6. **My Library** → `/app/gems` (blue)

### App Wrapper Structure
```
QueryClientProvider
  └─ TooltipProvider
      └─ UploadProvider (global upload state)
          └─ SpotifyPlayerProvider (global playback)
              └─ MusicSyncProvider (animation sync)
                  ├─ Toasters (toast + sonner)
                  ├─ FloatingUploadProgress
                  ├─ VaultDoorAnimation (intro 3D animation)
                  └─ BrowserRouter
                      ├─ PersistentSpotifyPlayer (global mini-player)
                      └─ Routes...
```

### Entry Animation
`VaultDoorAnimation` plays a 3D vault door opening animation (React Three Fiber) on every app load. Once complete, the main content fades in via `opacity-100` transition.

---

## Authentication

### Implementation (`src/pages/Auth.tsx`)
- **Email/password** authentication via Supabase Auth
- Form validation with **Zod** (email format, password ≥6 chars, name ≥2 chars)
- On signup: creates user in `auth.users`, which triggers `handle_new_user()` to auto-create a `profiles` row
- On login success: redirects to `/story`
- `AuthGuard` component wraps protected routes, redirects unauthenticated users to `/auth`

### Profile Creation Trigger
Database function `handle_new_user()` (SECURITY DEFINER):
```sql
INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
VALUES (new.id, COALESCE(new.raw_user_meta_data->>'first_name', 'User'), ...)
```

---

## Database Schema

### `profiles`
User profile data. Primary key = `auth.users.id`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | = auth user id |
| `first_name` | text (NOT NULL) | |
| `last_name` | text | Optional |
| `avatar_url` | text | Profile photo URL |
| `lens_profile` | jsonb | AI-generated photography profile (vision, archetype, etc.) |
| `lens_story` | text | "Through my lens..." first-person statement |
| `lens_updated_at` | timestamptz | When lens profile was last generated |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

**RLS**: Users can SELECT/INSERT/UPDATE own profile only. No DELETE.

### `photos`
Core photo table. Every uploaded photo gets a row.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid (NOT NULL) | Owner |
| `filename` | text (NOT NULL) | Original or AI-suggested filename |
| `storage_path` | text (NOT NULL) | Path in `photos` storage bucket |
| `edited_storage_path` | text | Path to edited version |
| `description` | text | AI-generated description |
| `ai_analysis` | text | AI commentary on the photo |
| **Scores** | | |
| `technical_score` | numeric | 0-10 sharpness/exposure/composition |
| `commercial_score` | numeric | 0-10 marketability |
| `artistic_score` | numeric | 0-10 creativity |
| `emotional_score` | numeric | 0-10 viewer engagement |
| `overall_score` | numeric | Weighted average of above |
| `score` | numeric | Legacy simple score from `analyze-photo` function |
| `tier` | text | `'vault-worthy'` / `'high-value'` / `'archive'` / null |
| `analyzed_at` | timestamptz | When AI analysis completed |
| **Metadata** | | |
| `file_size` | bigint | |
| `width` / `height` | integer | |
| `mime_type` | text | |
| `orientation` | text | |
| `date_taken` | timestamptz | From EXIF |
| `capture_date` | timestamptz | |
| `camera_data` | jsonb | EXIF camera info |
| `location_data` | jsonb | GPS coordinates (DMS or decimal) |
| `file_hash` | text | For duplicate detection |
| **Organization** | | |
| `is_favorite` | boolean | User-marked favorite |
| `is_featured` | boolean | Featured in carousel |
| `featured_order` | integer | |
| `is_hero` | boolean | Hero section photo |
| `hero_order` | integer | |
| `is_top_10` | boolean | In top 10 showcase |
| `is_highlight_reel` | boolean | In My Story highlight reel |
| `highlight_reel_order` | integer | |
| `highlight_reel_preset` | text | `'bw'` / `'color'` / `'film'` |
| `custom_tags` | text[] | User tags |
| `user_notes` | text | User annotations |
| **Social Content** | | |
| `social_title` | text | AI-generated SEO title |
| `instagram_caption` | text | |
| `twitter_caption` | text | |
| `linkedin_caption` | text | |
| `hashtags` | jsonb | `{ high: [...], medium: [...], niche: [...] }` |
| `alt_text` | text | Accessibility text |
| **Watermark** | | |
| `watermarked` | boolean | |
| `watermark_config` | jsonb | |
| `watermark_applied_at` | timestamptz | |
| **Source Tracking** | | |
| `provider` | text | `'manual_upload'` / `'google_photos'` |
| `provider_id` | uuid (FK) | → `connected_providers.id` |
| `external_id` | text | ID in source platform |
| `source_url` | text | Original URL |
| `provider_metadata` | jsonb | |
| `thumbnail_path` | text | |
| `status` | text | Default `'new'` |

**RLS**: Users can CRUD own photos. Featured photos (`is_featured = true`) are viewable by everyone (for public portfolio).

### `user_settings`
Per-user configuration for AI scoring and social content.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `user_id` | uuid (NOT NULL) | | |
| `technical_weight` | integer | 70 | Weight for scoring |
| `commercial_weight` | integer | 80 | |
| `artistic_weight` | integer | 60 | |
| `emotional_weight` | integer | 50 | |
| `vault_quality_threshold` | numeric | 7.0 | Minimum score to accept photo |
| `auto_analyze_uploads` | boolean | true | Auto-run AI on upload |
| `auto_generate_captions` | boolean | true | Auto-generate social captions |
| `tone` | text | `'poetic'` | Brand voice tone |
| `style` | text | `'observer'` | Brand voice style |
| `personality` | text[] | `['reflective']` | |
| `emoji_preference` | text | `'sparingly'` | |
| `notification_preferences` | jsonb | `{sync_complete: true, vault_worthy_found: true}` | |

**RLS**: Users can SELECT/INSERT/UPDATE own settings. No DELETE.

### `connected_providers`
OAuth connections to external services (Google Photos, Spotify).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | |
| `provider` | text | `'google_photos'` etc. |
| `display_name` | text | |
| `access_token` | text | OAuth token |
| `refresh_token` | text | |
| `token_expiry` | timestamptz | |
| `sync_enabled` | boolean | |
| `auto_sync_frequency` | text | `'daily'` / `'weekly'` / etc. |
| `photo_count` / `analyzed_count` / `vault_worthy_count` | integer | Sync stats |
| `last_sync` | timestamptz | |
| `settings` | jsonb | |

**RLS**: Users can manage (ALL) their own providers.

### `sync_jobs`
Tracks Google Photos sync operations.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | |
| `provider_id` | uuid (FK) | → `connected_providers.id` |
| `status` | text | `'pending'` / `'running'` / `'completed'` / `'failed'` |
| `total_photos` / `processed_photos` | integer | Progress tracking |
| `vault_worthy_found` / `high_value_found` / `archived_found` | integer | Results |
| `filters` | jsonb | Sync filters |
| `error_message` | text | |
| `retry_count` | integer | |
| `estimated_completion` | timestamptz | |

**RLS**: Users can manage (ALL) their own sync jobs.

### Database Functions & Triggers
1. `handle_new_user()` — Creates profile row on auth signup (SECURITY DEFINER)
2. `update_profile_updated_at()` — Auto-updates `profiles.updated_at`
3. `update_updated_at_column()` — Generic updated_at trigger

---

## Storage

### Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `photos` | No | Original uploaded photos (private, signed URLs) |
| `thumbnails` | Yes | Generated thumbnails |
| `avatars` | Yes | User profile photos |

Photos are accessed via **signed URLs** (typically 1-hour or 2-hour expiry) generated at display time.

---

## Edge Functions (Backend)

All edge functions are in `supabase/functions/`. All use Anthropic Claude unless noted.

### `analyze-photo-claude/index.ts`
**Purpose**: Deep 4-dimensional photo analysis with Claude Vision.

- **Input**: `{ imageBase64, userSettings? }`
- **Process**:
  1. Compresses image if >4MB (resize + JPEG quality 85) using `imagescript`
  2. Sends to Claude Sonnet 4 with vision prompt
  3. Claude returns: `{ technical, commercial, artistic, emotional, analysis }`
  4. Calculates weighted overall score using user's weight settings
  5. Determines tier: `vault-worthy` (≥8.5), `high-value` (≥7.0), `archive` (<7.0)
- **Output**: `{ technical_score, commercial_score, artistic_score, emotional_score, overall_score, tier, ai_analysis }`
- **API**: Anthropic Claude (`claude-sonnet-4-20250514`)

### `analyze-photo/index.ts`
**Purpose**: Simpler photo analysis for initial scoring (used at upload time).

- **Input**: `{ imageBase64, filename }` (requires auth)
- **Process**: Claude Vision analyzes and returns score (0-10), description, and suggested filename
- **Output**: `{ score, description, suggestedName }`
- **API**: Anthropic Claude (`claude-sonnet-4-20250514`)

### `ai-photo-search/index.ts`
**Purpose**: Semantic natural-language photo search.

- **Input**: `{ query, photoDescriptions: [{id, filename, description, score}], tier? }`
- **Process**: Sends photo list + user query to Claude, asks for matching IDs ranked by relevance
- **Output**: `{ matchingIds: string[] }` (max 20 results)
- **API**: Anthropic Claude (`claude-sonnet-4-20250514`)

### `generate-social-content/index.ts`
**Purpose**: AI-generated social media captions, hashtags, and titles.

- **Input**: `{ photoAnalysis, scores, brandVoice? }`
- **Process**: Claude generates platform-specific content matching user's brand voice settings
- **Output**: `{ title, captions: {instagram, twitter, linkedin}, hashtags: {high, medium, niche}, altText }`
- **API**: Anthropic Claude (`claude-sonnet-4-20250514`)

### `analyze-lens-profile/index.ts`
**Purpose**: Deep personality analysis of a photographer's style based on their collection.

- **Input**: Auth header (analyzes logged-in user's top 30 photos)
- **Process**:
  1. Fetches user's top 30 analyzed photos
  2. Claude analyzes patterns across vision, color, composition, emotion, subjects
  3. Generates comprehensive JSON profile with 7 sections
- **Output**: `{ lensProfile: { vision, visualSignature, emotionalLandscape, stories, throughTheirEyes, archetype, firstPersonStory } }`
- Saved to `profiles.lens_profile` and `profiles.lens_story`
- **API**: Anthropic Claude (`claude-sonnet-4-20250514`)

### `google-oauth-config/index.ts`
**Purpose**: Returns Google OAuth configuration for initiating the connection flow.

### `google-oauth-exchange/index.ts`
**Purpose**: Exchanges Google OAuth authorization code for access/refresh tokens.

### `google-photos-sync/index.ts`
**Purpose**: Syncs photos from connected Google Photos account into the vault.

### `auto-sync-scheduler/index.ts`
**Purpose**: Scheduled function to trigger automatic Google Photos syncs.

### `reverse-geocode/index.ts`
**Purpose**: Converts GPS coordinates from photo EXIF data into human-readable location names (for the My Story marquee).

### `spotify-api/index.ts`
**Purpose**: Proxy for Spotify Web API calls.

### `spotify-oauth-config/index.ts`
**Purpose**: Returns Spotify OAuth configuration.

### `spotify-oauth-callback/index.ts`
**Purpose**: Handles Spotify OAuth callback and token exchange.

---

## AI Integration

### All AI is Anthropic Claude
Every AI feature uses `claude-sonnet-4-20250514` via the Anthropic API directly (`https://api.anthropic.com/v1/messages`). The `ANTHROPIC_API_KEY` secret is configured in the backend.

### AI Features Summary

| Feature | Edge Function | What It Does |
|---------|--------------|-------------|
| Photo Scoring (deep) | `analyze-photo-claude` | 4-dimension scoring with weighted overall + tier assignment |
| Photo Scoring (quick) | `analyze-photo` | Simple 0-10 score + description at upload time |
| Semantic Search | `ai-photo-search` | Natural language photo search across user's library |
| Social Content | `generate-social-content` | Platform-specific captions, hashtags, alt text |
| Lens Profile | `analyze-lens-profile` | Photographer personality/style analysis from collection |

### Auto-Analysis System (`useAutoAnalyze.ts` hook)
- Watches for photos with `overall_score === null`
- Queues them for sequential analysis
- Processes one at a time: fetch signed URL → download → base64 → send to `analyze-photo-claude`
- Updates database with scores and tier
- Shows toast on completion
- Used on VAULT, STARS, and GEMS pages

---

## Core Features

### 1. Photo Upload (`PhotoUpload.tsx`)
- Drag-and-drop or file picker
- HEIC conversion support (via `heic2any`)
- Client-side image compression (via `browser-image-compression`)
- EXIF metadata extraction (camera, GPS, date)
- Duplicate detection via file hash
- AI analysis at upload time (configurable)
- Quality gate: photos below threshold score are rejected
- Progress tracking via `UploadContext` (floating progress indicator)

### 2. Photo Gallery (`PhotoGallery.tsx`)
- Grid display of all user photos
- Filter by tier, favorites, analyzed status
- Sort by score, date, filename
- Click to open detail modal
- Batch operations

### 3. Tiered Photo Pages

#### VAULT (`/app/vault` — `VaultPage.tsx`)
- Shows only `tier = 'vault-worthy'` photos (score ≥8.5)
- Features: select, edit, batch edit, download, AI search
- Sidebar: Print Partners (Mixtiles, Printful, Printify — "Coming Soon"), Social Sharing (Instagram, Pinterest, TikTok — "Coming Soon")
- Estimated monetary value per photo (via `photoValue.ts`)
- Auto-analyzes unscored photos in background

#### STARS (`/app/stars` — `StarsPage.tsx`)
- Shows `tier = 'high-value'` photos (score 7.0–8.4)
- Photo editing studio with single and batch editing
- "Promote to Vault" action (updates tier to `vault-worthy`)
- AI search
- Tips sidebar

#### GEMS (`/app/gems` — `GemsPage.tsx`)
- Shows `tier = 'archive'` or `null` photos
- "Promote to Stars" action
- "Recommended for Removal" section for photos below 5.5
- Bulk delete with storage cleanup
- AI search

### 4. Photo Editor (`PhotoEditor.tsx`)
- Canvas-based editing using Fabric.js
- Adjustments: brightness, contrast, saturation, blur, sharpness
- Presets (one-click looks)
- Saves edited version to separate `edited_storage_path`

### 5. Batch Photo Editor (`BatchPhotoEditor.tsx`)
- Apply same edits to multiple selected photos
- Available on VAULT and STARS pages

### 6. AI Photo Search (`AIPhotoSearch.tsx`)
- Search bar component used on VAULT, STARS, GEMS pages
- Sends photo descriptions + query to `ai-photo-search` edge function
- Returns filtered photo IDs for display
- Semantic search: "sunset photos", "people smiling", "landscapes", etc.

### 7. Social Content (`SocialContentModal.tsx`)
- Generate AI captions for Instagram, Twitter, LinkedIn
- Hashtag suggestions in 3 tiers (high-reach, medium, niche)
- SEO title for stock platforms
- Alt text for accessibility
- Respects user's brand voice settings (tone, style, personality, emoji preference)

### 8. Through My Lens (`ThroughMyLens.tsx`, `/app/lens`)
- AI-generated photographer personality profile
- Analyzes top 30 photos to determine:
  - Vision narrative (poetic description of their photography style)
  - Visual signature (colors, compositions, lighting, subjects)
  - Emotional landscape
  - Recurring story themes
  - Photographer archetype (e.g., "The Quiet Observer")
  - First-person 3-sentence statement
- Results saved to `profiles.lens_profile`

### 9. My Story / Highlight Reel (`/story` — `HighlightReelPage.tsx`)
- First page users see after login
- Animated photo showcase in 3 aesthetic groups:
  - **Black & White** — `grayscale(100%) contrast(1.1)`
  - **Vibrant/Color** — `saturate(1.3) contrast(1.05) brightness(1.02)`
  - **Film** — `sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)`
- Rolling marquee with location names from photo GPS data (reverse geocoded)
- Landscape carousel
- "My Story" section with editable personal photography statement
- Print shop section
- Customizable via `HighlightReelManager` (select which photos, assign presets)
- Music sync controls for Spotify integration

### 10. My Story Section (`MyStorySection.tsx`)
- Editable "Through My Lens" personal statement
- Loads from `profiles.lens_story`
- Edit mode with textarea, character count (max 500), save/cancel
- Falls back to default text if no story saved

### 11. Watermark Studio (`WatermarkStudio.tsx`)
- Custom watermark creation
- Apply to individual or batch photos
- Configuration saved to `watermark_config` per photo

### 12. Settings (in `Index.tsx`, Settings tab)
- **Profile**: User info, avatar upload (`UserProfile.tsx`, `ProfilePhotoUpload.tsx`)
- **Scoring**: Weight sliders for each dimension, vault quality threshold, presets (Stock, Art, Social, Personal, Default)
- **Brand Voice**: Tone (poetic/professional/casual/technical), personality traits, emoji preference
- **Auto-Sync**: Google Photos sync settings (`AutoSyncSettings.tsx`)
- **Carousel**: Featured photos manager (`FeaturedPhotosManager.tsx`)

### 13. Dynamic Hero (`DynamicHero.tsx`)
- Animated hero section on main `/app` page
- Uses dynamic accent color extracted from top photos

### 14. Stats Bar (`StatsBar.tsx`)
- Displays photo statistics (counts, scores, tiers)

### 15. Top 10 Showcase (`Top10Showcase.tsx`)
- Featured display of user's 10 best photos

---

## Contexts & Global State

### `UploadContext.tsx`
- Tracks upload progress across the app
- `FloatingUploadProgress.tsx` shows a floating indicator during uploads
- Persists across page navigation

### `SpotifyPlayerContext.tsx`
- Global Spotify Web Playback SDK state
- Manages track selection, playback control, device ID
- `PersistentSpotifyPlayer.tsx` displays:
  - Full player on Video Lab page
  - Compact mini-player on other pages
  - Native controls: play/pause, progress bar, volume

### `MusicSyncContext.tsx`
- Syncs animation speeds to Spotify playback
- Provides `getAdjustedDuration()` to scale animation timings
- `pulseEnabled` state for beat-reactive effects
- `MusicSyncControls.tsx` — UI to toggle sync and pulse

---

## Third-Party Integrations

### Google Photos
- OAuth connection flow via edge functions
- Sync photos from Google Photos library into vault
- Auto-sync scheduler with configurable frequency
- Stored in `connected_providers` table

### Spotify
- OAuth connection for music playback
- Web Playback SDK (requires Premium account)
- Scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`, `playlist-read-private`, `user-library-read`
- Music video creation from vault photos + Spotify tracks
- Persistent player across all pages

### Print Partners (Planned)
- Mixtiles, Printful, Printify — marked as "Coming Soon"
- Infrastructure in place in VaultPage sidebar

### Social Platforms (Planned)
- Instagram, Pinterest, TikTok sharing — marked as "Coming Soon"
- AI-generated content ready for each platform

---

## Key Components Reference

### Layout & Navigation
| Component | File | Purpose |
|-----------|------|---------|
| `FeatureNav` | `src/components/FeatureNav.tsx` | 6-button nav bar across all pages |
| `AuthGuard` | `src/components/AuthGuard.tsx` | Route protection wrapper |
| `Logo` | `src/components/Logo.tsx` | Brand logo (icon/wordmark variants) |
| `VaultDoorAnimation` | `src/components/VaultDoorAnimation.tsx` | 3D vault opening animation |
| `LogoLoadingScreen` | `src/components/LogoLoadingScreen.tsx` | Loading state |

### Photo Management
| Component | File | Purpose |
|-----------|------|---------|
| `PhotoUpload` | `src/components/PhotoUpload.tsx` | Upload interface |
| `PhotoGallery` | `src/components/PhotoGallery.tsx` | Main gallery grid |
| `PhotoCard` | `src/components/PhotoCard.tsx` | Individual photo card |
| `PhotoDetailModal` | `src/components/PhotoDetailModal.tsx` | Full photo view modal |
| `PhotoFilterBar` | `src/components/PhotoFilterBar.tsx` | Gallery filters |
| `PhotoEditor` | `src/components/PhotoEditor.tsx` | Canvas-based editor |
| `BatchPhotoEditor` | `src/components/BatchPhotoEditor.tsx` | Multi-photo editor |
| `BatchEditModal` | `src/components/BatchEditModal.tsx` | Batch edit dialog |
| `BulkUpload` | `src/components/BulkUpload.tsx` | Bulk upload interface |
| `OptimizedImage` | `src/components/OptimizedImage.tsx` | Lazy-loaded image |
| `Lightbox` | `src/components/Lightbox.tsx` | Fullscreen photo view |

### AI & Analysis
| Component | File | Purpose |
|-----------|------|---------|
| `AIPhotoSearch` | `src/components/AIPhotoSearch.tsx` | Semantic search bar |
| `AnalysisLoadingOverlay` | `src/components/AnalysisLoadingOverlay.tsx` | Loading during analysis |
| `AnimatedScoreBar` | `src/components/AnimatedScoreBar.tsx` | Animated score display |
| `ScoreBadge` | `src/components/ScoreBadge.tsx` | Score indicator badge |
| `StoryLensSection` | `src/components/StoryLensSection.tsx` | Lens profile display |
| `ThroughMyLens` | `src/components/ThroughMyLens.tsx` | Full lens profile page |

### Social & Sharing
| Component | File | Purpose |
|-----------|------|---------|
| `SocialContentModal` | `src/components/SocialContentModal.tsx` | AI caption generator |
| `SocialShareDialog` | `src/components/SocialShareDialog.tsx` | Share dialog |
| `WatermarkStudio` | `src/components/WatermarkStudio.tsx` | Watermark creator |
| `PrintShopSection` | `src/components/PrintShopSection.tsx` | Print partner links |

### Story & Presentation
| Component | File | Purpose |
|-----------|------|---------|
| `MyStorySection` | `src/components/MyStorySection.tsx` | Editable personal statement |
| `LandscapeCarousel` | `src/components/LandscapeCarousel.tsx` | Wide photo carousel |
| `HighlightReelManager` | `src/components/HighlightReelManager.tsx` | Customize highlight reel |
| `InspirationalQuote` | `src/components/InspirationalQuote.tsx` | Quote display |
| `CategoryShowcase` | `src/components/CategoryShowcase.tsx` | Tier category cards |
| `EditorialGrid` | `src/components/EditorialGrid.tsx` | Magazine-style grid |
| `Top10Showcase` | `src/components/Top10Showcase.tsx` | Top photos display |
| `DynamicHero` | `src/components/DynamicHero.tsx` | Animated hero section |
| `HeroSection` | `src/components/HeroSection.tsx` | Static hero |

### Music & Spotify
| Component | File | Purpose |
|-----------|------|---------|
| `SpotifyConnect` | `src/components/SpotifyConnect.tsx` | Spotify OAuth button |
| `PersistentSpotifyPlayer` | `src/components/PersistentSpotifyPlayer.tsx` | Global music player |
| `MusicSyncControls` | `src/components/MusicSyncControls.tsx` | Animation sync toggles |
| `MusicVideoCreator` | `src/components/MusicVideoCreator.tsx` | Video creation tool |

### Settings & Profile
| Component | File | Purpose |
|-----------|------|---------|
| `UserProfile` | `src/components/UserProfile.tsx` | Profile editor |
| `ProfilePhotoUpload` | `src/components/ProfilePhotoUpload.tsx` | Avatar upload |
| `AutoSyncSettings` | `src/components/AutoSyncSettings.tsx` | Google sync config |
| `FeaturedPhotosManager` | `src/components/FeaturedPhotosManager.tsx` | Carousel photo selector |
| `HeroPhotosManager` | `src/components/HeroPhotosManager.tsx` | Hero photo selector |
| `SignupPromptModal` | `src/components/SignupPromptModal.tsx` | Prompt unauthenticated users |

---

## Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| `useAutoAnalyze` | `src/hooks/useAutoAnalyze.ts` | Auto-queue and process unanalyzed photos |
| `useTop10Photos` | `src/hooks/useTop10Photos.ts` | Fetch top 10 photos + extract dynamic accent color |
| `usePhotoStats` | `src/hooks/usePhotoStats.ts` | Aggregate photo statistics |
| `useBatchPhotoEdit` | `src/hooks/useBatchPhotoEdit.ts` | Batch editing state management |
| `useSpotifyWebPlayback` | `src/hooks/useSpotifyWebPlayback.ts` | Spotify SDK integration |
| `use-mobile` | `src/hooks/use-mobile.tsx` | Mobile breakpoint detection |
| `use-toast` | `src/hooks/use-toast.ts` | Toast notification hook |

---

## Utility Libraries

| Library | File | Purpose |
|---------|------|---------|
| `photoValue.ts` | `src/lib/photoValue.ts` | Estimate monetary value from photo score |
| `photoLayout.ts` | `src/lib/photoLayout.ts` | Gallery layout calculations |
| `colorExtractor.ts` | `src/lib/colorExtractor.ts` | Extract dominant colors from photos |
| `fileHash.ts` | `src/lib/fileHash.ts` | SHA-256 hash for duplicate detection |
| `heicConverter.ts` | `src/lib/heicConverter.ts` | HEIC → JPEG conversion |
| `imageOptimization.ts` | `src/lib/imageOptimization.ts` | Client-side compression/resize |
| `watermark.ts` | `src/lib/watermark.ts` | Watermark application logic |
| `socialGridGenerator.ts` | `src/lib/socialGridGenerator.ts` | Social media grid layouts |
| `soundGenerator.ts` | `src/lib/soundGenerator.ts` | UI sound effects |
| `spotify.ts` | `src/lib/spotify.ts` | Spotify API helpers |
| `googlePhotos.ts` | `src/lib/googlePhotos.ts` | Google Photos API helpers |
| `utils.ts` | `src/lib/utils.ts` | General utilities (cn, etc.) |

### Provider System (`src/lib/providers/`)
- `providerRegistry.ts` — Registry for photo source providers
- `googlePhotosProvider.ts` — Google Photos integration
- `manualUploadProvider.ts` — Direct upload handling

---

## Design Philosophy & UX Decisions

### Visual Identity
- **Luxury vault aesthetic**: Dark backgrounds, gold accents, emerald highlights
- **Cinematic presentation**: Film grain overlays, gentle floating animations, dramatic glow effects
- **Photography-first**: Every design choice emphasizes the photos as the centerpiece

### User Flow
1. **Landing page** → Sign up
2. **My Story** (`/story`) — emotional first impression, personal highlight reel
3. **Main Dashboard** (`/app`) — upload, manage, configure
4. **Tier pages** — curate and edit at each quality level
5. **Lens Profile** — discover your photographic identity
6. **Video Lab** — create music-paired content

### AI as Curator
The AI doesn't just analyze — it **curates**. Photos below the quality threshold are rejected at upload, keeping the vault clean. This positions the app as a quality-focused tool, not just another photo storage service.

### Tier System
The 3-tier system (Vault > Stars > Gems) creates a natural progression:
- **VAULT** = Portfolio-ready, monetizable assets
- **STARS** = Good photos that could be elevated with editing
- **GEMS** = Archive/everyday photos, with low-quality flagged for deletion

### Music Integration
Spotify integration transforms the app from a photo manager into a **personal media experience**. The music sync feature ties animation speeds to playback, creating an immersive "visual album" feel on the My Story page.

---

## Secrets & Environment Variables

### Backend Secrets (Edge Functions)
| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | All AI features (Claude API) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback |
| `SPOTIFY_CLIENT_ID` | Spotify OAuth |
| `SPOTIFY_CLIENT_SECRET` | Spotify OAuth |
| `LOVABLE_API_KEY` | Lovable gateway (no longer used for AI, still available) |
| `VITE_GOOGLE_CLIENT_ID` | Google client ID (frontend) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps (frontend) |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify client ID (frontend) |
| `SITE_URL` | Base URL for OAuth redirects |

### Frontend Environment (`.env`)
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

---

## Known "Coming Soon" Features
- Print partner integrations (Mixtiles, Printful, Printify)
- Social platform sharing (Instagram, Pinterest, TikTok)
- AI one-click enhancement
- Download functionality in Vault
- Advanced analytics/insights
