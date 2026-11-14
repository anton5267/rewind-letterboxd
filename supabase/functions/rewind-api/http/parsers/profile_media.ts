import type { ProfileMediaUpload } from "../../contracts/profile_media.ts";
import { RewindApiError } from "../errors.ts";

export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PROFILE_IMAGE_MAX_DIMENSION = 4096;

function dimensions(
  bytes: Uint8Array,
  contentType: string,
): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    contentType === "image/png" && bytes.length >= 45 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) =>
      bytes[index] === value
    ) &&
    view.getUint32(8) === 13 && view.getUint32(12) === 0x49484452 &&
    view.getUint32(bytes.length - 8) === 0x49454e44
  ) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (
    contentType === "image/jpeg" && bytes.length >= 12 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9
  ) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9 || offset + 2 > bytes.length) {
        break;
      }
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      const isFrame = [
        0xc0,
        0xc1,
        0xc2,
        0xc3,
        0xc5,
        0xc6,
        0xc7,
        0xc9,
        0xca,
        0xcb,
        0xcd,
        0xce,
        0xcf,
      ].includes(marker);
      if (isFrame && length >= 8) {
        return {
          width: view.getUint16(offset + 5),
          height: view.getUint16(offset + 3),
        };
      }
      offset += length;
    }
  }
  throw new RewindApiError(400, "Invalid image data");
}

export function validateProfileImage(
  bytes: Uint8Array,
  contentType: string,
): ProfileMediaUpload {
  if (contentType !== "image/jpeg" && contentType !== "image/png") {
    throw new RewindApiError(415, "Use a JPEG or PNG image");
  }
  if (bytes.length > PROFILE_IMAGE_MAX_BYTES) {
    throw new RewindApiError(413, "Image exceeds 2 MB");
  }
  const size = dimensions(bytes, contentType);
  if (
    size.width < 1 || size.height < 1 ||
    size.width > PROFILE_IMAGE_MAX_DIMENSION ||
    size.height > PROFILE_IMAGE_MAX_DIMENSION
  ) {
    throw new RewindApiError(
      400,
      "Image dimensions must be between 1 and 4096 pixels",
    );
  }
  return {
    bytes,
    contentType,
    extension: contentType === "image/png" ? "png" : "jpg",
    ...size,
  };
}

export async function readProfileImage(
  request: Request,
): Promise<ProfileMediaUpload> {
  const contentType =
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() ??
      "";
  if (contentType !== "image/jpeg" && contentType !== "image/png") {
    throw new RewindApiError(415, "Use a JPEG or PNG image");
  }
  if (Number(request.headers.get("Content-Length")) > PROFILE_IMAGE_MAX_BYTES) {
    throw new RewindApiError(413, "Image exceeds 2 MB");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RewindApiError(400, "An image is required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > PROFILE_IMAGE_MAX_BYTES) {
        await reader.cancel();
        throw new RewindApiError(413, "Image exceeds 2 MB");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return validateProfileImage(bytes, contentType);
}
