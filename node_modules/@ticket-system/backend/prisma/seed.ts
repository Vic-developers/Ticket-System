import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ==========================================================//
// SEED DATA CONFIGURATION
// ==========================================================//

const CAMPUSES = [
  { code: 'SDO', name: 'Santo Domingo', description: 'Recinto principal' },
  { code: 'STI', name: 'Santiago', description: 'Recinto del Cibao' },
  { code: 'SJ', name: 'San Juan', description: 'Recinto Este' },
  { code: 'SP', name: 'San Pedro', description: 'Recrito Sur' },
  { code: 'BAR', name: 'Barahona', description: 'Recinto Sur-Oeste' },
  { code: 'PP', name: 'Puerto Plata', description: 'Recinto Norte' },
];

const DEPARTMENTS = [
  { code: 'TI', name: 'Tecnologías de la Información', description: 'Soporte TI' },
  { code: 'AC', name: 'Academico', description: 'Apoyo academico' },
  { code: 'AD', name: 'Administracion', description: 'Administracion general' },
  { code: 'CO', name: 'Coordination', description: 'Coordination department' },
];

const TECHNICIANS = [
  { name: 'Juan Pérez', email: 'juan.perez@institution.edu', phone: '809-555-0101' },
  { name: 'María Rodríguez', email: 'maria.rodriguez@institution.edu', phone: '809-555-0102' },
  { name: 'Carlos García', email: 'carlos.garcia@institution.edu', phone: '809-555-0103' },
  { name: 'Ana Martínez', email: 'ana.martinez@institution.edu', phone: '809-555-0104' },
  { name: 'Luis Fernández', email: 'luis.fernandez@institution.edu', phone: '809-555-0105' },
  { name: 'Sofía Torres', email: 'sofia.torres@institution.edu', phone: '809-555-0106' },
  { name: 'Roberto Jiménez', email: 'roberto.jimenez@institution.edu', phone: '809-555-0107' },
  { name: 'Carmen Díaz', email: 'carmen.diaz@institution.edu', phone: '809-555-0108' },
];

const SOLICITANTS = [
  { name: 'Estudiante 1', email: 'estudiante1@institution.edu', phone: '809-555-0201' },
  { name: 'Estudiante 2', email: 'estudiante2@institution.edu', phone: '809-555-0202' },
  { name: 'Estudiante 3', email: 'estudiante3@institution.edu', phone: '809-555-0203' },
  { name: 'Estudiante 4', email: 'estudiante4@institution.edu', phone: '809-555-0204' },
  { name: 'Estudiante 5', email: 'estudiante5@institution.edu', phone: '809-555-0205' },
  { name: 'Personal 1', email: 'personal1@institution.edu', phone: '809-555-0206' },
  { name: 'Personal 2', email: 'personal2@institution.edu', phone: '809-555-0207' },
  { name: 'Personal 3', email: 'personal3@institution.edu', phone: '809-555-0208' },
  { name: 'Personal 4', email: 'personal4@institution.edu', phone: '809-555-0209' },
  { name: 'Personal 5', email: 'personal5@institution.edu', phone: '809-555-0210' },
];

const CATEGORIES = [
  { code: 'Moodle', name: 'Moodle', description: 'Plataforma de aprendizaje virtual', parent: null },
  { code: 'Correo', name: 'Correo institucional', description: 'Sistema de correo electrónico', parent: null },
  { code: 'Equipos', name: 'Equipos', description: 'Hardware y equipos tecnicos', parent: null },
  { code: 'Accesos', name: 'Accesos', description: 'Sistemas y accesos', parent: null },
  { code: 'Otros', name: 'Otros', description: 'Otras categorías', parent: null },
];

const SUBGROUPS_Moodle = [
  { code: 'Acceso', name: 'Acceso', description: 'Problemas de acceso a Moodle' },
  { code: 'Cursos', name: 'Cursos', description: 'Gestión de cursos' },
  { code: 'Calificaciones', name: 'Calificaciones', description: 'Problemas de calificaciones' },
  { code: 'Actividades', name: 'Actividades', description: 'Actividades y tareas' },
  { code: 'Usuarios', name: 'Usuarios', description: 'Gestión de usuarios' },
  { code: 'Matriculación', name: 'Matriculación', description: 'Procesos de matriculación' },
  { code: 'Configuración', name: 'Configuración', description: 'Configuración del sistema' },
  { code: 'Problemas Técnicos', name: 'Problemas Técnicos', description: 'Problemas técnicos diversos' },
];

