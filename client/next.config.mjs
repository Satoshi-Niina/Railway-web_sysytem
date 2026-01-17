import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ローカル開発環境でのみ環境変数を読み込む
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  try {
    const rootEnvPath = path.resolve(__dirname, '../.env.development');
    dotenv.config({ path: rootEnvPath });
  } catch (e) {
    // Dockerビルド中などは無視
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // キャッシュを無効化
  generateBuildId: async () => `build-${Date.now()}`,
  serverExternalPackages: ['pg'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
}

export default nextConfig
