import express from 'express';
import {
  getVehicleInspectionSchedules,
  getVehicleInspectionSchedule,
  createVehicleInspectionSchedule,
  updateVehicleInspectionSchedule,
  deleteVehicleInspectionSchedule,
  updateNextInspectionDate
} from '../controllers/vehicle-inspection-schedules.js';

const router = express.Router();

router.get('/', getVehicleInspectionSchedules);
router.get('/:id', getVehicleInspectionSchedule);
router.post('/', createVehicleInspectionSchedule);
router.put('/:id', updateVehicleInspectionSchedule);
router.delete('/:id', deleteVehicleInspectionSchedule);
router.post('/:id/complete', updateNextInspectionDate);

export default router;
