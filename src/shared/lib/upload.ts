import api from "./axios";

interface PresignResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

// Fallback untuk file yang tidak membawa Content-Type dari browser,
// mengikuti whitelist backend (dokumen: PDF/JPEG/PNG/DOC/DOCX, media: + MP4/MOV/AVI/WebM).
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  webm: "video/webm",
};

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "";
}

/**
 * Alur upload direct-to-R2: presign → PUT ke storage → confirm.
 *
 * Presign dan confirm memakai instance axios (cookie auth + refresh 401),
 * sedangkan PUT dikirim langsung ke storage TANPA credentials —
 * autentikasinya ada di tanda tangan URL presign.
 */
export async function uploadFile<R = unknown>(
  presignUrl: string,
  confirmUrl: string,
  presignPayload: Record<string, unknown>,
  confirmPayload: Record<string, unknown>,
  file: File,
): Promise<R> {
  const mimeType = resolveMimeType(file);
  if (!mimeType) {
    throw new Error(
      "Tipe file tidak dikenali. Format yang didukung: PDF, JPEG, PNG, DOC, DOCX" +
        " (media: tambahan MP4, MOV, AVI, WebM).",
    );
  }

  // 1. Presign — kirim metadata file (bukan file-nya) ke backend
  const presignRes = await api.post(presignUrl, {
    ...presignPayload,
    file_name: file.name,
    mime_type: mimeType,
    file_size_bytes: file.size,
  });
  const presign: PresignResult | undefined = presignRes.data?.data ?? presignRes.data;
  if (!presign?.uploadUrl || !presign?.objectKey) {
    throw new Error("Respons URL upload dari server tidak valid.");
  }

  // 2. PUT langsung ke storage — Content-Type WAJIB sama dengan mime_type saat presign
  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(
      `Gagal mengunggah file ke storage (HTTP ${putRes.status}). ` +
        "Pastikan CORS bucket storage sudah mengizinkan origin aplikasi ini.",
    );
  }

  // 3. Confirm — backend memverifikasi object di storage lalu membuat record DB
  const confirmRes = await api.post(confirmUrl, {
    ...confirmPayload,
    object_key: presign.objectKey,
    mime_type: mimeType,
  });
  return (confirmRes.data?.data ?? confirmRes.data) as R;
}
