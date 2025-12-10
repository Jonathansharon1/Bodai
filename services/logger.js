import pino from 'pino';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  base: {
    service: 'bodai-api',
    env: process.env.NODE_ENV || 'development'
  }
});

// Request ID tracking middleware helper
export const createRequestLogger = (requestId) => {
  return logger.child({ requestId });
};

// Helper to create child logger with context
export const createContextLogger = (context = {}) => {
  return logger.child(context);
};

// Export default logger
export default logger;

