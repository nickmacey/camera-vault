/**
 * Extracts the dominant color from an image URL
 * Returns HSL format for use with CSS custom properties
 */
export const extractDominantColor = async (imageUrl: string): Promise<string | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Resize to small size for faster processing
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Color frequency map
        const colorMap: { [key: string]: number } = {};
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent and very dark/light pixels
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          
          // Round to reduce color variations
          const rKey = Math.round(r / 10) * 10;
          const gKey = Math.round(g / 10) * 10;
          const bKey = Math.round(b / 10) * 10;
          const key = `${rKey},${gKey},${bKey}`;
          
          colorMap[key] = (colorMap[key] || 0) + 1;
        }
        
        // Find most frequent color
        let maxCount = 0;
        let dominantColor = '0,0,0';
        
        for (const [color, count] of Object.entries(colorMap)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        // Convert RGB to HSL
        const [r, g, b] = dominantColor.split(',').map(Number);
        const hsl = rgbToHsl(r, g, b);
        
        // Boost saturation for more vibrant UI
        const boostedSaturation = Math.min(hsl.s * 1.3, 80);
        
        resolve(`${hsl.h} ${boostedSaturation}% ${hsl.l}%`);
      };
      
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error extracting color:', error);
    return null;
  }
};

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Fallback gold color in HSL format
 */
export const FALLBACK_ACCENT = '45 100% 51%'; // vault-gold
