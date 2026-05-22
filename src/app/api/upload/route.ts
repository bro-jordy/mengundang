import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
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

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${nanoid(12)}.${ext}`;

    const uploadDir = join(process.cwd(), "public", "uploads", clientId);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));

    return apiSuccess({ url: `/uploads/${clientId}/${filename}` });
  } catch (err) {
    console.error("[upload]", err);
    return apiError("Gagal mengupload file", 500);
  }
}
