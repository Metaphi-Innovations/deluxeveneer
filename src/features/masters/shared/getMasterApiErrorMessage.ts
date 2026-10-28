const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function readErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error.trim();
  }

  if (error instanceof Error) {
    return error.message.trim();
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message.trim();
    }
  }

  return "";
}

function isNetworkError(error: unknown, message: string): boolean {
  const lower = message.toLowerCase();

  if (
    lower === "failed to fetch" ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound")
  ) {
    return true;
  }

  return error instanceof TypeError && /fetch|network/i.test(message);
}

/**
 * Maps API / backend failures to a short message the user can act on.
 * Already-clear backend copy (duplicates, validation, required fields) is kept.
 */
export function getMasterApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error == null || error === "") {
    return fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  ) {
    return fallback;
  }

  const message = readErrorMessage(error);
  if (!message) {
    return fallback;
  }

  const lower = message.toLowerCase();

  if (isNetworkError(error, message)) {
    return "Unable to connect to the server. Check your connection and try again.";
  }

  if (
    lower.includes("invalid authorization token") ||
    lower.includes("authorization token has expired") ||
    lower.includes("jwt expired") ||
    /request failed with status 401/.test(lower) ||
    (lower.includes("unauthorized") && !lower.includes("already"))
  ) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    lower.includes("forbidden") ||
    lower.includes("do not have permission") ||
    /request failed with status 403/.test(lower)
  ) {
    return "You do not have permission to perform this action.";
  }

  if (
    /cannot find .+ on this server/.test(lower) ||
    /request failed with status 404/.test(lower)
  ) {
    if (/not found/i.test(fallback) || /unable to load/i.test(fallback)) {
      return fallback;
    }
    return "This record could not be found.";
  }

  if (
    /with id ['"`]?[^\s'"`]+['"`]? not found/.test(lower) ||
    (/\bnot found\b/.test(lower) && (UUID_RE.test(message) || lower.includes("record"))) ||
    lower.endsWith(" not found") ||
    lower.endsWith(" not found.")
  ) {
    return /not found/i.test(fallback)
      ? fallback
      : "This record could not be found.";
  }

  if (lower.includes("already exists")) {
    return message;
  }

  if (/request failed with status 409/.test(lower)) {
    return "A record with this value already exists.";
  }

  if (/request failed with status 429/.test(lower)) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (/failed to (create|update|delete|save)/.test(lower) && UUID_RE.test(message)) {
    if (lower.includes("status")) {
      return "Unable to update status. Please try again.";
    }
    if (lower.includes("delete")) {
      return "Unable to delete this record. Please try again.";
    }
    return "Unable to save this record. Please try again.";
  }

  if (
    /request failed with status 5\d\d/.test(lower) ||
    /request failed with status 400/.test(lower) ||
    lower.includes("internal server error") ||
    lower.includes("something went wrong") ||
    lower.includes("database operation failed")
  ) {
    if (/request failed with status 400/.test(lower)) {
      return "Some details are invalid. Please check the form and try again.";
    }
    return "Something went wrong. Please try again.";
  }

  if (
    /^p\d{4}\b/i.test(message) ||
    lower.includes("prisma") ||
    message.includes("\n") ||
    message.length > 180 ||
    UUID_RE.test(message) ||
    /^request failed/i.test(message)
  ) {
    return fallback;
  }

  return message;
}
