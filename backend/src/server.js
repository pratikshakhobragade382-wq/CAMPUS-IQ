// server.js

require('dotenv').config({ quiet: true });

const { PrismaClient } = require('@prisma/client');

const { validateEnv } = require('./utils/validateEnv');
validateEnv(); // Exits with a clear error if required config (DB, JWT secret) is missing.

const app = require('./app');

const prisma = new PrismaClient();

const PORT = process.env.PORT || 8000;

// Create the default tenant if it does not exist.
// This is mainly required for the first production deployment.
async function ensureDefaultTenant() {
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      id: 1,
    },
  });

  if (!existingTenant) {
    await prisma.tenant.create({
      data: {
        id: 1,
        name: 'Campus IQ School',
        subdomain: 'school1',
      },
    });

    console.log('Default tenant created successfully.');
  } else {
    console.log('Default tenant already exists.');
  }
}

async function startServer() {
  try {
    await ensureDefaultTenant();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();