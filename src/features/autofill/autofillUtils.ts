/** Pick first non-empty option; empty string if none (never invent dropdown values). */
export function pickFirstOption(
  options: readonly string[] | null | undefined,
): string {
  if (!options?.length) return "";
  for (const option of options) {
    const trimmed = String(option ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Only keep value when it exists in options (case-sensitive match used by ErpSelectField). */
export function coerceSelectValue(
  value: string | null | undefined,
  options: readonly string[] | null | undefined,
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || !options?.length) return "";
  return options.includes(trimmed) ? trimmed : "";
}