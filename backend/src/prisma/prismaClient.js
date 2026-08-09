require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. Prisma may fail to connect.');
}

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  // Avoid logging raw SQL queries/params in production (can leak PII/secrets into logs).
  log: isProduction ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
  errorFormat: isProduction ? 'minimal' : 'pretty',
});

module.exports = prisma;