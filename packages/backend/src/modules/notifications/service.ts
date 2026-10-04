import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuración del transporter de email
const createTransporter = (): nodemailer.Transporter => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = config.email;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

// ==========================================================//
// EVENTOS DE NOTIFICACIÓN
// ==========================================================//

enum NotificationEvent {
  TICKET_CREADO = 'TICKET_CREADO',
  TICKET_ASIGNADO = 'TICKET_ASIGNADO',
  TICKET_REASIGNADO = 'TICKET_REASIGNADO',
  COMENTARIO_AGREGADO = 'COMENTARIO_AGREGADO',
  ESTADO_CAMBIADO = 'ESTADO_CAMBIADO',
  TICKET_RESUELTO = 'TICKET_RESUELTO',
  TICKET_CERRADO = 'TICKET_CERRADO',
}

// ==========================================================//
// Plantillas de email
// ==========================================================//

interface EmailData {
  to: string;
  subject: string;
  html: string;
  ticketId?: string;
}

const generateEmailContent = (event: NotificationEvent, data: {
  ticketNumber: string;
  title: string;
  recipientName: string;
  technicianName?: string;
  recipientEmail: string;
  actionDetails?: string;
}): EmailData => {
  let subject = '';
  let html = '';

  switch (event) {
    case NotificationEvent.TICKET_CREADO:
      subject = `Nuevo ticket creado: ${data.ticketNumber}`;
      html = `
        <h2>Nuevo ticket de soporte creado</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>Se ha creado un nuevo ticket de soporte con los siguientes detalles:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Fecha de creación:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>El ticket ha sido asignado automáticamente según las reglas de distribución de carga.</p>
        <p>Puedes consultar el estado de tu ticket en cualquier momento.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    case NotificationEvent.TICKET_ASIGNADO:
      subject = `Ticket asignado: ${data.ticketNumber}`;
      html = `
        <h2>Ticket asignado a un técnico</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>Tu ticket ha sido asignado a un técnico para su atención:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Técnico asignado:</strong> ${data.technicianName}</li>
          <li><strong>Fecha de asignación:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>El técnico comenzará la atención próximamente. Recibirás actualizaciones sobre el progreso.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    case NotificationEvent.TICKET_REASIGNADO:
      subject = `Ticket reasignado: ${data.ticketNumber}`;
      html = `
        <h2>Ticket reasignado</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>Tu ticket ha sido reasignado a otro técnico:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Motivo:</strong> ${data.actionDetails}</li>
          <li><strong>Nuevo técnico:</strong> ${data.technicianName}</li>
        </ul>
        <p>El nuevo técnico se hará cargo de la atención. El historial completo del ticket se mantiene.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    case NotificationEvent.ESTADO_CAMBIADO:
      subject = `Estado actualizado: ${data.ticketNumber}`;
      html = `
        <h2>Estado del ticket actualizado</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>El estado de tu ticket ha sido cambiado:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Nuevo estado:</strong> ${data.actionDetails}</li>
        </ul>
        <p>Recibirás más información a medida que avanza la atención.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    case NotificationEvent.TICKET_RESUELTO:
      subject = `Ticket resuelto: ${data.ticketNumber}`;
      html = `
        <h2>Ticket resuelto</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>¡Buenas noticias! Tu ticket ha sido resuelto:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Fecha de resolución:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>El problema ha sido resuelto satisfactoriamente. Si el problema persiste, puedes crear un nuevo ticket o agregar un comentario.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    case NotificationEvent.TICKET_CERRADO:
      subject = `Ticket cerrado: ${data.ticketNumber}`;
      html = `
        <h2>Ticket cerrado</h2>
        <p>Hola <strong>${data.recipientName}</strong>,</p>
        <p>Tu ticket ha sido cerrado definitivamente:</p>
        <ul>
          <li><strong>Número de ticket:</strong> ${data.ticketNumber}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Fecha de cierre:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>El ticket ha sido cerrado y archivado. No recibirás más notificaciones sobre este ticket a menos que se cree uno nuevo relacionado.</p>
        <br>
        <p>Saludos cordiales,<br>
        Equipo de Soporte Técnico</p>
      `;
      break;

    default:
      subject = 'Notificación del sistema';
      html = '<p>Has recibido una notificación del sistema de tickets.</p>';
  }

  return { subject, html };
};

// ==========================================================//
// ENVIAR NOTIFICACIÓN
// ==========================================================//

export const sendNotification = async (event: NotificationEvent, data: {
  ticketId: string;
  ticketNumber: string;
  title: string;
  recipientEmail: string;
  recipientName: string;
  technicianName?: string;
  actionDetails?: string;
}) => {
  try {
    const { subject, html } = generateEmailContent(event, {
      ...data,
      ticketNumber: data.ticketNumber,
      title: data.title,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      technicianName: data.technicianName,
      actionDetails: data.actionDetails,
    });

    await transporter.sendMail({
      from: `"Sistema de Tickets" <${config.email.SMTP_USER}>`,
      to: data.recipientEmail,
      subject,
      html,
    });

    console.log(`✅ Notificación ${event} enviada a ${data.recipientEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar notificación ${event}:`, error);
    return false;
  }
};

// ==========================================================//
// NOTIFICACIONES AUTOMÁTICAS POR EVENTOS
// ==========================================================//

export const notifyTicketCreated = async (ticket: any, requester: any) => {
  await sendNotification(NotificationEvent.TICKET_CREADO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: requester.email,
    recipientName: `${requester.firstName} ${requester.lastName}`,
    actionDetails: 'Ticket creado en el sistema',
  });
};

export const notifyTicketAssigned = async (ticket: any, technician: any) => {
  await sendNotification(NotificationEvent.TICKET_ASIGNADO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: technician.email,
    recipientName: `${technician.firstName} ${technician.lastName}`,
    technicianName: `${technician.firstName} ${technician.lastName}`,
    actionDetails: 'Asignación automática según regla de distribución',
  });
};

export const notifyTicketReassigned = async (ticket: any, fromTechnician: any, toTechnician: any) => {
  await sendNotification(NotificationEvent.TICKET_REASIGNADO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: toTechnician.email,
    recipientName: `${toTechnician.firstName} ${toTechnician.lastName}`,
    technicianName: `${fromTechnician.firstName} ${toTechnician.lastName} → ${toTechnician.firstName} ${toTechnician.lastName}`,
    actionDetails: 'Reasignación por distribución de carga de trabajo',
  });
};

export const notifyStatusChanged = async (ticket: any, user: any) => {
  const newStatus = ticket.status?.code;
  const statusNames: Record<string, string> = {
    NUEVO: 'Nuevo',
    EN_PROCESO: 'En proceso',
    PENDIENTE: 'Pendiente',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
  };

  await sendNotification(NotificationEvent.ESTADO_CAMBIADO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: ticket.requesterEmail || '',
    recipientName: 'Solicitante',
    actionDetails: statusNames[newStatus] || newStatus,
  });
};

export const notifyTicketResolved = async (ticket: any, resolver: any) => {
  await sendNotification(NotificationEvent.TICKET_RESUELTO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: ticket.requesterEmail || '',
    recipientName: 'Solicitante',
    technicianName: `${resolver.firstName} ${resolver.lastName}`,
    actionDetails: 'Ticket resuelto y dado por cerrado temporalmente',
  });
};

export const notifyTicketClosed = async (ticket: any) => {
  await sendNotification(NotificationEvent.TICKET_CERRADO, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    recipientEmail: ticket.requesterEmail || '',
    recipientName: 'Solicitante',
    actionDetails: 'Ticket archivado definitivamente',
  });
};

// ==========================================================//
// INTEGRACIÓN CON EL MÓDULO DE TICKETS
// ==========================================================//

// Estos pueden ser llamados desde los controladores de tickets después de ciertas acciones

export const integrateNotificationsWithTickets = {
  afterCreate: async (ticket: any, requester: any) => {
    await notifyTicketCreated(ticket, requester);
  },

  afterAssign: async (ticket: any, technician: any) => {
    await notifyTicketAssigned(ticket, technician);
  },

  afterReassign: async (ticket: any, fromTech: any, toTech: any) => {
    await notifyTicketReassigned(ticket, fromTech, toTech);
  },

  afterStatusChange: async (ticket: any, changer: any) => {
    await notifyStatusChanged(ticket, changer);
  },

  afterResolve: async (ticket: any, resolver: any) => {
    await notifyTicketResolved(ticket, resolver);
  },

  afterClose: async (ticket: any) => {
    await notifyTicketClosed(ticket);
  },
};

export default {
  sendNotification,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketReassigned,
  notifyStatusChanged,
  notifyTicketResolved,
  notifyTicketClosed,
  integrateNotificationsWithTickets,
};