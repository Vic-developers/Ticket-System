import { Router } from 'express';
import * as reportsController from './controller.js';

const router = Router();

// GET /api/v1/reports/academic - Reporte académico por cuatrimestre
router.get('/academic', reportsController.getAcademicReport);

// GET /api/v1/reports/custom - Reporte personalizado con filtros
router.get('/custom', reportsController.getCustomReport);

// GET /api/v1/reports/campus/:campusId - Reporte por recinto
router.get('/campus/:campusId', reportsController.getReportByCampus);

// GET /api/v1/reports/period/:year/:quarter - Reporte por período
router.get('/period/:year/:quarter', reportsController.getReportByPeriod);

// GET /api/v1/reports/export-stats - Estadísticas para exportación
router.get('/export-stats', reportsController.getExportStats);

export default router;