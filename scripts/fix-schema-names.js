import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function replaceInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    // public.bases を public.maintenance_bases に置換（basesの後にスペースや改行がある場合）
    if (content.includes('public.bases')) {
      const newContent = content.replace(/public\.bases(\s)/g, 'public.maintenance_bases$1');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`✗ ${filePath}: ${error.message}`);
    return 0;
  }
}

function walkDir(dir) {
  let count = 0;
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      count += walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      count += replaceInFile(filePath);
    }
  }

  return count;
}

console.log('スキーマ名を修正しています...\n');
const count = walkDir('client/app/api');
console.log(`\n${count}個のファイルを修正しました`);
