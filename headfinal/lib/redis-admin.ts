/**
 * Redis administration utility to help manage your Redis database
 * Run with: npx ts-node -r dotenv/config lib/redis-admin.ts [command] [args]
 * 
 * Commands:
 *   get <key> - Get value for a key
 *   set <key> <value> - Set value for a key
 *   del <key> - Delete a key
 *   keys <pattern> - List keys matching pattern (default: *)
 *   flush - Clear all keys (use with caution!)
 *   info - Show Redis server info
 */

import { createClient } from '@vercel/kv';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('REDIS_URL environment variable is not set');
  process.exit(1);
}

const kv = createClient({
  url: REDIS_URL,
});

async function executeCommand() {
  try {
    const [command, ...args] = process.argv.slice(2);

    if (!command) {
      showHelp();
      return;
    }

    switch (command.toLowerCase()) {
      case 'get':
        if (args.length < 1) {
          console.error('Error: Key is required for GET command');
          return;
        }
        await getKey(args[0]);
        break;

      case 'set':
        if (args.length < 2) {
          console.error('Error: Key and value are required for SET command');
          return;
        }
        await setKey(args[0], args[1]);
        break;

      case 'del':
        if (args.length < 1) {
          console.error('Error: Key is required for DEL command');
          return;
        }
        await deleteKey(args[0]);
        break;

      case 'keys':
        const pattern = args[0] || '*';
        await listKeys(pattern);
        break;

      case 'flush':
        await flushDb();
        break;

      case 'info':
        await showInfo();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('Error executing command:', error);
  } finally {
    process.exit(0);
  }
}

async function getKey(key: string) {
  const value = await kv.get(key);
  if (value === null) {
    console.log(`Key "${key}" not found`);
  } else {
    console.log(`Value for key "${key}":`);
    console.log(value);
  }
}

async function setKey(key: string, value: string) {
  await kv.set(key, value);
  console.log(`Key "${key}" set to "${value}"`);
}

async function deleteKey(key: string) {
  const result = await kv.del(key);
  console.log(`Deleted ${result} key(s)`);
}

async function listKeys(pattern: string) {
  const keys = await kv.keys(pattern);
  
  if (keys.length === 0) {
    console.log(`No keys found matching pattern "${pattern}"`);
    return;
  }
  
  console.log(`Keys matching pattern "${pattern}" (${keys.length} total):`);
  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${key}`);
  });
}

async function flushDb() {
  const confirmation = await promptForConfirmation('Are you sure you want to delete ALL keys? This cannot be undone! (y/N)');
  
  if (confirmation.toLowerCase() !== 'y') {
    console.log('Operation cancelled');
    return;
  }
  
  // In this implementation, we'll delete keys in batches
  const keys = await kv.keys('*');
  if (keys.length === 0) {
    console.log('Database is already empty');
    return;
  }
  
  console.log(`Deleting ${keys.length} keys...`);
  
  // Delete keys in batches of 100
  const batchSize = 100;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    await Promise.all(batch.map(key => kv.del(key)));
    console.log(`Deleted ${Math.min(i + batchSize, keys.length)} / ${keys.length} keys`);
  }
  
  console.log('All keys have been deleted');
}

async function showInfo() {
  try {
    console.log('Redis Server Information:');
    console.log('-------------------------');
    console.log(`Connection URL: ${REDIS_URL.replace(/redis:\/\/.*?:(.*)@/, 'redis://[hidden_password]@')}`);
    
    // Get number of keys
    const keys = await kv.keys('*');
    console.log(`Total keys: ${keys.length}`);
    
    // Ping to check connectivity
    const pingResult = await kv.ping();
    console.log(`Connection status: ${pingResult === 'PONG' ? 'Connected' : 'Error'}`);
    
    // Unfortunately, @vercel/kv doesn't expose a direct info command
    // So we can only provide limited information
    
  } catch (error) {
    console.error('Error getting server info:', error);
  }
}

function showHelp() {
  console.log(`
Redis Admin Utility

Usage: npx ts-node -r dotenv/config lib/redis-admin.ts [command] [args]

Commands:
  get <key>         Get value for a key
  set <key> <value> Set value for a key
  del <key>         Delete a key
  keys <pattern>    List keys matching pattern (default: *)
  flush             Clear all keys (use with caution!)
  info              Show Redis server info
  `);
}

// Helper function to get user input
async function promptForConfirmation(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the command
executeCommand();
