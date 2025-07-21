/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabaseパッケージをサーバーコンポーネントで使用可能にする
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // ビルド設定
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // 画像最適化
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
    domains: ['localhost'],
  },
  
  // 環境変数
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // 出力設定
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // ヘッダー設定
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/api',
        destination: '/api/health',
        permanent: false,
      },
    ]
  },

  // 開発サーバー起動時にブラウザを開く
  onDemandEntries: {
    // 開発時のページ保持時間
    maxInactiveAge: 25 * 1000,
    // 同時に保持するページ数
    pagesBufferLength: 2,
  },
}

export default nextConfig 