import { WatermarkConfig } from "@/components/WatermarkStudio";

export const applyWatermarkToImage = async (
  imageUrl: string,
  config: WatermarkConfig
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply watermark
      ctx.save();
      ctx.globalAlpha = config.opacity / 100;
      ctx.fillStyle = config.color;
      ctx.font = `bold ${config.fontSize}px Arial`;

      const positions = getWatermarkPositions(canvas.width, canvas.height, config, ctx);
      
      positions.forEach(({ x, y, rotation }) => {
        ctx.save();
        ctx.translate(x, y);
        if (rotation) ctx.rotate(rotation);
        ctx.fillText(config.text, 0, 0);
        ctx.restore();
      });

      ctx.restore();

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const getWatermarkPositions = (
  width: number,
  height: number,
  config: WatermarkConfig,
  ctx: CanvasRenderingContext2D
) => {
  const padding = 40;
  const textMetrics = ctx.measureText(config.text);
  const textWidth = textMetrics.width;

  switch (config.position) {
    case "center":
      return [{ x: width / 2 - textWidth / 2, y: height / 2, rotation: 0 }];
    case "top-left":
      return [{ x: padding, y: padding + config.fontSize, rotation: 0 }];
    case "top-right":
      return [{ x: width - textWidth - padding, y: padding + config.fontSize, rotation: 0 }];
    case "bottom-left":
      return [{ x: padding, y: height - padding, rotation: 0 }];
    case "bottom-right":
      return [{ x: width - textWidth - padding, y: height - padding, rotation: 0 }];
    case "tiled":
      const positions = [];
      const spacing = 300;
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          positions.push({ x, y, rotation: -Math.PI / 6 });
        }
      }
      return positions;
    default:
      return [{ x: width / 2, y: height / 2, rotation: 0 }];
  }
};

export const downloadImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};