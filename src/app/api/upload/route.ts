import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { requireAuth, canAccessClient } from "@/lib/auth/permissions";
import { apiError, apiSuccess } from "@/lib/utils";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/x-m4a",
  "audio/mp4",
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];
const MAX_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_IMAGE_DIMENSION = 2000; // px, sisi terpanjang — cukup untuk hero/gallery di layar mobile & retina

export async function POST(req: Request) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;

    if (!file || !file.size) return apiError("File diperlukan");
    if (!clientId) return apiError("clientId diperlukan");

    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Format tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau MP3/OGG/WAV.");
    }

    if (file.size > MAX_SIZE) {
      return apiError("Ukuran file terlalu besar. Maksimal 30MB.");
    }

    let ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    let buffer: Buffer = Buffer.from(await file.arrayBuffer());

    // GIF dilewati biar animasinya tidak hilang; format gambar lain di-resize & dikompres ke WebP.
    if (ALLOWED_IMAGE_TYPES.includes(file.type) && file.type !== "image/gif") {
      buffer = await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
      ext = "webp";
    }

    const filename = `${nanoid(12)}.${ext}`;

    const uploadDir = join(process.cwd(), "public", "uploads", clientId);
    await mkdir(uploadDir, { recursive: true });

    await writeFile(join(uploadDir, filename), buffer);

    return apiSuccess({ url: `/uploads/${clientId}/${filename}` });
  } catch (err) {
    console.error("[upload]", err);
    return apiError("Gagal mengupload file", 500);
  }
}
