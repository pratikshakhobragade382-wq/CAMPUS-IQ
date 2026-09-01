const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Campus IQ Main School',
      subdomain: 'school1',
      email: 'admin@campusiq.com',
    },
  });

  console.log('✅ Tenant initialized successfully:', tenant);
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed tenant:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
