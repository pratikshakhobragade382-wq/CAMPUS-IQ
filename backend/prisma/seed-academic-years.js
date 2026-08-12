const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.academicYear.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!existing) {
    throw new Error(
      'No existing AcademicYear rows found — cannot infer tenantId. ' +
      'Pass a tenantId manually by editing this script.'
    );
  }

  const tenantId = existing.tenantId;
  console.log(`Using tenantId=${tenantId} (copied from existing record id=${existing.id})`);

  const COUNT = 50;
  const START_YEAR = 1970;

  const records = [];
  for (let i = 0; i < COUNT; i++) {
    const yearStart = START_YEAR + i;
    const yearEnd = yearStart + 1;

    records.push({
      name: `${yearStart}-${yearEnd}`,
      startDate: new Date(`${yearStart}-06-01`),
      endDate: new Date(`${yearEnd}-05-31`),
      isActive: false,
      tenantId,
      isDeleted: false,
    });
  }

  const result = await prisma.academicYear.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} academic year records.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
