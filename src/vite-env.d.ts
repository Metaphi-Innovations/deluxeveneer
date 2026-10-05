/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_APP_NAME?: string;
  /** Optional. When "true", shows inward add autofill for testing. */
  readonly VITE_INWARD_AUTOFILL?: string;
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
