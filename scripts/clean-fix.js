import fs from 'fs';
import path from 'path';

// 1. .gitattributes
fs.writeFileSync('.gitattributes', '* text=auto eol=lf\n*.ts text eol=lf\n*.js text eol=lf\n*.tsx text eol=lf\n*.jsx text eol=lf\n*.yml text eol=lf\n*.json text eol=lf\n*.mjs text eol=lf\n', 'utf8');

// 2. next.config.mjs の修正 (Dockerビルド時のエラー回避)
const nextConfigPath = 'client/next.config.mjs';
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
// Dockerビルド時に dotenv で落ちないように修正
nextConfig = nextConfig.replace(
  "if (process.env.NODE_ENV !== 'production') {",
  "if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') { try {"
);
nextConfig = nextConfig.replace(
  "console.log('✅ Loaded environment variables from:', rootEnvPath);",
  "console.log('✅ Loaded environment variables from:', rootEnvPath); } catch (e) { console.log('Skipping env load'); }"
);
fs.writeFileSync(nextConfigPath, nextConfig, 'utf8');

console.log('✅ Clean configuration applied.');
