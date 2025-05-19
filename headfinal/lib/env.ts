/**
 * Environment configuration
 */

// Redis configuration
export const REDIS_CONFIG = {
  // Upstash REST API configuration
  restUrl: process.env.UPSTASH_REDIS_KV_REST_API_URL || "https://intimate-cowbird-32452.upstash.io",
  restToken: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || "AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA",
};

// Application configuration
export const APP_CONFIG = {
  // Environment
  isProduction: process.env.NODE_ENV === "production",
  isVercel: !!process.env.VERCEL,
  
  // Escrow
  escrowPublicKey: process.env.ESCROW_PUBLIC_KEY || "FcEVQnBpPikXQD2WHf7rDFQZr1anxVB3CRAsG8z2GkCR",
};

// Vercel-specific configuration
export const VERCEL_CONFIG = {
  environment: process.env.VERCEL_ENV || "development",
  isPreview: process.env.VERCEL_ENV === "preview",
  isProduction: process.env.VERCEL_ENV === "production",
};
