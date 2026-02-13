import { readdir } from "fs/promises";
import path from "path";
import { getDrivePhotos, type PhotoSource } from "./drive-photos";

const PHOTO_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|heic)$/i;

export async function getPhotos(): Promise<PhotoSource[]> {
  // Prefer Google Drive if configured
  const drivePhotos = await getDrivePhotos();
  if (drivePhotos.length > 0) {
    return drivePhotos;
  }

  // Fall back to local photos folder
  const photosDir = path.join(process.cwd(), "public", "photos");
  try {
    const files = await readdir(photosDir);
    return files
      .filter((f) => PHOTO_EXTENSIONS.test(f))
      .map((f) => ({ src: `/photos/${f}`, alt: f }));
  } catch {
    return [];
  }
}
