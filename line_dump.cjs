const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split(/\r?\n/);
for (let idx = 0; idx < lines.length; idx += 1) {
  const num = idx + 1;
  if (num >= 100 && num <= 220) {
    console.log(`${String(num).padStart(4, '0')}: ${lines[idx]}`);
  }
}
