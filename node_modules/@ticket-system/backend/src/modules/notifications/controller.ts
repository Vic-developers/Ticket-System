import { Response, Request } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as notificationService from './service.js';

export const testNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Solo para testing - envía una prueba de notificación
  const result = await notificationService.sendNotification(
    'TICKET_CREADO',
    {
      ticketId: 'test-123',
      ticketNumber: 'TSK-2026-001',
      title: 'Test de notificación',
      recipientEmail: req.user?.email || 'test@test.com',
      recipientName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Test User',
      technicianName: 'Test Technician',
      actionDetails: 'This is a test notification',
    }
  );

  if (result) {
    res.json({
      success: true,
      message: 'Notificación de prueba enviada',
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'SEND_FAILED',
      message: 'No se pudo enviar la notificación de prueba',
    });
  }
});

export const getNotificationTypes = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const types = [
    { event: 'TICKET_CREADO', name: 'Ticket creado', description: 'Cuando se crea un nuevo ticket' },
    { event: 'TICKET_ASIGNADO', name: 'Ticket asignado', description: 'Cuando un ticket es asignado a un técnico' },
    { event: 'TICKET_REASIGNADO', name: 'Ticket reasignado', description: 'Cuando un ticket es reasignado a otro técnico' },
    { event: 'ESTADO_CAMBIADO', name: 'Estado cambiado', description: 'Cuando el estado del ticket cambia' },
    { event: 'TICKET_RESUELTO', name: 'Ticket resuelto', description: 'Cuando un ticket es marcado como resuelto' },
    { event: 'TICKET_CERRADO', name: 'Ticket cerrado', description: 'Cuando un ticket es cerrado definitivamente' },
  ];

  res.json({
    success: true,
    data: types,
  });
});