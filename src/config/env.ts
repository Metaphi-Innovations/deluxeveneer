import { z } from 'zod';

/**
 * Optional env flags: missing/empty/invalid → false (never fail app boot).
 */
function parseOptionalEnvFlag(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Frontend Environment Schema
 * Follows centralized, type-safe, fail-fast validation logic.
 *
 * For Vite applications:
 * Client-exposed variables must be prefixed with `VITE_`.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_NAME: z.string().default('Deluxe Veneers'),
  /** When true, shows "Autofill test data" on inward add forms. Default false if unset. */
  VITE_INWARD_AUTOFILL: z.boolean().default(false),
  /**
   * Optional local login password. When set, the login page fills the
   * superadmin email with this password and signs in on open.
   */
  VITE_DEV_LOGIN_PASSWORD: z.string().default(""),
});

// Extract values from Vite import.meta.env
const envValues = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_INWARD_AUTOFILL: parseOptionalEnvFlag(import.meta.env.VITE_INWARD_AUTOFILL),
  VITE_DEV_LOGIN_PASSWORD: String(import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? "").trim(),
};

const parsedEnv = envSchema.safeParse(envValues);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.format();
  console.error('❌ Invalid or missing frontend environment variables:', formattedErrors);
  throw new Error(
    `Frontend environment validation failed:\n` +
      JSON.stringify(formattedErrors, null, 2)
  );
}

/**
 * Type-safe, validated environment configuration
 */
export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;
