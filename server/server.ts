import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inspectionRoutes from './routes/inspection';
import testRoutes from './routes/test';
import testSqliteRoutes from './routes/test-sqlite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/inspections', inspectionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/test-sqlite', testSqliteRoutes);

// 簡単なテスト用ルート
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});