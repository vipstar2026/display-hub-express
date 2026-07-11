/**
 * Process an uploaded product image:
 * - Fits it inside a square canvas (default 1000×1000)
 * - Centers on a transparent/white bg, preserving aspect
 * - Re-encodes to JPEG (quality 0.9) for consistent card display
 */
export async function processProductImage(
  file: File,
  size = 1000,
): Promise<{ blob: Blob; width: number; height: number; originalW: number; originalH: number }> {
  const bitmap = await createImageBitmap(file);
  const originalW = bitmap.width;
  const originalH = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // solid neutral background so PNGs with transparency still look clean on cards
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, size, size);

  // contain-fit
  const scale = Math.min(size / originalW, size / originalH);
  const w = originalW * scale;
  const h = originalH * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, x, y, w, h);
  bitmap.close?.();

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.9),
  );
  return { blob, width: size, height: size, originalW, originalH };
}
