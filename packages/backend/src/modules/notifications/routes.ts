import { Router } from 'express';
import * as notificationController from './controller.js';

const router = Router();

// GET /api/v1/notifications/test - Enviar notificación de prueba (solo admin)
router.get('/test', notificationController.testNotification);

// GET /api/v1/notifications/types - Tipos de notificación disponibles
router.get('/types', notificationController.getNotificationTypes);

export default router;