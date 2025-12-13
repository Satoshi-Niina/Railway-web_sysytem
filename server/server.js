import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import inspectionRoutes from './routes/inspection.js';
import testRoutes from './routes/test.js';
import testSqliteRoutes from './routes/test-sqlite.js';
import operationPlansRoutes from './routes/operation-plans.js';
import operationRecordsRoutes from './routes/operation-records.js';
import vehiclesRoutes from './routes/vehicles.js';
import basesRoutes from './routes/bases.js';
import officesRoutes from './routes/offices.js';

// ESMで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数の読み込み
// 開発環境: ルートの.env.development
// 本番環境: server/.env.production または server/.env.production.local
const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  dotenv.config({ path: resolve(__dirname, '.env.production.local') });
  dotenv.config({ path: resolve(__dirname, '.env.production') });
} else {
  dotenv.config({ path: resolve(__dirname, '../.env.development') });
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS設定 - 複数のオリジンに対応
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({ 
  origin: (origin, callback) => {
    // originがundefined（同一オリジン）または許可リストに含まれる場合
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());

app.use('/api/inspections', inspectionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/test-sqlite', testSqliteRoutes);
app.use('/api/operation-plans', operationPlansRoutes);
app.use('/api/operation-records', operationRecordsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bases', basesRoutes);
app.use('/api/offices', officesRoutes);

// 簡単なテスト用ルート
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
