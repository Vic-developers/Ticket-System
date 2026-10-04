import { Router } from 'express';
import * as auditController from './controller.js';

const router = Router();

// GET /api/v1/audit/logs - Logs de auditoría con filtros
router.get('/logs', auditController.getLogs);

// GET /api/v1/audit/user-actions - Acciones de un usuario específico
router.get('/user-actions', auditController.getUserActions);

// GET /api/v1/audit/entity-actions - Acciones sobre una entidad específica
router.get('/entity-actions/:entityId', auditController.getEntityActions);

// GET /api/v1/audit/critical - Acciones críticas de seguridad
router.get('/critical', auditController.getCriticalActions);

// GET /api/v1/audit/export - Exportar logs de auditoría
router.get('/export', auditController.exportLogs);

export default router;