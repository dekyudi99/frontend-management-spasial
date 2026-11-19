const CLOUDFLARE_SAFE_BYTES = 95 * 1024 * 1024;
const UNCOMPRESSED_WARN_BYTES = 20 * 1024 * 1024;

/**
 * Inspect the 8-byte TIFF header and return endianness, magic version, and first IFD offset.
 * Returns null if header is not TIFF/BigTIFF.
 */
export function parseTiffHeader(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 8) return null;
  const view = new DataView(arrayBuffer);
  const b0 = view.getUint8(0);
  const b1 = view.getUint8(1);

  let littleEndian;
  if (b0 === 0x49 && b1 === 0x49) {
    littleEndian = true; // II
  } else if (b0 === 0x4d && b1 === 0x4d) {
    littleEndian = false; // MM
  } else {
    return null;
  }

  const version = view.getUint16(2, littleEndian);
  if (version === 43) {
    return { isTiff: true, isBigTiff: true, littleEndian, ifdOffset: 0 };
  }
  if (version !== 42) {
    return null;
  }

  const ifdOffset = view.getUint32(4, littleEndian);
  return { isTiff: true, isBigTiff: false, littleEndian, ifdOffset };
}

/**
 * Parse key tags from a TIFF IFD slice starting at offset 0 of `ifdBuffer`.
 */
export function parseTiffIfdTags(ifdBuffer, littleEndian) {
  const tags = {};
  if (!ifdBuffer || ifdBuffer.byteLength < 2) return tags;

  const view = new DataView(ifdBuffer);
  const entryCount = Math.min(view.getUint16(0, littleEndian), 250);

  for (let i = 0; i < entryCount; i++) {
    const pos = 2 + i * 12;
    if (pos + 12 > ifdBuffer.byteLength) break;

    const tag = view.getUint16(pos, littleEndian);
    const type = view.getUint16(pos + 2, littleEndian);
    const count = view.getUint32(pos + 4, littleEndian);

    if (type === 3 && count === 1) {
      tags[tag] = view.getUint16(pos + 8, littleEndian);
    } else if (type === 4 && count === 1) {
      tags[tag] = view.getUint32(pos + 8, littleEndian);
    } else {
      tags[tag] = true;
    }
  }
  return tags;
}

/**
 * Inspect a File object on the client side before upload and return English-default
 * validation status & messages (fatal errors vs non-blocking warnings).
 */
export async function validateSpatialFileForUpload(file, t = (_k, fallback) => fallback) {
  const messages = [];
  if (!file) return { status: "valid", messages };

  const name = String(file.name || "");
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  const size = Number(file.size || 0);

  if (size === 0) {
    messages.push({
      type: "error",
      text: t("valEmptyFile", "The selected file is empty (0 bytes) and cannot be processed."),
    });
    return { status: "error", messages };
  }

  if (size > CLOUDFLARE_SAFE_BYTES) {
    messages.push({
      type: "warning",
      text: t(
        "valFileTooLargeProxy",
        "File size exceeds ~95 MB. Uploads over 100 MB may fail or time out behind Cloudflare proxy; enable DEFLATE/LZW compression before uploading."
      ),
    });
  }

  if (ext === ".tif" || ext === ".tiff") {
    try {
      const headerBuf = await file.slice(0, 16).arrayBuffer();
      const header = parseTiffHeader(headerBuf);

      if (!header) {
        messages.push({
          type: "error",
          text: t(
            "valInvalidTiffHeader",
            "Invalid TIFF/GeoTIFF header. Ensure the file is a genuine GeoTIFF (not a renamed PNG or JPG)."
          ),
        });
        return { status: "error", messages };
      }

      if (header.isBigTiff) {
        messages.push({
          type: "error",
          text: t(
            "valBigTiffUnsupported",
            "BigTIFF (>4 GB / 64-bit TIFF) is not supported. Please export as a standard compressed GeoTIFF (DEFLATE or LZW)."
          ),
        });
        return { status: "error", messages };
      }

      if (header.ifdOffset >= 8 && header.ifdOffset < size) {
        const ifdSlice = await file.slice(header.ifdOffset, header.ifdOffset + 4096).arrayBuffer();
        const tags = parseTiffIfdTags(ifdSlice, header.littleEndian);

        const samplesPerPixel = typeof tags[277] === "number" ? tags[277] : 1;
        const photometric = typeof tags[262] === "number" ? tags[262] : null;
        const compression = typeof tags[259] === "number" ? tags[259] : null;
        const hasColorMap = Boolean(tags[320]) || photometric === 3;
        const hasGeoKeys = Boolean(tags[34735]) || Boolean(tags[33922]) || Boolean(tags[33550]);

        if (samplesPerPixel > 1 || photometric === 2) {
          messages.push({
            type: "warning",
            text: t(
              "valMultiBandTiff",
              "Multi-band / Rendered RGB GeoTIFF detected ({bands} bands). Raster styling & pixel stats only read Band 1; for analytical layers, export as Single-Band Raw Data.",
              { bands: samplesPerPixel }
            ),
          });
        } else if (hasColorMap) {
          messages.push({
            type: "warning",
            text: t(
              "valPalettedTiff",
              "Embedded Color Table (pre-styled palette) detected. Applying a custom style in AstraGIS will override the embedded colors."
            ),
          });
        }

        if (compression === 1 && size >= UNCOMPRESSED_WARN_BYTES) {
          messages.push({
            type: "warning",
            text: t(
              "valUncompressedTiff",
              "Uncompressed GeoTIFF detected. Re-exporting with DEFLATE or LZW compression will greatly reduce file size and speed up upload."
            ),
          });
        }

        if (Object.keys(tags).length > 0 && !hasGeoKeys) {
          messages.push({
            type: "warning",
            text: t(
              "valMissingGeoKeys",
              "No embedded GeoTIFF CRS metadata detected. Ensure a valid Coordinate Reference System (e.g. EPSG:4326 or UTM) is assigned before upload."
            ),
          });
        }
      }
    } catch (_err) {
      // Non-fatal: let backend validate if browser slice read fails
    }
  }

  const hasError = messages.some((m) => m.type === "error");
  const hasWarning = messages.some((m) => m.type === "warning");
  return {
    status: hasError ? "error" : hasWarning ? "warning" : "valid",
    messages,
  };
}
