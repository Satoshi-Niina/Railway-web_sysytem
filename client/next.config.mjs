import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // キャッシュを無効化（本番デプロイ時のキャッシュ問題を回避）
  generateBuildId: async () => {
    // タイムスタンプベースのビルドIDで毎回新しいビルドを強制
    return `build-${Date.now()}-${process.env.NODE_ENV || 'production'}`
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
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
}

export default nextConfig
