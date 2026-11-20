export const AUTH_STORAGE_KEY = "deluxe-veneers-erp-authenticated";
export const AUTH_TOKEN_STORAGE_KEY = "deluxe-veneers-erp-token";
export const AUTH_USER_STORAGE_KEY = "deluxe-veneers-erp-user";

export function hasAccessTokenInSessionStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true" &&
    Boolean(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY))
  );
}