/**
 * Helper functions and types for handling route parameters in Next.js 15
 */
import { type NextRequest } from "next/server";

/**
 * Helper function to extract params safely from either format
 * @param params The route parameters from Next.js
 * @returns The extracted parameters
 */
export async function extractParams<T>(params: any): Promise<T> {
  if ('params' in params) {
    return params.params;
  } else if (params instanceof Promise) {
    return await params;
  }
  return params;
}
