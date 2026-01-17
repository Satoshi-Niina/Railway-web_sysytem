import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ローカル開発環境ではルートの.env.developmentを読み込む
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') { try {
  const rootEnvPath = path.resolve(__dirname, '../.env.development');
  dotenv.config({ path: rootEnvPath });
  console.log('✅ Loaded environment variables from:', rootEnvPath); } catch (e) { console.log('Skipping env load'); }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // キャッシュを無効化（本番デプロイ時のキャッシュ問題を回避）
  generateBuildId: async () => {
    // タイムスタンプ + 環境 + ランダム値でビルドIDを生成し、キャッシュを完全回避
    const timestamp = Date.now()
    const env = process.env.NODE_ENV || 'production'
    const random = Math.random().toString(36).substring(7)
    return `build-${timestamp}-${env}-${random}`
  },
  serverExternalPackages: ['pg'],
  outputFileTracingRoot: path.join(__dirname, '../'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/:path*`, // Proxy to Backend
      },
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
}

export default nextConfig
