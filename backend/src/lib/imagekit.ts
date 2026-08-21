import ImageKit, { NotFoundError } from "@imagekit/nodejs";
import { env } from "./env";

/** deletes an ImageKit file by `fileId` from our DB */
export async function deleteImageKitAsset(storedFileId: string | null) {
  if (!storedFileId) return;

  const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });

  try {
    await client.files.delete(storedFileId);
  } catch (e: unknown) {
    if (e instanceof NotFoundError) return;
    throw e;
  }
}
