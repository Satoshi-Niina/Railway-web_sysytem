import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inspectionRoutes from './routes/inspection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/inspections', inspectionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});