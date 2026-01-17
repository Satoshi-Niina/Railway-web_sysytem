import express from 'express';
import { 
  getMaintenanceSchedules, 
  getMaintenanceScheduleById,
  updateBaseDate 
} from '../controllers/maintenance-schedules.js';

const router = express.Router();

// 検修スケジュール一覧取得
router.get('/', getMaintenanceSchedules);

// 特定車両・検修種別のスケジュール取得
router.get('/:vehicle_id/:inspection_type_id', getMaintenanceScheduleById);

// 起算日の更新
router.put('/:vehicle_id/:inspection_type_id/base-date', updateBaseDate);

export default router;
