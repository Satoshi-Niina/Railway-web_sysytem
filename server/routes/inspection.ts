import express from 'express';
import { getInspections, createInspection } from '../controllers/inspection';

const router = express.Router();

router.get('/', getInspections);
router.post('/', createInspection);

export default router;