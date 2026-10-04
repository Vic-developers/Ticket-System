import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './common/middleware.js';
import { authenticate, AuthenticatedRequest } from './common/auth.js';
import prisma from './common/prisma.js';

// Import routes
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import campusRoutes from './modules/campuses/routes.js';
import departmentRoutes from './modules/departments/routes.js';
import academicPeriodRoutes from './modules/academic-periods/routes.js';
import categoryRoutes from './modules/categories/routes.js';
import ticketTypeRoutes from './modules/ticket-types/routes.js';
import priorityRoutes from './modules/priorities/routes.js';
import statusRoutes from './modules/statuses/routes.js';
import channelRoutes from './modules/channels/routes.js';
import assignmentRuleRoutes from './modules/assignment-rules/routes.js';
import ticketRoutes from './modules/tickets/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import reportRoutes from './modules/reports/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import auditRoutes from './modules/audit/routes.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes, intente más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const apiPrefix = config.apiPrefix;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, authenticate, userRoutes);
app.use(`${apiPrefix}/campuses`, authenticate, campusRoutes);
app.use(`${apiPrefix}/departments`, authenticate, departmentRoutes);
app.use(`${apiPrefix}/academic-periods`, authenticate, academicPeriodRoutes);
app.use(`${apiPrefix}/categories`, authenticate, categoryRoutes);
app.use(`${apiPrefix}/ticket-types`, authenticate, ticketTypeRoutes);
app.use(`${apiPrefix}/priorities`, authenticate, priorityRoutes);
app.use(`${apiPrefix}/statuses`, authenticate, statusRoutes);
app.use(`${apiPrefix}/channels`, authenticate, channelRoutes);
app.use(`${apiPrefix}/assignment-rules`, authenticate, assignmentRuleRoutes);
app.use(`${apiPrefix}/tickets`, authenticate, ticketRoutes);
app.use(`${apiPrefix}/dashboard`, authenticate, dashboardRoutes);
app.use(`${apiPrefix}/reports`, reportsRoutes);
app.use(`${apiPrefix}/notifications`, notificationsRoutes);
app.use(`${apiPrefix}/audit`, auditRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;