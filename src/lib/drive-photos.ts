import { google } from "googleapis";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
];

export interface PhotoSource {
  src: string;
  alt: string;
}

export async function getDrivePhotos(): Promise<PhotoSource[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!folderId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Drive] Missing env vars: GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
      );
    }
    return [];
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
      pageSize: 100,
      orderBy: "name",
    });

    const files = response.data.files ?? [];
    return files
      .filter(
        (f) =>
          f.id &&
          (IMAGE_MIME_TYPES.some((m) => f.mimeType?.startsWith(m)) ||
            /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(f.name ?? ""))
      )
      .map((f) => {
        const isHeic =
          f.mimeType?.toLowerCase().includes("heic") ||
          f.mimeType?.toLowerCase().includes("heif") ||
          /\.heic$/i.test(f.name ?? "");
        return {
          src: isHeic
            ? `/api/photo?id=${f.id}`
            : `https://drive.google.com/uc?export=view&id=${f.id}`,
          alt: f.name ?? f.id ?? "Photo",
        };
      });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Drive] Failed to fetch photos:", err);
    }
    return [];
  }
}
