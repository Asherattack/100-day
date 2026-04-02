const fs = require('fs');
const files = ['src/App.tsx', 'src/services/iexService.ts', 'src/hooks/useStockData.ts', 'src/scoring/garp.ts', 'src/components/StockCard.tsx'];
files.forEach((file) => {
  console.log(`--- ${file} ---`);
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, idx) => {
    if (idx < 220) {
      console.log(`${(idx + 1).toString().padStart(3, '0')}: ${line}`);
    }
  });
});
