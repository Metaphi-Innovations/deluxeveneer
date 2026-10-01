import { getMasterDocumentUrl } from "../../masters/shared/masterDocumentValue";
import type { MasterFieldValue } from "../../masters/shared/types";

/**
 * Resolve an inward attachment field value into a persistable URL string.
 * File uploads are converted to data URLs (same approach as masters / QC).
 */
export async function resolveInwardAttachmentUrl(
  value: MasterFieldValue | undefined,
): Promise<string> {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return getMasterDocumentUrl(trimmed) || trimmed;
  }

  if (typeof value === "object" && !(value instanceof Date)) {
    const file =
      "file" in value && value.file instanceof File ? value.file : null;
    const existingName =
      "name" in value && typeof value.name === "string"
        ? value.name.trim()
        : "";
    const previewUrl =
      "previewUrl" in value && typeof value.previewUrl === "string"
        ? value.previewUrl.trim()
        : "";

    if (file) {
      return readFileAsDataUrl(file);
    }

    if (
      previewUrl.startsWith("data:") ||
      previewUrl.startsWith("http://") ||
      previewUrl.startsWith("https://")
    ) {
      return previewUrl;
    }

    if (previewUrl.startsWith("{")) {
      return getMasterDocumentUrl(previewUrl) || previewUrl;
    }

    if (previewUrl.startsWith("blob:")) {
      throw new Error("Please re-select the attachment file before saving.");
    }

    return getMasterDocumentUrl(existingName) || existingName;
  }

  return "";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result) {
        reject(new Error("Failed to read attachment file."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read attachment file."));
    };
    reader.readAsDataURL(file);
  });
}
