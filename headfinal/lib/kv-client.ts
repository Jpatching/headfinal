import { kv } from '@vercel/kv'

// Export the KV client instance
export { kv }

// Prefix keys to avoid collisions
export const leaderboardKeyPrefix = 'leaderboard:'
export const playerKeyPrefix = 'player:'

// Helper function to generate a player key
export function getPlayerKey(publicKey: string): string {
  return `${playerKeyPrefix}${publicKey}`
}

// Helper function to check if KV is available
export async function isKvAvailable(): Promise<boolean> {
  try {
    // Try a simple ping operation
    await kv.ping()
    return true
  } catch (error) {
    console.error('KV connection error:', error)
    return false
  }
}

// Fallback storage for environments without KV
let memoryStore: Map<string, any> = new Map()

// Get a value from storage with fallback
export async function getValue<T>(key: string): Promise<T | null> {
  try {
    if (await isKvAvailable()) {
      return (await kv.get(key)) as T
    } else {
      // Fallback to memory storage
      return (memoryStore.get(key) as T) || null
    }
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, error)
    return null
  }
}

// Set a value in storage with fallback
export async function setValue<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    if (await isKvAvailable()) {
      if (ttl) {
        await kv.set(key, value, { ex: ttl })
      } else {
        await kv.set(key, value)
      }
    } else {
      // Fallback to memory storage
      memoryStore.set(key, value)
    }
  } catch (error) {
    console.error(`Error setting value for key ${key}:`, error)
  }
}

// Delete a value from storage with fallback
export async function deleteValue(key: string): Promise<void> {
  try {
    if (await isKvAvailable()) {
      await kv.del(key)
    } else {
      // Fallback to memory storage
      memoryStore.delete(key)
    }
  } catch (error) {
    console.error(`Error deleting value for key ${key}:`, error)
  }
}
