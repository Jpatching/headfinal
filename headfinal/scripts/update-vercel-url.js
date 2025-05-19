/**
 * Script to update VERCEL_URL environment variable
 * Run with: node scripts/update-vercel-url.js your-app.vercel.app
 */

const fs = require('fs');
const path = require('path');

// Get the URL from command line argument
const vercelUrl = process.argv[2];

if (!vercelUrl) {
  console.error('❌ Error: No URL provided');
  console.log('Usage: node update-vercel-url.js your-app.vercel.app');
  process.exit(1);
}

// Validate URL format (simple check)
if (!vercelUrl.includes('.') || vercelUrl.includes('http')) {
  console.error('❌ Error: Invalid URL format. Should be like "your-app.vercel.app"');
  process.exit(1);
}

// Update .env or .env.local file
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local')
];

let updated = false;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if VERCEL_URL already exists
      if (envContent.includes('VERCEL_URL=')) {
        // Replace existing value
        envContent = envContent.replace(
          /VERCEL_URL=.*/g,
          `VERCEL_URL=${vercelUrl}`
        );
      } else {
        // Add new entry
        envContent += `\nVERCEL_URL=${vercelUrl}\n`;
      }
      
      // Write back to file
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Updated ${envPath} with VERCEL_URL=${vercelUrl}`);
      updated = true;
    } catch (error) {
      console.error(`❌ Error updating ${envPath}:`, error.message);
    }
  }
}

if (!updated) {
  // Create new .env.local file if none exists
  try {
    fs.writeFileSync(
      path.join(process.cwd(), '.env.local'),
      `VERCEL_URL=${vercelUrl}\n`
    );
    console.log(`✅ Created .env.local with VERCEL_URL=${vercelUrl}`);
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
    process.exit(1);
  }
}

console.log('🎉 Done! You can now run verification scripts against this URL.');
