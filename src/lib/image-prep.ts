const MAX_EDGE_PX = 1024;

export function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export async function fileToJpegBlob(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  return Array.isArray(result) ? result[0] : (result as Blob);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

// Downscaling speeds up detection and avoids mobile memory spikes.
export function downscale(img: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function fileToCanvas(
  file: File
): Promise<{ canvas: HTMLCanvasElement; objectUrl: string }> {
  const blob = await fileToJpegBlob(file);
  const objectUrl = URL.createObjectURL(blob);
  const img = await loadImage(objectUrl);
  return { canvas: downscale(img), objectUrl };
}
