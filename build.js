const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Compiling TypeScript...");
execSync('npx tsc', { stdio: 'inherit' });

console.log("Fixing import paths in dist...");
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Replace import paths that don't have .js extension
      // Match: from "./something" or from "../something" or from "./views/something"
      content = content.replace(/(from\s+["'])(\.\.?\/[^"']+(?!\.js))(["'])/g, '$1$2.js$3');
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
processDir(path.join(__dirname, 'dist'));
console.log("Build completed successfully!");
