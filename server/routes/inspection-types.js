import express from 'express';
import { getInspectionTypes, createInspectionType } from '../controllers/inspection-types.js';

const router = express.Router();

router.get('/', getInspectionTypes);
router.post('/', createInspectionType);

export default router;
