const { PrismaClient } = require('@prisma/client');

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  // Avoid logging raw SQL queries/params in production (can leak PII/secrets into logs).
  log: isProduction ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
  errorFormat: isProduction ? 'minimal' : 'pretty',
});

module.exports = prisma;