const SUBGROUPS_Correo = [
  { code: 'Acceso', name: 'Acceso', description: 'Problemas de acceso al correo' },
  { code: 'Contraseña', name: 'Contraseña', description: 'Restablecimiento de contraseña' },
  { code: 'Configuración', name: 'Configuración', description: 'Configuración de correo' },
  { code: 'Recepción', name: 'Recepción', description: 'Problemas de recepción' },
  { code: 'Envío', name: 'Envío', description: 'Problemas de envío' },
];

const SUBGROUPS_Equipos = [
  { code: 'Computadora', name: 'Computadora', description: 'Problemas de hardware' },
  { code: 'Proyector', name: 'Proyector', description: 'Problemas de proyector' },
  { code: 'Impresora', name: 'Impresora', description: 'Problemas de impresora' },
  { code: 'Red', name: 'Red', description: 'Problemas de conectividad' },
];

const TICKET_TYPES = [
  { code: 'INC', name: 'Incidente', description: 'Incidente técnico' },
  { code: 'SOL', name: 'Solicitud', description: 'Solicitud de servicio' },
  { code: 'CON', name: 'Consulta', description: 'Consulta informativa' },
  { code: 'PRO', name: 'Problema', description: 'Problema general' },
  { code: 'ACC', name: 'Acceso', description: 'Problemas de acceso' },
  { code: 'CONF', name: 'Configuración', description: 'Configuración de sistemas' },
  { code: 'SOP', name: 'Soporte Técnico', description: 'Solicitud de soporte técnico' },
  { code: 'OTRO', name: 'Otro', description: 'Otro tipo de solicitud' },
];

const ACADEMIC_PERIODS_DATA = [
  { code: '2026-01', name: 'Enero - Abril 2026', quarter: 1, start: '2026-01-01', end: '2026-04-30' },
  { code: '2026-02', name: 'Mayo - Agosto 2026', quarter: 2, start: '2026-05-01', end: '2026-08-31' },
  { code: '2026-03', name: 'Septiembre - Diciembre 2026', quarter: 3, start: '2026-09-01', end: '2026-12-31' },
];

const ASSIGNMENT_RULES_DATA = [
  { name: 'Soporte Moodle Santo Domingo', campus: 'SDO', category: 'Moodle', ticketType: 'PROBLEMA', technician: 'Juan Pérez', priority: 10 },
  { name: 'Soporte Correo Santiago', campus: 'STI', category: 'Correo', ticketType: 'PROBLEMA', technician: 'María Rodríguez', priority: 8 },
  { name: 'Soporte Equipos San Juan', campus: 'SJ', category: 'Equipos', ticketType: 'PROBLEMA', technician: 'Carlos García', priority: 9 },
  { name: 'Soporte Accesos Barahona', campus: 'BAR', category: 'Accesos', ticketType: 'ACC', technician: 'Ana Martínez', priority: 7 },
  { name: 'Soporte Técnico General', campus: null, category: null, ticketType: null, technician: 'Luis Fernández', priority: 5 },
  { name: 'Soporte Moodle Santiago', campus: 'STI', category: 'Moodle', ticketType: 'PROBLEMA', technician: 'Juan Pérez', priority: 10 },
  { name: 'Soporte Equipos Santo Domingo', campus: 'SDO', category: 'Equipos', ticketType: 'PROBLEMA', technician: 'Carlos García', priority: 9 },
  { name: 'Soporte Correo San Juan', campus: 'SJ', category: 'Correo', ticketType: 'PROBLEMA', technician: 'María Rodríguez', priority: 8 },
  { name: 'Soporte Accesos Santiago', campus: 'STI', category: 'Accesos', ticketType: 'ACC', technician: 'Ana Martínez', priority: 7 },
  { name: 'Soporte Técnico Nocturno', campus: null, category: null, ticketType: 'SOP', technician: 'Sofía Torres', priority: 6, isNightShift: true },
  { name: 'Soporte Santo Domingo', campus: 'SDO', category: null, ticketType: null, technician: 'Juan Pérez', priority: 6 },
  { name: 'Soporte Santiago', campus: 'STI', category: null, ticketType: null, technician: 'María Rodríguez', priority: 6 },
  { name: 'Soporte Barahona', campus: 'BAR', category: null, ticketType: null, technician: 'Roberto Jiménez', priority: 5 },
  { name: 'Soporte Puerto Plata', campus: 'PP', category: null, ticketType: null, technician: 'Carmen Díaz', priority: 5 },
  { name: 'Soporte Académico', campus: null, category: 'Moodle', ticketType: 'INC', technician: 'Luis Fernández', priority: 7 },
];

