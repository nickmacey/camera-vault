import heic2any from 'heic2any';

/**
 * Check if a file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  const extension = file.name.toLowerCase();
  return extension.endsWith('.heic') || extension.endsWith('.heif');
}

/**
 * Convert HEIC file to JPEG
 * Returns a new File object with the converted image
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file; // Return original if not HEIC
  }

  try {
    console.log(`[HEIC] Converting ${file.name} to JPEG...`);
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    // heic2any can return a single blob or array of blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create new file with .jpg extension
    const newFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const convertedFile = new File([blob], newFilename, {
      type: 'image/jpeg',
      lastModified: file.lastModified
    });

    console.log(`[HEIC] Successfully converted ${file.name} -> ${newFilename} (${(convertedFile.size / 1024).toFixed(1)}KB)`);
    return convertedFile;
  } catch (error) {
    console.error(`[HEIC] Failed to convert ${file.name}:`, error);
    throw new Error(`Failed to convert HEIC file: ${file.name}`);
  }
}

/**
 * Convert multiple HEIC files to JPEG with progress callback
 */
export async function convertHeicFiles(
  files: File[],
  onProgress?: (converted: number, total: number, currentFile: string) => void
): Promise<File[]> {
  const heicFiles = files.filter(isHeicFile);
  const nonHeicFiles = files.filter(f => !isHeicFile(f));
  
  if (heicFiles.length === 0) {
    return files; // No HEIC files to convert
  }

  console.log(`[HEIC] Converting ${heicFiles.length} HEIC files...`);
  
  const convertedFiles: File[] = [];
  
  for (let i = 0; i < heicFiles.length; i++) {
    const file = heicFiles[i];
    onProgress?.(i, heicFiles.length, file.name);
    
    try {
      const converted = await convertHeicToJpeg(file);
      convertedFiles.push(converted);
    } catch (error) {
      console.error(`[HEIC] Skipping ${file.name} due to conversion error`);
      // Skip failed conversions but continue with others
    }
  }

  onProgress?.(heicFiles.length, heicFiles.length, 'Complete');
  
  return [...nonHeicFiles, ...convertedFiles];
}
