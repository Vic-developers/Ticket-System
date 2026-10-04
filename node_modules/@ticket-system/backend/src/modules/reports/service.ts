import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

interface ReportFilters {
  year?: number;
  quarter?: number;
  campusId?: string;
  departmentId?: string;
  categoryId?: string;
  subcategoryId?: string;
  ticketTypeId?: string;
  priorityId?: string;
  statusId?: string;
  requesterId?: string;
  assigneeId?: string;
  academicPeriodId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AcademicReportFilters {
  year?: number;
  quarter?: number;
  campusId?: string;
  categoryId?: string;
  technicianId?: string;
  statusId?: string;
  priorityId?: string;
}

export const reportsService = {
  // ========================================================
  // GET ACADEMIC REPORT (by cuatrimestre)
  // ========================================================
  async getAcademicReport(filters: AcademicReportFilters) {
    const where: any = {};
    
    if (filters.year) where.year = filters.year;
    if (filters.quarter) where.quarter = filters.quarter;
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.technicianId) where.assigneeId = filters.technicianId;
    if (filters.statusId) where.statusId = filters.statusId;
    if (filters.priorityId) where.priorityId = filters.priorityId;

    // Obtener tickets filtrados
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        campus: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        priority: { select: { id: true, code: true, name: true } },
        status: { select: { id: true, code: true, name: true } },
        ticketType: { select: { id: true, code: true, name: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const totalTickets = tickets.length;
    const ticketsResueltos = tickets.filter(t => t.status.code === 'RESUELTO').length;
    const ticketsPendientes = tickets.filter(t => t.status.code === 'PENDIENTE').length;
    const ticketsCerrados = tickets.filter(t => t.status.code === 'CERRADO').length;
    const ticketsCriticos = tickets.filter(t => t.priority.code === 'CRITICA').length;

    const priorityDist: Record<string, number> = {};
    const categoryDist: Record<string, number> = {};

    tickets.forEach(t => {
      const pri = t.priority.code;
      priorityDist[pri] = (priorityDist[pri] || 0) + 1;
      
      const cat = t.category.code;
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    });

    // Distribución por mes
    const monthlyDist: Record<string, number> = {};
    tickets.forEach(t => {
      const month = t.createdAt?.toISOString().substring(0, 7);
      if (month) {
        monthlyDist[month] = (monthlyDist[month] || 0) + 1;
      }
    });

    // Tiempo promedio de resolución (solo los resueltos)
    const resolvedTickets = tickets.filter(t => t.status.code === 'RESUELTO');
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const minutes = t.resolutionTimeMinutes || 0;
          return sum + minutes;
        }, 0) / resolvedTickets.length
      : 0;

    // Tiempo promedio de atención (time to first response)
    const withFirstResponse = tickets.filter(t => t.firstResponseAt);
    const avgFirstResponse = withFirstResponse.length > 0
      ? withFirstResponse.reduce((sum, t) => {
          const minutes = Math.round(
            (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 60000
          );
          return sum + minutes;
        }, 0) / withFirstResponse.length
      : 0;

    return {
      filtros: filters,
      resumen: {
        totalTickets,
        ticketsResueltos,
        ticketsPendientes,
        ticketsCerrados,
        ticketsCriticos,
        porcentajeResolucion: totalTickets > 0 ? Math.round((ticketsResueltos / totalTickets) * 100 * 100) / 100 : 0,
      },
      distribucion: {
        porPrioridad: priorityDist,
        porCategoria: categoryDist,
        porMes: monthlyDist,
      },
      tiempos: {
        promedioResolucion: Math.round(avgResolutionTime),
        promedioPrimeraAtencion: Math.round(avgFirstResponse),
      },
      tickets: tickets.map(t => ({
        id: t.id,
        numeroTicket: t.ticketNumber,
        titulo: t.title,
        solicitante: t.requesterEmail,
        tecnico: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Sin asignar',
        categoria: t.category.code,
        prioridad: t.priority.code,
        estado: t.status.code,
        creado: t.createdAt,
        ...(t.resolutionTimeMinutes && { tiempoResolucion: t.resolutionTimeMinutes }),
        ...(t.firstResponseAt && { tiempoPrimeraAtencion: Math.round(
          (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 60000
        ) }),
      })),
    };
  },

  // ========================================================
  // GET CUSTOM REPORT (with multiple filters)
  // ========================================================
  async getCustomReport(filters: ReportFilters) {
    const where: any = {};

    if (filters.year) where.year = filters.year;
    if (filters.quarter) where.quarter = filters.quarter;
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
    if (filters.ticketTypeId) where.ticketTypeId = filters.ticketTypeId;
    if (filters.priorityId) where.priorityId = filters.priorityId;
    if (filters.statusId) where.statusId = filters.statusId;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;
    if (filters.dateFrom) where.createdAt = { ...where.createdAt, gte: filters.dateFrom };
    if (filters.dateTo) where.createdAt = { ...where.createdAt, lte: filters.dateTo };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        campus: { select: { id: true, code: true, name: true } },
        department: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subcategory: { select: { id: true, code: true, name: true } },
        priority: { select: { id: true, code: true, name: true, color: true } },
        status: { select: { id: true, code: true, name: true, color: true } },
        ticketType: { select: { id: true, code: true, name: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTickets = tickets.length;

    // Estadísticas rápidas
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    tickets.forEach(t => {
      const status = t.status.code;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const pri = t.priority.code;
      priorityCounts[pri] = (priorityCounts[pri] || 0) + 1;

      const cat = t.category.code;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      filtros: filters,
      resumen: {
        totalTickets,
        porEstado: statusCounts,
        porPrioridad: priorityCounts,
        porCategoria: categoryCounts,
      },
      tickets: tickets.map(t => ({
        id: t.id,
        numeroTicket: t.ticketNumber,
        titulo: t.title,
        descripcion: t.description,
        solicitante: t.requesterEmail,
        tecnico: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Sin asignar',
        campus: t.campus?.code,
        departamento: t.department?.code,
        categoria: t.category.code,
        subcategoria: t.subcategory?.code,
        tipo: t.ticketType.code,
        prioridad: t.priority.code,
        estado: t.status.code,
        canal: t.channel?.code,
        creado: t.createdAt,
        asignado: t.assignedAt,
        ...(t.resolutionTimeMinutes && { tiempoResolucion: t.resolutionTimeMinutes }),
        ...(t.responseTimeMinutes && { tiempoRespuesta: t.responseTimeMinutes }),
      })),
    };
  },

  // ========================================================
  // GET REPORT BY CAMPUS
  // ========================================================
  async getReportByCampus(campusId: string, filters: ReportFilters = {}) {
    const where: any = { campusId };
    Object.assign(where, filters);

    return this.getCustomReport(where);
  },

  // ========================================================
  // GET REPORT BY PERIOD
  // ========================================================
  async getReportByPeriod(year: number, quarter: number, filters: ReportFilters = {}) {
    const where: any = { year, quarter };
    Object.assign(where, filters);

    return this.getCustomReport(where);
  },

  // ========================================================
  // GET STATS FOR REPORT EXPORT
  // ========================================================
  async getExportStats(filters: ReportFilters) {
    const where: any = {};

    if (filters.year) where.year = filters.year;
    if (filters.quarter) where.quarter = filters.quarter;
    if (filters.campusId) where.campusId = filters.campusId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
    if (filters.ticketTypeId) where.ticketTypeId = filters.ticketTypeId;
    if (filters.priorityId) where.priorityId = filters.priorityId;
    if (filters.statusId) where.statusId = filters.statusId;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.academicPeriodId) where.academicPeriodId = filters.academicPeriodId;
    if (filters.dateFrom) where.createdAt = { ...where.createdAt, gte: filters.dateFrom };
    if (filters.dateTo) where.createdAt = { ...where.createdAt, lte: filters.dateTo };

    const [totalTickets, byStatus, byPriority, byCategory, byCampus] = await Promise.all([
      prisma.ticket.count({ where }),
      // Por estado
      prisma.ticket.groupBy({
        by: ['statusId'],
        where,
        _count: { statusId: true },
      }),
      // Por prioridad
      prisma.ticket.groupBy({
        by: ['priorityId'],
        where,
        _count: { priorityId: true },
      }),
      // Por categoría
      prisma.ticket.groupBy({
        by: ['categoryId'],
        where,
        _count: { categoryId: true },
      }),
      // Por recinto
      prisma.ticket.groupBy({
        by: ['campusId'],
        where,
        _count: { campusId: true },
      }),
    ]);

    // Enriquecer con nombres
    const statusNames = await prisma.ticketStatusModel.findMany({
      where: { code: { in: Object.keys(byStatus.map(s => s.statusId)) } },
      select: { id: true, code: true, name: true },
    });
    const priorityNames = await prisma.priority.findMany({
      where: { code: { in: Object.keys(byPriority.map(p => p.priorityId)) } },
      select: { id: true, code: true, name: true },
    });
    const categoryNames = await prisma.category.findMany({
      where: { code: { in: Object.keys(byCategory.map(c => c.categoryId)) } },
      select: { id: true, code: true, name: true },
    });
    const campusNames = await prisma.campus.findMany({
      where: { code: { in: Object.keys(byCampus.map(c => c.campusId)) } },
      select: { id: true, code: true, name: true },
    });

    return {
      totalTickets,
      porEstado: byStatus.reduce((acc: Record<string, number>, curr: any) => {
        const name = statusNames.find(s => s.id === curr.statusId)?.name || curr.statusId;
        acc[name] = curr._count.statusId;
        return acc;
      }, {}),
      porPrioridad: byPriority.reduce((acc: Record<string, number>, curr: any) => {
        const name = priorityNames.find(p => p.id === curr.priorityId)?.name || curr.priorityId;
        acc[name] = curr._count.priorityId;
        return acc;
      }, {}),
      porCategoria: byCategory.reduce((acc: Record<string, number>, curr: any) => {
        const name = categoryNames.find(c => c.id === curr.categoryId)?.name || curr.categoryId;
        acc[name] = curr._count.categoryId;
        return acc;
      }, {}),
      porCampus: byCampus.reduce((acc: Record<string, number>, curr: any) => {
        const name = campusNames.find(c => c.id === curr.campusId)?.name || curr.campusId;
        acc[name] = curr._count.campusId;
        return acc;
      }, {}),
    };
  },
};