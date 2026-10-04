import { Router } from 'express';
import * as dashboardController from './controller.js';

const router = Router();

// GET /api/v1/dashboard/kpis - KPIs principales
router.get('/kpis', dashboardController.getKPIs);

// GET /api/v1/dashboard/stats-by-campus - Estadísticas por recinto
router.get('/stats-by-campus', dashboardController.getStatsByCampus);

// GET /api/v1/dashboard/stats-by-tecnico - Estadísticas por técnico
router.get('/stats-by-tecnico', dashboardController.getStatsByTechnician);

// GET /api/v1/dashboard/stats-by-prioridad - Estadísticas por prioridad
router.get('/stats-by-prioridad', dashboardController.getStatsByPriority);

// GET /api/v1/dashboard/stats-by-categoria - Estadísticas por categoría
router.get('/stats-by-categoria', dashboardController.getStatsByCategory);

// GET /api/v1/dashboard/evolution-temporal - Evolución temporal
router.get('/evolution-temporal', dashboardController.getEvolutionTemporal);

// GET /api/v1/dashboard/reassigned-stats - Estadísticas de reasignación
router.get('/reassigned-stats', dashboardController.getReassignedStats);

export default router;