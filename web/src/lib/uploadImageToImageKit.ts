import { apiFetch } from "./api.js";
import type { ImageKitAuthResponse } from "@ecommerce/shared";

// ImageKit's fixed upload API endpoint (it never changes per-account).
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

type UploadOptions = {
  folder?: string;
  fileName?: string;
};

type UploadResult = {
  url: string;
  fileId: string | null;
};

// Two-step upload: fetch signed auth from our backend, then POST the file directly to ImageKit.
// This keeps our private key server-side while still letting the browser stream the file without a proxy.
export async function uploadImageToImageKit(
  file: File,
  getToken: () => Promise<string | null>,
  opts: UploadOptions = {},
): Promise<UploadResult> {
  const { folder = "e-commerce", fileName } = opts;
  const auth = await apiFetch<ImageKitAuthResponse>("/api/admin/imagekit/auth", { getToken });

  // replace unsafe characters with _.
  // example: "my photo @ home.png" becomes "my_photo___home.png"
  const safeName =
    fileName ?? (file.name.replace(/[^\w.-]/g, "_").slice(0, 200) || `upload-${Date.now()}.jpg`);

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", safeName);
  form.append("publicKey", auth.publicKey);
  form.append("signature", auth.signature);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));
  form.append("folder", folder);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) {
    console.log("[ImageKit upload]", res.status, data);
    throw new Error("ImageKit upload failed");
  }

  if (!data.url) {
    console.log("[ImageKit upload] missing url in response", data);
    throw new Error("ImageKit upload failed");
  }

  return { url: data.url, fileId: data.fileId ?? null };
}
