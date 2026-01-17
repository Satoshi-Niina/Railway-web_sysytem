import fs from 'fs';
import path from 'path';

const root = './client';

const fixes = [
  { from: /\bSLCT\b/g, to: 'SELECT' },
  { from: /\bLFT JOIN\b/g, to: 'LEFT JOIN' },
  { from: /\bWHR\b/g, to: 'WHERE' },
  { from: /\bORDR BY\b/g, to: 'ORDER BY' },
  { from: /\bINSRT\b/g, to: 'INSERT' },
  { from: /\bVALUS\b/g, to: 'VALUES' },
  { from: /\bRTURNING\b/g, to: 'RETURNING' },
  { from: /\brror\b/g, to: 'Error' },
  { from: /\bGT\b/g, to: 'GET' }, // GETがGTになっている等
  { from: /\bDAT_TRUNC\b/g, to: 'DATE_TRUNC' },
  { from: /"([^"]*?)駁/g, to: '"$1駅' }, // 駁 -> 駅 への誤変換
  { from: /忁E/g, to: '必須' },
  { from: /設宁E/g, to: '設定' },
  { from: /惁/g, to: '情報' },
  { from: /適刁/g, to: '適宜' },
  { from: /互換性のため/g, to: '互換性のため' },
  { from: /正規化/g, to: '正規化' },
  { from: /回避/g, to: '回避' },
  { from: /場吁/g, to: '場合' },
  { from: /駁,/g, to: '駅",' } // クォーテーションの破壊
];

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(f)) walk(p);
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(p))) {
      let content = fs.readFileSync(p, 'utf8');
      let changed = false;
      for (const fix of fixes) {
        if (fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          changed = true;
        }
      }
      
      // クォーテーション閉じ忘れの物理的修正
      const brokenQuotes = /"([^"]+?)駅,(\s*\w+:)/g;
      if (brokenQuotes.test(content)) {
          content = content.replace(brokenQuotes, '"$1駅", $2');
          changed = true;
      }

      if (changed) {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`🛠️ Repaired: ${p}`);
      }
    }
  });
}

console.log('🚀 Starting deep code repair...');
walk(root);
walk('./server');
console.log('✅ Repair completed.');
