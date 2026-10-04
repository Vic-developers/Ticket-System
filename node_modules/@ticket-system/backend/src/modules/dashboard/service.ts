import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

interface KPIs {
  totalTickets: number;
  nuevos: number;
  enProceso: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
  criticos: number;
  altaPrioridad: number;
  tiempoPromedioResolucion: number;
  tiempoPromedioPrimeraAtencion: number;
  porcentajeResolucion: number;
  ticketsReasignados: number;
}

interface DashboardStats {
  porRecinto: Array<{ campusId: string; total: number; nuevos: number; enProceso: number; pendientes: number; resueltos: number; cerrados: number; criticos: number; tiempoPromedioResolucion: number }>;
  porTecnico: Array<{ userId: string; nombre: string; total: number; activos: number; pendientes: number; resueltos: number; cerrados: number; criticos: number; tiempoPromedioResolucion: number; cargaTrabajo: number }>;
  porPrioridad: Record<string, { total: number; porcentaje: number }>;
  porEstado: Record<string, { total: number; porcentaje: number }>;
  porCategoria: Array<{ categoryId: string; nombre: string; total: number; porcentaje: number }>;
  evolucionTemporal: Array<{ fecha: string; total: number; nuevos: number; resueltos: number }>;
}

export const dashboardService = {
  // ========================================================
  // GET GENERAL KPIs
  // ========================================================
  async getKPIs(filters: { campusId?: string; departmentId?: string; academicPeriodId?: string } = {}): Promise<KPIs> {
    const where: any = {};
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    // Contar tickets por estado
    const [totalTickets, nuevos, enProceso, pendientes, resueltos, cerrados] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, statusId: 'NUEVO' } }),
      prisma.ticket.count({ where: { ...where, statusId: 'EN_PROCESO' } }),
      prisma.ticket.count({ where: { ...where, statusId: 'PENDIENTE' } }),
      prisma.ticket.count({ where: { ...where, statusId: 'RESUELTO' } }),
      prisma.ticket.count({ where: { ...where, statusId: 'CERRADO' } }),
    ]);

    // Count críticos (tickets de alta prioridad)
    const criticos = await prisma.ticket.count({ where: { ...where, priorityId: 'CRITICA' } });

    // Count alta prioridad
    const altaPrioridad = await prisma.ticket.count({ where: { ...where, priorityId: 'ALTA' } });

    // Calcular tiempos promedio
    const resolvedTickets = await prisma.ticket.findMany({
      where: { ...where, statusId: 'RESUELTO' },
      select: { responseTimeMinutes: true, resolutionTimeMinutes: true },
    });

    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolutionTimeMinutes || 0), 0) / resolvedTickets.length
      : 0;

    const firstResponseTickets = await prisma.ticket.findMany({
      where: { ...where, statusId: { in: ['RESUELTO', 'CERRADO'] }, firstResponseAt: { not: null } },
      select: { firstResponseAt: true, createdAt: true },
    });

    let avgFirstResponse = 0;
    if (firstResponseTickets.length > 0) {
      const totalMinutes = firstResponseTickets.reduce((sum, t) => {
        const diff = new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime();
        return sum + Math.round(diff / 60000);
      }, 0);
      avgFirstResponse = totalMinutes / firstResponseTickets.length;
    }

    // Porcentaje de resolución
    const porcentajeResolucion = totalTickets > 0 ? ((resueltos + cerrados) / totalTickets) * 100 : 0;

    // Tickets reasignados (contar reasignaciones en la tabla)
    const totalReassignments = await prisma.ticketReassignments.count({ where: {} });
    // Calcular tickets únicos reasignados (aproximado)
    const ticketsReasignados = Math.round((totalReassignments / 1.5)); // promedio 1.5 reasignaciones por ticket

    return {
      totalTickets,
      nuevos,
      enProceso,
      pendientes,
      resueltos,
      cerrados,
      criticos,
      altaPrioridad,
      tiempoPromedioResolucion: Math.round(avgResolutionTime),
      tiempoPromedioPrimeraAtencion: Math.round(avgFirstResponse),
      porcentajeResolucion: Math.round(porcentajeResolucion * 100) / 100,
      ticketsReasignados,
    };
  },

  // ========================================================
  // GET DASHBOARD STATS BY CAMPUS
  // ========================================================
  async getStatsByCampus(filters: { academicPeriodId?: string } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const stats = await prisma.$queryRaw`
      SELECT 
        campus.id,
        campus.code,
        campus.name,
        COUNT(ticket.id) as total,
        SUM(CASE WHEN ticket.statusId = 'NUEVO' THEN 1 ELSE 0 END) as nuevos,
        SUM(CASE WHEN ticket.statusId = 'EN_PROCESO' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN ticket.statusId = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN ticket.statusId = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN ticket.statusId = 'CERRADO' THEN 1 ELSE 0 END) as cerrados,
        SUM(CASE WHEN ticket.priorityId = 'CRITICA' THEN 1 ELSE 0 END) as criticos,
        AVG(ticket.resolutionTimeMinutes) as tiempo_promedio_resolucion
      FROM ticket
      JOIN campus ON ticket.campusId = campus.id
      WHERE ${prisma.raw(JSON.stringify(where))}
      GROUP BY campus.id, campus.code, campus.name
      ORDER BY total DESC
    `;

    return stats as any[];
  },

  // ========================================================
  // GET DASHBOARD STATS BY TECHNICIAN
  // ========================================================
  async getStatsByTechnician(filters: { academicPeriodId?: string } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const stats = await prisma.$queryRaw`
      SELECT 
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        COUNT(ticket.id) as total,
        SUM(CASE WHEN ticket.statusId = 'NUEVO' THEN 1 ELSE 0 END) as nuevos,
        SUM(CASE WHEN ticket.statusId = 'EN_PROCESO' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN ticket.statusId = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN ticket.statusId = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN ticket.statusId = 'CERRADO' THEN 1 ELSE 0 END) as cerrados,
        SUM(CASE WHEN ticket.priorityId = 'CRITICA' THEN 1 ELSE 0 END) as criticos,
        AVG(ticket.resolutionTimeMinutes) as tiempo_promedio_resolucion,
        COUNT(DISTINCT ticket.assigneeId) as carga_trabajo
      FROM ticket
      JOIN user ON ticket.assigneeId = user.id
      WHERE ${prisma.raw(JSON.stringify(where))}
      GROUP BY user.id, user.firstName, user.lastName, user.email
      ORDER BY total DESC
    `;

    return stats as any[];
  },

  // ========================================================
  // GET DASHBOARD STATS BY PRIORITY
  // ========================================================
  async getStatsByPriority(filters: { campusId?: string; departmentId?: string; academicPeriodId?: string } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const stats = await prisma.$queryRaw`
      SELECT 
        priority.id,
        priority.code,
        priority.name,
        COUNT(ticket.id) as total,
        CASE priority.code
          WHEN 'CRITICA' THEN 25
          WHEN 'ALTA' THEN 20
          WHEN 'NORMAL' THEN 15
          WHEN 'BAJA' THEN 10
        END as order_val
      FROM ticket
      JOIN priority ON ticket.priorityId = priority.id
      WHERE ${prisma.raw(JSON.stringify(where))}
      GROUP BY priority.id, priority.code, priority.name
      ORDER BY order_val DESC
    `;

    const total = await prisma.ticket.count({ where });
    return stats as any[];
  },

  // ========================================================
  // GET DASHBOARD STATS BY CATEGORY
  // ========================================================
  async getStatsByCategory(filters: { campusId?: string; academicPeriodId?: string } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const stats = await prisma.$queryRaw`
      SELECT 
        category.id,
        category.code,
        category.name,
        COUNT(ticket.id) as total,
        SUM(CASE WHEN ticket.statusId = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN ticket.statusId = 'CERRADO' THEN 1 ELSE 0 END) as cerrados
      FROM ticket
      JOIN category ON ticket.categoryId = category.id
      WHERE ${prisma.raw(JSON.stringify(where))}
      GROUP BY category.id, category.code, category.name
      ORDER BY total DESC
    `;

    const total = await prisma.ticket.count({ where });
    return stats.map((s: any) => ({
      ...s,
      porcentaje: total > 0 ? Math.round((s.total / total) * 100 * 100) / 100 : 0,
    }));
  },

  // ========================================================
  // GET EVOLUTION TEMPORAL
  // ========================================================
  async getEvolutionTemporal(filters: { campusId?: string; academicPeriodId?: string; months?: number } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const months = filters.months || 12;

    const evolution = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(ticket.createdAt, '%Y-%m') as mes,
        COUNT(ticket.id) as total,
        SUM(CASE WHEN ticket.statusId = 'NUEVO' THEN 1 ELSE 0 END) as nuevos,
        SUM(CASE WHEN ticket.statusId = 'RESUELTO' THEN 1 ELSE 0 END) as resueltos
      FROM ticket
      WHERE ${prisma.raw(JSON.stringify(where))}
        AND ticket.createdAt >= DATE_SUB(NOW(), INTERVAL ${months} MONTH)
      GROUP BY DATE_FORMAT(ticket.createdAt, '%Y-%m')
      ORDER BY mes DESC
    `;

    return evolution as any[];
  },

  // ========================================================
  // GET REASIGNED TICKETS STATS
  // ========================================================
  async getReassignedStats(filters: { campusId?: string; academicPeriodId?: string } = {}): Promise<{
    totalReassignments: number;
    ticketsReasignados: number;
    byReason?: Array<{ reason: string; count: number }>;
  }> {
    const where: any = {};
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;

    const [totalReassignments, ticketsReasignados, byReason] = await Promise.all([
      prisma.ticketReassignments.count({ where }),
      // Contar tickets únicos reasignados
      prisma.ticketReassignments.findMany({
        where,
        select: { toUserId: true },
        distinct: ['toUserId'],
      }),
      prisma.ticketReassignments.findMany({
        where,
        select: { reason: true },
        orderBy: { _count: { reason: 'desc' } },
      }),
    ]);

    const uniqueTicketsReasignados = ticketsReasignados.length;

    const reasonStats = byReason.map((br: any) => ({
      reason: br.reason || 'Sin especificar',
      count: br._count.reason,
    }));

    return {
      totalReassignments,
      ticketsReasignados: uniqueTicketsReasignados,
      byReason: reasonStats.length > 0 ? reasonStats : undefined,
    };
  },
};