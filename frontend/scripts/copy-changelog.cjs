const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'CHANGELOG.md');
const dest = path.join(__dirname, '..', 'public', 'CHANGELOG.md');
try {
  fs.copyFileSync(src, dest);
} catch (e) {
  // Ignore if CHANGELOG.md doesn't exist yet
}
