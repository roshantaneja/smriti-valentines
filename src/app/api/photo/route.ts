import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return NextResponse.json({ error: "Drive not configured" }, { status: 503 });
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

    // Get file metadata to check mimeType
    const meta = await drive.files.get({
      fileId: id,
      fields: "mimeType",
    });
    const mimeType = meta.data.mimeType?.toLowerCase() ?? "";

    const response = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "arraybuffer" }
    );

    let buffer = Buffer.from(response.data as ArrayBuffer);
    let contentType = "image/jpeg";

    // Convert HEIC to JPEG server-side (Drive blocks client fetch via CORS)
    if (mimeType.includes("heic") || mimeType.includes("heif")) {
      try {
        const jpegBuffer = await convert({
          buffer,
          format: "JPEG",
          quality: 0.9,
        });
        buffer = Buffer.from(jpegBuffer as ArrayBuffer);
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        return NextResponse.json(
          { error: "Failed to convert HEIC" },
          { status: 500 }
        );
      }
    } else {
      contentType =
        meta.data.mimeType || (response.headers["content-type"] as string) || "image/jpeg";
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Photo fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
