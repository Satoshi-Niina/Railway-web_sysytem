import fs from 'fs';
import path from 'path';

function fixFile(filepath, replacements) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;
    for (const r of replacements) {
        if (content.includes(r.from)) {
            content = content.replace(new RegExp(r.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), r.to);
            changed = true;
        }
    }
    // 特殊なクォーテーション破壊のパターン
    const brokenQuotePattern = /"([^"]*?)\uFFFD(.*?)\}/g;
    if (brokenQuotePattern.test(content)) {
        content = content.replace(brokenQuotePattern, (match, p1, p2) => {
            return `"${p1}${p2}" }`;
        });
        changed = true;
    }
    
    // 文字化け特有のゴミを除去
    const trash = [/✁E/g, /❁E/g, /⚠E/g, /⚠EE/g, /⚠EE/g, /チE/g, /E/g];
    trash.forEach(t => {
        if (t.test(content)) {
            content = content.replace(t, '');
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ Fixed: ${filepath}`);
    }
}

// ターゲットファイルの修復
fixFile('client/lib/database.ts', [
    { from: 'catch (err) {', to: 'catch (err: any) {' },
    { from: 'console.log("Loading environment variables from:", envPath)', to: 'console.log("✅ Loading environment variables from:", envPath)' }
]);

fixFile('client/app/api/bases/route.ts', [
    { from: 'error: "基地名と基地タイプE忁EでぁE },', to: 'error: "基地名と基地タイプは必須です" },' }
]);

console.log('Final checking for other API routes...');
// 他のAPIルートも一括チェック
const apiDir = 'client/app/api';
const checkApiRoutes = (dir) => {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) checkApiRoutes(p);
        else if (f === 'route.ts') fixFile(p, []);
    });
};
checkApiRoutes(apiDir);
