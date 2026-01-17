import fs from 'fs';
import path from 'path';

const apiDir = 'client/app/api';

function cleanApiFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // else { // モックデータ ... } のパターンを検出し、中身を空にして閉じ括弧だけ残す
  // か、あるいはモックデータ配列の定義を物理的に消去する
  
  // 最も確実なのは、文法エラーを引き起こしている巨大な else ブロックや 
  // モックデータ変数を正規表現で一括置換することです。
  
  let newContent = content;

  // 1. 文字化けした catch 文を修正
  newContent = newContent.replace(/\} catch \(err\) \{/g, '} catch (err: any) {');
  newContent = newContent.replace(/\} catch \(error\) \{/g, '} catch (error: any) {');

  // 2. モックデータ定義 (const mockData = [...] など) を空の配列にする
  newContent = newContent.replace(/const mockData:.*?= \[[\s\S]*?\]/g, 'const mockData: any[] = []');
  newContent = newContent.replace(/const managementOffices = \[[\s\S]*?\]/g, 'const managementOffices: any[] = []');
  
  // 3. else { // モック ... } ブロックの中身を最小限にする
  newContent = newContent.replace(/else \{[\s\S]*?return NextResponse\.json\(.*?\)\s*\}/g, 'else { return NextResponse.json([]) }');

  // 4. キーワードの最終復元 (修復スクリプトの強化版)
  const finalFixes = [
    { from: /\bSLCT\b/g, to: 'SELECT' },
    { from: /\bLFT JOIN\b/g, to: 'LEFT JOIN' },
    { from: /\bINSRT\b/g, to: 'INSERT' },
    { from: /\bVALUS\b/g, to: 'VALUES' },
    { from: /\bRTURNING\b/g, to: 'RETURNING' },
    { from: /\bWHR\b/g, to: 'WHERE' },
    { from: /\bORDR BY\b/g, to: 'ORDER BY' },
    { from: /\brror\b/g, to: 'Error' },
    { from: /\bDAT_TRUNC\b/g, to: 'DATE_TRUNC' }
  ];

  for (const fix of finalFixes) {
    newContent = newContent.replace(fix.from, fix.to);
  }

  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`🧹 Sanitized: ${filepath}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f === 'route.ts' || f === 'database.ts') cleanApiFile(p);
  });
}

console.log('🚀 CLEANING ALL API ROUTES TO REMOVE BROKEN MOCK DATA...');
walk(apiDir);
walk('client/lib');
console.log('✨ All routes sanitized. Syntax errors should be gone.');
