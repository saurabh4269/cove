import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  LOOP_OS_URL: z.string().optional(),
  NEXT_PUBLIC_LOOP_OS_URL: z.string().optional(),
  LOOP_TENANT_ID: z.string().optional(),
  LOOP_TENANT_TOKEN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  return result.data
}

export const env = validateEnv()
