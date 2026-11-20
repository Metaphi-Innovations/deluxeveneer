import { apiRequest, type ApiResponse } from "../../../lib/apiClient";

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_TOKEN_STORAGE_KEY = "deluxe-veneers-erp-token";

export interface UserBulkImportRowResult {
  row: number;
  success: boolean;
  id?: string;
  email?: string;
  username?: string;
  message?: string;
}

export interface UserBulkImportResult {
  created: number;
  failed: number;
  total: number;
  results: UserBulkImportRowResult[];
}

export async function downloadUserBulkImportTemplate(): Promise<void> {
  const token =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;

  const response = await fetch(`${BASE_API_URL}/users/import/template`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Failed to download import template.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "user-bulk-import-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function bulkImportUsersFromCsv(
  csv: string
): Promise<UserBulkImportResult> {
  const res = await apiRequest<ApiResponse<UserBulkImportResult>>("/users/import", {
    method: "POST",
    body: { csv },
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Bulk import failed.");
  }

  return res.data;
}