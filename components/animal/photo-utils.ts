"use client";

/**
 * Compresión de fotos en el cliente con canvas: foto ~1024 px (WebP 0,8) y
 * miniatura cuadrada de 128 px. Si el navegador no sabe codificar WebP
 * (Safari antiguo devuelve PNG) se usa JPEG.
 */
async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* cae al <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}

function draw(
  src: CanvasImageSource,
  sw: number,
  sh: number,
  sx: number,
  sy: number,
  w: number,
  h: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  return c;
}

const MAX_CHARS = 850_000;

export async function compressPhoto(
  file: File,
): Promise<{ photo: string; thumb: string }> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen");
  const img = await loadImage(file);
  const { width: w0, height: h0 } = img;

  let max = 1024;
  let quality = 0.8;
  let photo = "";
  for (let i = 0; i < 4; i++) {
    const scale = Math.min(1, max / Math.max(w0, h0));
    const w = Math.round(w0 * scale);
    const h = Math.round(h0 * scale);
    photo = encode(draw(img, w0, h0, 0, 0, w, h), quality);
    if (photo.length <= MAX_CHARS) break;
    max = Math.round(max * 0.8);
    quality = Math.max(0.6, quality - 0.08);
  }
  if (photo.length > MAX_CHARS) throw new Error("La foto es demasiado grande");

  const side = Math.min(w0, h0);
  const thumb = encode(
    draw(img, side, side, (w0 - side) / 2, (h0 - side) / 2, 128, 128),
    0.75,
  );
  if ("close" in img && typeof img.close === "function") img.close();
  return { photo, thumb };
}
