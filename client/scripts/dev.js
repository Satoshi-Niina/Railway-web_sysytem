const { spawn } = require('child_process');

// openパッケージのインポートを動的に行い、エラーハンドリングを追加
let open;
try {
  open = require('open');
} catch (error) {
  console.warn('Warning: open package not available, browser will not open automatically');
  open = null;
}

// Next.js開発サーバーを起動
const nextDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// サーバーが起動するまで少し待ってからブラウザを開く
setTimeout(async () => {
  if (open) {
    try {
      await open('http://localhost:3000');
      console.log('🌐 Browser opened automatically');
    } catch (error) {
      console.error('Failed to open browser:', error.message);
      console.log('💡 You can manually open http://localhost:3000 in your browser');
    }
  } else {
    console.log('💡 Please manually open http://localhost:3000 in your browser');
  }
}, 3000);

// プロセス終了時の処理
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit();
}); 