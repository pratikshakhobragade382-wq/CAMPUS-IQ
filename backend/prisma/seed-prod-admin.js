/**
 * ONE-TIME PRODUCTION SEED SCRIPT
 * Run this ONCE against your production database to create tenant + admin user.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
 *   node backend/prisma/seed-prod-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const ADMIN_NAME     = "Admin";
const ADMIN_EMAIL    = "admin@campusiq.com";
const ADMIN_PASSWORD = "Admin@123";
const TENANT_ID      = 1;
const TENANT_NAME    = "Campus IQ Main School";
const TENANT_DOMAIN  = "school1";

async function main() {
  console.log("Starting production seed...");
  console.log("DB:", process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@"));

  const tenant = await prisma.tenant.upsert({
    where:  { id: TENANT_ID },
    update: {},
    create: {
      id:        TENANT_ID,
      name:      TENANT_NAME,
      subdomain: TENANT_DOMAIN,
      email:     ADMIN_EMAIL,
    },
  });
  console.log("Tenant ready:", tenant.name, "(id=" + tenant.id + ")");

  const existing = await prisma.user.findUnique({
    where: { email_tenantId: { email: ADMIN_EMAIL, tenantId: TENANT_ID } },
  });

  if (existing) {
    console.log("Admin already exists:", ADMIN_EMAIL, "| tenantId =", TENANT_ID);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      identity: "admin",
      tenantId: TENANT_ID,
    },
  });

  console.log("Admin user created!");
  console.log("  Email:   ", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
  console.log("  TenantId:", TENANT_ID);
}

main()
  .catch((e) => { console.error("Seed failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
