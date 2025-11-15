export interface PhotoForGrid {
  url: string;
  filename: string;
}

export const generateSocialGrid = async (
  photos: PhotoForGrid[],
  gridSize: number = 3000
): Promise<Blob> => {
  // Take first 9 photos
  const gridPhotos = photos.slice(0, 9);
  
  if (gridPhotos.length === 0) {
    throw new Error("No photos available for grid");
  }

  // Create main canvas
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Fill with black background
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, gridSize, gridSize);

  const cellSize = gridSize / 3;
  const gap = 4; // Gap between images

  // Load and draw images
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Draw each photo in grid
  for (let i = 0; i < 9; i++) {
    const photo = gridPhotos[i % gridPhotos.length]; // Loop if less than 9 photos
    const row = Math.floor(i / 3);
    const col = i % 3;
    
    const x = col * cellSize + (col > 0 ? gap : 0);
    const y = row * cellSize + (row > 0 ? gap : 0);
    const width = cellSize - (col > 0 ? gap : 0) - (col < 2 ? gap : 0);
    const height = cellSize - (row > 0 ? gap : 0) - (row < 2 ? gap : 0);

    try {
      const img = await loadImage(photo.url);
      
      // Calculate dimensions to fill the cell (cover behavior)
      const imgAspect = img.width / img.height;
      const cellAspect = width / height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > cellAspect) {
        // Image is wider than cell
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller than cell
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      
      // Save context state
      ctx.save();
      
      // Create clipping region
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      
      // Draw image
      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
      
      // Restore context
      ctx.restore();
      
    } catch (error) {
      console.error(`Failed to load image ${i}:`, error);
      // Draw placeholder
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(x, y, width, height);
    }
  }

  // Add VAULT branding watermark on top-left cell
  const brandingX = gap;
  const brandingY = gap;
  const brandingPadding = 40;
  const brandingFontSize = 80;

  // Semi-transparent overlay
  const gradient = ctx.createLinearGradient(
    brandingX, 
    brandingY, 
    brandingX, 
    brandingY + cellSize * 0.4
  );
  gradient.addColorStop(0, 'rgba(10, 10, 10, 0.85)');
  gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(brandingX, brandingY, cellSize - gap, cellSize * 0.4);

  // VAULT text
  ctx.fillStyle = '#D4AF37';
  ctx.font = `900 ${brandingFontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('VAULT', brandingX + brandingPadding, brandingY + brandingPadding);

  // Subtitle
  ctx.fillStyle = '#E5E5E5';
  ctx.font = `600 ${brandingFontSize * 0.25}px "Inter", sans-serif`;
  ctx.fillText(
    'AI-CURATED COLLECTION', 
    brandingX + brandingPadding, 
    brandingY + brandingPadding + brandingFontSize + 10
  );

  // Bottom-right corner badge
  const badgeSize = 200;
  const badgeX = gridSize - badgeSize - 30;
  const badgeY = gridSize - badgeSize - 30;
  
  // Badge background
  ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 20);
  ctx.fill();
  
  // Badge border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 6;
  ctx.stroke();
  
  // Badge content
  ctx.fillStyle = '#D4AF37';
  ctx.font = `900 ${badgeSize * 0.3}px "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOP', badgeX + badgeSize / 2, badgeY + badgeSize * 0.35);
  ctx.fillText('9', badgeX + badgeSize / 2, badgeY + badgeSize * 0.65);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
};
