/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_APP_NAME?: string;
  /** Optional. When "true", shows autofill on inward add and user-management add. */
  readonly VITE_INWARD_AUTOFILL?: string;
  readonly VITE_USER_BULK_IMPORT?: string;
  /** Optional. When set, login prefills and signs in on open. */
  readonly VITE_DEV_LOGIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
