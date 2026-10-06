// server.js

require('dotenv').config({ quiet: true });

const { PrismaClient } = require('@prisma/client');

const { validateEnv } = require('./utils/validateEnv');
validateEnv(); // Exits with a clear error if required config (DB, JWT secret) is missing.

const app = require('./app');

const prisma = new PrismaClient();

const PORT = process.env.PORT || 8000;

// Ensure tables exist on boot (especially on Render / production deployments)
async function ensureTables() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamSubjectSchedule" (
        "id" SERIAL NOT NULL,
        "tenantId" INTEGER NOT NULL,
        "examId" INTEGER NOT NULL,
        "subjectId" INTEGER NOT NULL,
        "examDate" DATE NOT NULL,
        "startTime" TEXT,
        "endTime" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ExamSubjectSchedule_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_examId_fkey'
        ) THEN
          ALTER TABLE "ExamSubjectSchedule"
            ADD CONSTRAINT "ExamSubjectSchedule_examId_fkey"
            FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_subjectId_fkey'
        ) THEN
          ALTER TABLE "ExamSubjectSchedule"
            ADD CONSTRAINT "ExamSubjectSchedule_subjectId_fkey"
            FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ExamSubjectSchedule_tenantId_fkey'
        ) THEN
          ALTER TABLE "ExamSubjectSchedule"
            ADD CONSTRAINT "ExamSubjectSchedule_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ExamSubjectSchedule_examId_subjectId_key"
        ON "ExamSubjectSchedule"("examId", "subjectId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ExamSubjectSchedule_tenantId_examId_idx"
        ON "ExamSubjectSchedule"("tenantId", "examId");
    `);
    console.log('ExamSubjectSchedule table verified/created in database.');
  } catch (err) {
    console.error('ensureTables notice:', err.message);
  }
}

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
    await ensureTables();
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