import app from './app.js';
import { config } from './config/index.js';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    TICKET SYSTEM API                         ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(48)} ║
║  Server running on port: ${String(config.port).padEnd(42)} ║
║  API Prefix: ${config.apiPrefix.padEnd(52)} ║
║  Health check: http://localhost:${config.port}/health${' '.repeat(29)}║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();