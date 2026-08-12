const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anyClass = await prisma.class.findFirst({ orderBy: { id: 'asc' } });
  if (!anyClass) {
    throw new Error('No existing Class rows found — cannot infer tenantId.');
  }
  const tenantId = anyClass.tenantId;
  console.log(`Using tenantId=${tenantId}`);

  // Desired class names: your existing 1–12, plus Nursery/LKG/UKG on top
  const desiredClassNames = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => String(i + 1))];

  const existingClasses = await prisma.class.findMany({ where: { tenantId } });
  const existingNames = new Set(existingClasses.map((c) => c.name));

  const toCreate = desiredClassNames.filter((n) => !existingNames.has(n));
  console.log(`Creating ${toCreate.length} new classes:`, toCreate);

  for (const name of toCreate) {
    await prisma.class.create({ data: { name, tenantId, isDeleted: false } });
  }

  // Reload full class list (existing + newly created)
  const allClasses = await prisma.class.findMany({ where: { tenantId } });

  // Add sections B, C, D, E to every class (A already exists per your screenshot)
  const sectionNames = ['A', 'B', 'C', 'D', 'E'];
  const sectionRecords = [];
  for (const cls of allClasses) {
    for (const sName of sectionNames) {
      sectionRecords.push({
        name: sName,
        classId: cls.id,
        tenantId,
        isDeleted: false,
      });
    }
  }

  const result = await prisma.section.createMany({
    data: sectionRecords,
    skipDuplicates: true, // protects existing "A" sections via @@unique([name, classId, tenantId])
  });

  console.log(`Inserted ${result.count} new section records.`);
  console.log(`Total classes now: ${allClasses.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
