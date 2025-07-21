import express from 'express';
import pool from '../db';

const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ db_time: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 