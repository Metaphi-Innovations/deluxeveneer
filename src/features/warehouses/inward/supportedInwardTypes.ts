import type { InwardInventoryType } from "../api/inwardApi";

/** Inventory tabs wired to the API inward flow (shared shell). */
export const API_SUPPORTED_INWARD_SLUGS = [
  "veneer-blocks",
  "raw-veneer",
  "plywood",
  "mdf",
  "consumables",
] as const;

export type ApiSupportedInwardSlug = (typeof API_SUPPORTED_INWARD_SLUGS)[number];

export function isApiSupportedInwardSlug(
  slug: string,
): slug is ApiSupportedInwardSlug {
  return (API_SUPPORTED_INWARD_SLUGS as readonly string[]).includes(slug);
}

export function inventoryTypeFromSlug(
  slug: string,
): InwardInventoryType | null {
  if (slug === "veneer-blocks") return "VENEER_BLOCKS";
  if (slug === "raw-veneer") return "RAW_VENEER";
  if (slug === "plywood") return "PLYWOOD";
  if (slug === "mdf") return "MDF";
  if (slug === "consumables") return "CONSUMABLES";
  return null;
}

export function slugFromInventoryTypeLabel(
  inventoryType: string | null | undefined,
): ApiSupportedInwardSlug {
  const normalized = (inventoryType ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");
  if (normalized === "raw veneer" || normalized === "raw-veneer") {
    return "raw-veneer";
  }
  if (normalized === "plywood") {
    return "plywood";
  }
  if (normalized === "mdf") {
    return "mdf";
  }
  if (normalized === "consumables" || normalized === "consumable") {
    return "consumables";
  }
  return "veneer-blocks";
}