// ==========================================================//
// MAIN SEED FUNCTION
// ==========================================================//

async function seed() {
  console.log('🌱 Iniciando seed de datos de demostración...\n');

  // 1. Crear recintos
  console.log('1. Creando recintos...');
  const createdCampuses = [];
  for (const campusData of CAMPUSES) {
    const campus = await prisma.campus.create({
      data: { code: campusData.code, name: campusData.name, description: campusData.description, isActive: true },
    });
    createdCampuses.push(campus);
    console.log(`   ✓ ${campus.code}: ${campus.name}`);
  }

  // 2. Crear departamentos
  console.log('\n2. Creando departamentos...');
  const createdDepartments = [];
  for (const deptData of DEPARTMENTS) {
    const dept = await prisma.department.create({
      data: { code: deptData.code, name: deptData.name, description: deptData.description, isActive: true },
    });
    createdDepartments.push(dept);
    console.log(`   ✓ ${dept.code}: ${dept.name}`);
  }

  // 3. Crear categorías y subcategorías
  console.log('\n3. Creando categorías y subcategorías...');
  const createdCategories = [];

  // Categoría principal: Moodle
  const moodleCat = await prisma.category.create({
    data: { code: 'Moodle', name: 'Moodle', description: 'Plataforma de aprendizaje virtual', isActive: true },
  });
  createdCategories.push(moodleCat);
  console.log(`   ✓ Categoría: Moodle`);

  // Subcategorías de Moodle
  for (const sub of SUBGROUPS_Moodle) {
    await prisma.subcategory.create({
      data: { code: sub.code, name: sub.name, description: sub.description, categoryId: moodleCat.id, isActive: true },
    });
    console.log(`   └─ Subcategoría: ${sub.code}`);
  }

  // Categoría principal: Correo institucional
  const correoCat = await prisma.category.create({
    data: { code: 'Correo', name: 'Correo institucional', description: 'Sistema de correo electrónico', isActive: true },
  });
  createdCategories.push(correoCat);
  console.log(`   ✓ Categoría: Correo institucional`);

  // Subcategorías de Correo
  for (const sub of SUBGROUPS_Correo) {
    await prisma.subcategory.create({
      data: { code: sub.code, name: sub.name, description: sub.description, categoryId: correoCat.id, isActive: true },
    });
    console.log(`   └─ Subcategoría: ${sub.code}`);
  }

  // Categoría principal: Equipos
  const equiposCat = await prisma.category.create({
    data: { code: 'Equipos', name: 'Equipos', description: 'Hardware y equipos tecnicos', isActive: true },
  });
  createdCategories.push(equiposCat);
  console.log(`   ✓ Categoría: Equipos`);

  // Subcategorías de Equipos
  for (const sub of SUBGROUPS_Equipos) {
    await prisma.subcategory.create({
      data: { code: sub.code, name: sub.name, description: sub.description, categoryId: equiposCat.id, isActive: true },
    });
    console.log(`   └─ Subcategoría: ${sub.code}`);
  }

  // Categoría principal: Accesos
  const accesCat = await prisma.category.create({
    data: { code: 'Accesos', name: 'Accesos', description: 'Sistemas y accesos', isActive: true },
  });
  createdCategories.push(accesCat);
  console.log(`   ✓ Categoría: Accesos`);

  // Subcategorías de Accesos (básicas)
  await prisma.subcategory.create({
    data: { code: 'Sistemas', name: 'Sistemas', description: 'Accesos a sistemas', categoryId: accesCat.id, isActive: true },
  });
  await prisma.subcategory.create({
    data: { code: 'Redes', name: 'Redes', description: 'Accesos a redes', categoryId: accesCat.id, isActive: true },
  });
  await prisma.subcategory.create({
    data: { code: 'Contraseñas', name: 'Contraseñas', description: 'Restablecimiento de contraseñas', categoryId: accesCat.id, isActive: true },
  });
  console.log(`   └─ Subcategorías: Sistemas, Redes, Contraseñas`);

  // Categoría: Otros
  const otrosCat = await prisma.category.create({
    data: { code: 'Otros', name: 'Otros', description: 'Otras categorías', isActive: true },
  });
  createdCategories.push(otrosCat);
  console.log(`   ✓ Categoría: Otros`);

  // 4. Crear tipos de solicitud
  console.log('\n4. Creando tipos de solicitud...');
  const createdTicketTypes = [];
  for (const tt of TICKET_TYPES) {
    const ttCreated = await prisma.ticketType.create({
      data: { code: tt.code, name: tt.name, description: tt.description, isActive: true },
    });
    createdTicketTypes.push(ttCreated);
    console.log(`   ✓ ${tt.code}: ${tt.name}`);
  }

  // 5. Crear períodos académicos
  console.log('\n5. Creando períodos académicos...');
  const createdPeriods = [];
  for (const periodData of ACADEMIC_PERIODS_DATA) {
    const period = await prisma.academicPeriod.create({
      data: { code: periodData.code, name: periodData.name, year: 2026, quarter: periodData.quarter, startDate: periodData.start, endDate: periodData.end, isActive: true, campusId: createdCampuses[0].id },
    });
    createdPeriods.push(period);
    console.log(`   ✓ ${period.code}: ${period.name}`);
  }

  // 6. Crear usuarios (admin + técnicos + solicitantes)
  console.log('\n6. Creando usuarios...');
  
  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: { email: 'admin@institution.edu', passwordHash: adminPassword, firstName: 'Admin', lastName: 'Sistemas', role: 'ADMIN', isActive: true, departmentId: createdDepartments[0].id, campusId: createdCampuses[0].id },
  });
  console.log(`   ✓ Admin: admin@institution.edu`);

  // Técnicos (8)
  const technicians = [];
  for (let i = 0; i < 8; i++) {
    const techData = TECHNICANS[i];
    const techPassword = await bcrypt.hash('tecnico123', 12);
    const technician = await prisma.user.create({
      data: { email: techData.email, passwordHash: techPassword, firstName: techData.name.split(' ')[0], lastName: techData.name.split(' ')[1] || '', role: 'TECNICO', isActive: true, departmentId: createdDepartments[i % createdDepartments.length].id, campusId: createdCampuses[i % createdCampuses.length].id },
    });
    technicians.push(technician);
    console.log(`   ✓ Técnico: ${techData.name} (${techData.email})`);
  }

  // Solicitantes (11 - total 20 usuarios)
  const solicitants = [];
  for (let i = 0; i < 11; i++) {
    const solData = SOLICITANTS[i];
    const solPassword = await bcrypt.hash('solicitante123', 12);
    const solicitant = await prisma.user.create({
      data: { email: solData.email, passwordHash: solPassword, firstName: solData.name.split(' ')[0], lastName: solData.name.split(' ')[1] || '', role: 'SOLICITANTE', isActive: true },
    });
    solicitants.push(solicitant);
    console.log(`   ✓ Solicitante: ${solData.name} (${solData.email})`);
  }

  // 7. Crear reglas de asignación (15 reglas)
  console.log('\n7. Creando reglas de asignación...');
  const createdRules = [];

  for (let i = 0; i < ASSIGNMENT_RULES_DATA.length; i++) {
    const ruleData = ASSIGNMENT_RULES_DATA[i];
    
    // Find the technician, campus, category
    const tech = technicians.find(t => t.firstName === ruleData.technician.split(' ')[0]);
    const campus = createdCampuses.find(c => c.code === ruleData.campus);
    const category = createdCategories.find(c => c.code === ruleData.category);
    
    const rule = await prisma.assignmentRule.create({
      data: {
        name: ruleData.name,
        description: `Regla automática para ${ruleData.name}`,
        priority: ruleData.priority,
        campusId: ruleData.campus ? campus!.id : null,
        departmentId: null,
        ticketTypeId: ruleData.ticketType ? createdTicketTypes.find(tt => tt.code === ruleData.ticketType)?.id : null,
        categoryId: category?.id,
        subcategoryId: null,
        priorityId: null,
        academicPeriodId: null,
        assignedUserId: tech!.id,
        createdById: admin.id,
        isActive: true,
      },
    });
    createdRules.push(rule);
    console.log(`   ✓ ${rule.name} → ${tech?.email}`);
  }

  // 8. Crear 500 tickets distribuidos
  console.log('\n8. Creando 500 tickets de demostración...');
  
  const statuses = ['NUEVO', 'EN_PROCESO', 'PENDIENTE', 'RESUELTO', 'CERRADO', 'CANCELADO'];
  const priorities = ['BAJA', 'NORMAL', 'ALTA', 'CRITICA'];
  
  const ticketsData = [];
  
  // Distribuir tickets aleatoriamente
  for (let i = 0; i < 500; i++) {
    const campus = createdCampuses[i % createdCampuses.length];
    const tech = technicians[i % technicians.length];
    const category = createdCategories[i % createdCategories.length];
    const period = createdPeriods[i % createdPeriods.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const ticketType = createdTicketTypes[i % createdTicketTypes.length];
    
    // Generar fecha aleatoria dentro del período
    const periodStart = new Date(period.start);
    const periodEnd = new Date(period.end);
    const randomDate = new Date(periodStart.getTime() + Math.random() * (periodEnd.getTime() - periodStart.getTime()));
    
    // Generar número de ticket
    const ticketNum = `TSK-2026-${String(i + 1).padStart(3, '0')}`;
    
    // Título y descripción basados en categoría
    const titleMap: Record<string, string> = {
      Moodle: 'Problema con acceso a Moodle',
      Correo: 'Problema de acceso al correo institucional',
      Equipos: 'Reporte de equipo dañado',
      Accesos: 'Solicitud de acceso a sistema',
      Otros: 'Solicitud de soporte general',
    };
    
    const title = titleMap[category.code] || 'Solicitud de soporte técnico';
    const description = `Ticket de soporte automático para testing y demostración del sistema. Categoría: ${category.code}. Generado automáticamente para poblar la base de datos.`;
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: ticketNum,
        title,
        description,
        statusId: status,
        priorityId: priority,
        categoryId: category.id,
        subcategoryId: i % 8 === 0 ? (await prisma.subcategory.findFirst({ where: { categoryId: category.id } }))?.id : null,
        ticketTypeId: createdTicketTypes[i % createdTicketTypes.length].id,
        campusId: campus.id,
        departmentId: i % 2 === 0 ? createdDepartments[i % createdDepartments.length].id : null,
        academicPeriodId: period.id,
        requesterEmail: solicitants[i % solicitants.length].email,
        requesterPhone: solicitants[i % solicitants.length].phone,
        assigneeId: tech.id,
        isAutoAssigned: i % 3 !== 0, // 2/3 serán auto-asignados
        assignedAt: Math.random() > 0.3 ? new Date(randomDate.getTime() - 24 * 60 * 60 * 1000) : null,
        firstResponseAt: Math.random() > 0.5 ? new Date(randomDate.getTime() + 30 * 60 * 1000) : null,
        resolvedAt: status === 'RESUELTO' ? new Date(randomDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        closedAt: status === 'CERRADO' ? new Date(randomDate.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        createdAt: randomDate,
        updatedAt: new Date(),
      },
      include: {
        status: true,
        priority: true,
        category: true,
        ticketType: true,
        campus: true,
        assignee: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    
    ticketsData.push(ticket);
    
    if ((i + 1) % 100 === 0) {
      console.log(`   Progres: ${i + 1}/500 tickets creados...`);
    }
  }

  console.log(`   ✓ 500 tickets creados exitosamente`);

  // 9. Crear algunos comentarios y attachments en tickets existentes
  console.log('\n9. Creando comentarios y attachments...');
  
  const sampleComments = [
    'Ticket creado correctamente',
    'Se ha asignado al técnico Juan Pérez',
    'El problema fue resuelto',
    'Se requiere información adicional del solicitante',
    'Se ha realizado un reinicio del sistema',
    'Ticket reasignado por distribución de carga',
    'Gracias por su paciencia',
    'Por favor verificar la configuración de red',
  ];
  
  const sampleInternalComments = [
    'Nota interna: verificar compatibilidad del navegador',
    'Información confidencial: datos del usuario',
    'Prioridad elevada por parte del director',
    'Se contactará al solicitante para coordinación',
  ];
  
  // Add comments to first 50 tickets
  for (let i = 0; i < Math.min(50, ticketsData.length); i++) {
    const ticket = ticketsData[i];
    const numComments = 1 + Math.floor(Math.random() * 4);
    
    for (let j = 0; j < numComments; j++) {
      const isInternal = j % 2 === 0;
      const commentContent = isInternal ? sampleInternalComments[Math.floor(Math.random() * sampleInternalComments.length)] : sampleComments[Math.floor(Math.random() * sampleComments.length)];
      
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: technicians[Math.floor(Math.random() * technicians.length)].id,
          content: commentContent,
          isInternal,
        },
      });
    }
    
    // Add attachments to some tickets
    if (Math.random() > 0.5) {
      const attachments = ['documento.pdf', 'captura-pantalla.png', 'foto-equipo.jpg', 'configuracion.zip'];
      const numAttachments = 1 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numAttachments; j++) {
        const fileName = `attach_${Date.now()}_${j}${attachments[j].split('.').pop()}`;
        const mimeType = attachments[j].includes('.pdf') ? 'application/pdf' : attachments[j].includes('.png') ? 'image/png' : 'application/zip';
        const size = 1024 * (j + 1) * 10; // 10KB to 40KB
        
        await prisma.ticketAttachment.create({
          data: {
            ticketId: ticket.id,
            fileName,
            originalName: attachments[j],
            mimeType,
            size,
            path: `/uploads/tickets/${ticket.id}/${fileName}`,
            userId: technicians[Math.floor(Math.random() * technicians.length)].id,
          },
        });
      }
    }
  }
  console.log(`   ✓ Comentarios y attachments creados`);

  // 10. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DEL SEED');
  console.log('='.repeat(50));
  console.log(`\nRecintos: ${createdCampuses.length}`);
  console.log(`Departamentos: ${createdDepartments.length}`);
  console.log(`Categorías: ${createdCategories.length}`);
  console.log(`Subcategorías: ${await prisma.subcategory.count()}`);
  console.log(`Tipos de solicitud: ${createdTicketTypes.length}`);
  console.log(`Períodos académicos: ${createdPeriods.length}`);
  console.log(`Usuarios: ${await prisma.user.count()} (Admin: 1, Técnicos: ${technicians.length}, Solicitantes: ${solicitants.length})`);
  console.log(`Reglas de asignación: ${createdRules.length}`);
  console.log(`Tickets: ${await prisma.ticket.count()}`);
  console.log(`Comentarios: ${await prisma.ticketComment.count()}`);
  console.log(`Attachments: ${await prisma.ticketAttachment.count()}`);
  console.log(`Reasignaciones: ${await prisma.ticketReassignments.count()}`);
  console.log('\n✅ Seed completado exitosamente!');
  console.log('\nCredenciales de acceso:');
  console.log('   Admin: admin@institution.edu / admin123');
  console.log('   Técnicos: juan.perez@institution.edu / tecnico123, etc.');
  console.log('   Solicitantes: estudiante1@institution.edu / solicitante123, etc.\n');

  await prisma.$disconnect();
}

// Ejecutar seed
seed().catch((e) => {
  console.error('Error durante el seed:', e);
  process.exit(1);
});