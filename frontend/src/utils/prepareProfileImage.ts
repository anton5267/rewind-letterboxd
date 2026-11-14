const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 4096;

export class ProfileImageError extends Error {
  constructor(readonly reason: "format" | "dimensions" | "size") {
    super(reason);
  }
}

function imageDimensions(bytes: Uint8Array, type: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    type === "image/png" && bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) =>
      bytes[index] === value
    )
  ) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (
    type === "image/jpeg" && bytes.length >= 12 && bytes[0] === 0xff &&
    bytes[1] === 0xd8
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
      if (
        [
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
        ].includes(marker) && length >= 8
      ) {
        return {
          width: view.getUint16(offset + 5),
          height: view.getUint16(offset + 3),
        };
      }
      offset += length;
    }
  }
  throw new ProfileImageError("format");
}

export async function prepareProfileImage(file: File): Promise<Blob> {
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    throw new ProfileImageError("format");
  }
  if (file.size > MAX_BYTES) throw new ProfileImageError("size");
  const size = imageDimensions(
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );
  if (
    size.width < 1 || size.height < 1 || size.width > MAX_DIMENSION ||
    size.height > MAX_DIMENSION
  ) {
    throw new ProfileImageError("dimensions");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ProfileImageError("format");
  }
  const canvas = document.createElement("canvas");
  let width = bitmap.width;
  let height = bitmap.height;
  try {
    // Re-encoding also removes the original file's EXIF and ancillary metadata.
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt === 4) {
        const scale = Math.min(1, 512 / Math.max(width, height));
        width = Math.max(1, Math.floor(width * scale));
        height = Math.max(1, Math.floor(height * scale));
      }
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new ProfileImageError("format");
      context.drawImage(bitmap, 0, 0, width, height);
      const output = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, file.type, 0.9)
      );
      if (!output) throw new ProfileImageError("format");
      if (output.size <= MAX_BYTES) return output;
      const scale = Math.min(0.9, Math.sqrt(MAX_BYTES / output.size) * 0.9);
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
    }
    throw new ProfileImageError("size");
  } finally {
    bitmap.close();
    canvas.width = canvas.height = 1;
  }
}
