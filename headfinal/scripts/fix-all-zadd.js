// fix-all-zadd.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with zadd
const grepOutput = execSync('grep -r "zadd" --include="*.js" --include="*.ts" .').toString();
const lines = grepOutput.split('\n');

// Files to process
const filesToFix = new Set();

// Find files with incorrect zadd format
for (const line of lines) {
  if (line.includes('{ [') && line.includes('zadd(')) {
    const filePath = line.split(':')[0];
    filesToFix.add(filePath);
  }
}

console.log(`Found ${filesToFix.size} files with incorrect ZADD format:`);
console.log([...filesToFix].join('\n'));

// Fix each file
for (const filePath of filesToFix) {
  if (!fs.existsSync(filePath)) continue;
  
  console.log(`\nFixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Create backup
  fs.writeFileSync(`${filePath}.bak`, content);
  
  // Replace incorrect format with correct format
  // This regex looks for zadd calls with { [score]: member } format
  const regex = /zadd\s*$$\s*([^,]+)\s*,\s*\{\s*\[([^\]]+)\]\s*:\s*([^}]+)\s*\}\s*$$/g;
  const newContent = content.replace(regex, 'zadd($1, { score: $2, member: $3 })');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed ZADD format in ${filePath}`);
  } else {
    console.log(`⚠️ No changes made to ${filePath}`);
  }
}

console.log('\nDone! Please verify the changes and run your tests.');