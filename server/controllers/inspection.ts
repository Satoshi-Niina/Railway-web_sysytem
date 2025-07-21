import { Request, Response } from 'express';
import pool from '../db';

export const getInspections = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM inspections ORDER BY inspected_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
};

export const createInspection = async (req: Request, res: Response) => {
  const { machine_id, inspector, inspected_at, result } = req.body;
  try {
    await pool.query(
      'INSERT INTO inspections (machine_id, inspector, inspected_at, result) VALUES ($1, $2, $3, $4)',
      [machine_id, inspector, inspected_at, result]
    );
    res.status(201).json({ message: 'Inspection added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add inspection' });
  }
};