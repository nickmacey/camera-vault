/**
 * Generate SHA-256 hash of a file for duplicate detection
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if a file hash already exists in the database for the current user
 */
export async function checkDuplicateHash(
  supabase: any,
  userId: string,
  fileHash: string
): Promise<{ isDuplicate: boolean; existingPhoto?: any }> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, filename, created_at, storage_path')
    .eq('user_id', userId)
    .eq('file_hash', fileHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking duplicate:', error);
    return { isDuplicate: false };
  }

  return {
    isDuplicate: !!data,
    existingPhoto: data,
  };
}
