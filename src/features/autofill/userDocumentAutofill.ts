import type { MasterUploadedFileValue } from "../masters/shared";

/** One shared placeholder image for dev autofill (Aadhaar + PAN). */
export const SAMPLE_IDENTITY_DOCUMENT_IMAGE_URL =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=720&q=80";

export function buildSampleIdentityDocumentUpload(
  fileName: string,
): MasterUploadedFileValue {
  return {
    name: fileName,
    mimeType: "image/jpeg",
    previewUrl: SAMPLE_IDENTITY_DOCUMENT_IMAGE_URL,
  };
}