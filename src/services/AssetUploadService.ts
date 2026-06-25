import { ApiError } from "./ApiClient";

export class AssetUploadService {
  async uploadLogo(file: File): Promise<{ id: string; url: string }> {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new ApiError("Use a PNG, JPEG, or WebP logo.", 415);
    if (file.size > 2_000_000) throw new ApiError("Logo must be smaller than 2 MB.", 413);
    const response = await fetch("/api/assets/logo-upload", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": file.type },
      body: file
    });
    const data = await response.json() as { id?: string; url?: string; error?: string };
    if (!response.ok || !data.id || !data.url) throw new ApiError(data.error || "Logo upload failed.", response.status);
    return { id: data.id, url: data.url };
  }
}

export const assetUploadService = new AssetUploadService();
