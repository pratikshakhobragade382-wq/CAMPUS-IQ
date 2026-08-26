const prisma = require("./src/prisma/prismaClient");

async function fix() {
  try {
    console.log("Adding User columns...");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."User"
        ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "phone" TEXT;
    `);

    console.log("User columns added.");

    console.log("Adding Tenant columns...");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Tenant"
        ADD COLUMN IF NOT EXISTS "address" TEXT,
        ADD COLUMN IF NOT EXISTS "defaultAcademicYear" TEXT,
        ADD COLUMN IF NOT EXISTS "defaultClass" TEXT,
        ADD COLUMN IF NOT EXISTS "defaultSection" TEXT,
        ADD COLUMN IF NOT EXISTS "email" TEXT,
        ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "phone" TEXT,
        ADD COLUMN IF NOT EXISTS "website" TEXT;
    `);

    console.log("Tenant columns added.");
    console.log("Database columns fixed successfully.");
  } catch (error) {
    console.error("Database fix failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
