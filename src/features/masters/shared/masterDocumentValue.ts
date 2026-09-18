export interface MasterDocumentPayload {
  name: string;
  url: string;
}

const DOCUMENT_MARKER = "__masterDocument";

export function encodeMasterDocumentValue(
  name: string,
  url: string,
): string {
  return JSON.stringify({
    [DOCUMENT_MARKER]: true,
    name: name.trim(),
    url: url.trim(),
  });
}

export function parseMasterDocumentValue(
  value: string | null | undefined,
): MasterDocumentPayload | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (
        parsed?.[DOCUMENT_MARKER] === true &&
        typeof parsed.url === "string" &&
        parsed.url.trim()
      ) {
        return {
          name:
            typeof parsed.name === "string" && parsed.name.trim()
              ? parsed.name.trim()
              : getFallbackDocumentName(parsed.url.trim()),
          url: parsed.url.trim(),
        };
      }
    } catch {
      // Fall through to raw URL handling.
    }
  }

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return {
      name: getFallbackDocumentName(trimmed),
      url: trimmed,
    };
  }

  const basename = getBasenameFromPath(trimmed);
  if (basename) {
    return {
      name: basename,
      url: trimmed,
    };
  }

  return null;
}

export function getMasterDocumentDisplayName(
  value: string | null | undefined,
  fallbackLabel = "Document",
): string {
  const parsed = parseMasterDocumentValue(value);
  if (parsed?.name) {
    return parsed.name;
  }

  if (!value?.trim()) {
    return "";
  }

  return getFallbackDocumentName(value.trim(), fallbackLabel);
}

export function getMasterDocumentUrl(
  value: string | null | undefined,
): string {
  const parsed = parseMasterDocumentValue(value);
  return parsed?.url ?? (typeof value === "string" ? value.trim() : "");
}

function getFallbackDocumentName(url: string, fallbackLabel = "Document") {
  const basename = getBasenameFromPath(url);
  if (basename && !basename.startsWith("data:")) {
    return basename;
  }

  const extension = getExtensionFromDataUrl(url);
  const safeLabel = fallbackLabel
    .replace(/\s+upload$/i, "")
    .replace(/[<>:"/\\|?*]+/g, "")
    .trim() || "Document";

  return `${safeLabel}${extension}`;
}

function getBasenameFromPath(value: string) {
  const cleanPath = (value.split("?")[0] ?? "").trim();
  if (!cleanPath || cleanPath.startsWith("data:")) {
    return "";
  }

  const segments = cleanPath.split(/[/\\]/).filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function getExtensionFromDataUrl(url: string) {
  const lower = url.toLowerCase();

  if (lower.startsWith("data:application/pdf") || lower.includes(".pdf")) {
    return ".pdf";
  }
  if (lower.startsWith("data:image/png") || lower.includes(".png")) {
    return ".png";
  }
  if (
    lower.startsWith("data:image/jpeg") ||
    lower.startsWith("data:image/jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".jpg")
  ) {
    return ".jpg";
  }
  if (lower.startsWith("data:image/webp") || lower.includes(".webp")) {
    return ".webp";
  }

  return "";
}
