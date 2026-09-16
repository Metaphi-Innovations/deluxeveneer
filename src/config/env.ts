import { z } from 'zod';

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
});

// Extract values from Vite import.meta.env
const envValues = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
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
