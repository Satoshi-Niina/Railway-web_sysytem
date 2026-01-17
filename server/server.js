import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import inspectionRoutes from './routes/inspection.js';
import inspectionTypesRoutes from './routes/inspection-types.js';
import vehicleInspectionScheduleRoutes from './routes/vehicle-inspection-schedule.js';
import vehicleInspectionSchedulesRoutes from './routes/vehicle-inspection-schedules.js';
import operationPlansRoutes from './routes/operation-plans.js';
import operationRecordsRoutes from './routes/operation-records.js';
import vehiclesRoutes from './routes/vehicles.js';
import basesRoutes from './routes/bases.js';
import officesRoutes from './routes/offices.js';
import machineTypesRoutes from './routes/machine-types.js';
import machinesRoutes from './routes/machines.js';
import maintenanceSchedulesRoutes from './routes/maintenance-schedules.js';
import authRoutes from './routes/auth.js';

// ESMで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Server Startup ===');
console.log('Current Directory:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 環境変数の読み込み
// 開発環境: ルートの.env.development
// 本番環境: server/.env.production または server/.env.production.local
// 環境変数の読み込み
const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  const prodPath = resolve(__dirname, '.env.production');
  console.log('Loading production env from:', prodPath);
  dotenv.config({ path: prodPath });
} else {
  const devPath = resolve(__dirname, '../.env.development');
  console.log('Loading development env from:', devPath);
  dotenv.config({ path: devPath });
}

console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

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
      console.warn(`CORS rejected for origin: ${origin}`);
      console.log(`Allowed origins are: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());

// 認証ルート（CORS対象外・認証不要）
app.use('/api/auth', authRoutes);

app.use('/api/inspections', inspectionRoutes);
app.use('/api/inspection-types', inspectionTypesRoutes);
app.use('/api/vehicle-inspection-schedule', vehicleInspectionScheduleRoutes);
app.use('/api/vehicle-inspection-schedules', vehicleInspectionSchedulesRoutes);
app.use('/api/operation-plans', operationPlansRoutes);
app.use('/api/operation-records', operationRecordsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bases', basesRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/machine-types', machineTypesRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/maintenance-schedules', maintenanceSchedulesRoutes);

// 簡単なテスト用ルート
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

import db from './db.js';
app.get('/api/debug-schema', async (req, res) => {
  try {
    const result = await db.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'master_data'");
    console.log('--- DB SCHEMA DEBUG ---');
    result.rows.forEach(r => console.log(`${r.table_name}.${r.column_name}`));
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// デバッグ: vehiclesとmachinesの結合を確認
app.get('/api/debug-vehicles-machines', async (req, res) => {
  try {
    // データベース接続URLを確認
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
    
    // 実際にデータを取得してみる
    const machinesData = await db.query("SELECT * FROM master_data.machines ORDER BY machine_number LIMIT 5");
    const machineTypesData = await db.query("SELECT * FROM master_data.machine_types ORDER BY type_code LIMIT 5");
    const maintenanceVehiclesData = await db.query("SELECT * FROM maintenance.vehicles LIMIT 5");
    
    // カウントも確認
    const machinesCount = await db.query("SELECT COUNT(*) FROM master_data.machines");
    const machineTypesCount = await db.query("SELECT COUNT(*) FROM master_data.machine_types");
    const maintenanceVehiclesCount = await db.query("SELECT COUNT(*) FROM maintenance.vehicles");
    
    res.json({
      database_url: maskedUrl,
      machines: {
        count: machinesCount.rows[0].count,
        data: machinesData.rows
      },
      machine_types: {
        count: machineTypesCount.rows[0].count,
        data: machineTypesData.rows
      },
      maintenance_vehicles: {
        count: maintenanceVehiclesCount.rows[0].count,
        data: maintenanceVehiclesData.rows
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
