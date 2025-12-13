import express from 'express';
import { testConnection } from '../db-sqlite.js';

const router = express.Router();

router.get('/test-sqlite', async (req, res) => {
  try {
    const result = await testConnection();
    res.json({ db_time: result.current_time });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
