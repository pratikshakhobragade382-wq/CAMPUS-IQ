const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const field = await prisma.customField.findUnique({
    where: { id: 2 }, // "Student Category"
  });

  if (!field) {
    throw new Error('CustomField id=2 (Student Category) not found.');
  }

  const tenantId = field.tenantId;
  console.log(`Adding options to "${field.displayName}" (tenantId=${tenantId})`);

  const categories = [
    { label: 'General', value: 'general' },
    { label: 'OBC', value: 'obc' },
    { label: 'SC', value: 'sc' },
    { label: 'ST', value: 'st' },
    { label: 'EWS', value: 'ews' },
  ];

  const records = categories.map((c, i) => ({
    customFieldId: field.id,
    label: c.label,
    value: c.value,
    priority: i + 1,
    isActive: true,
    tenantId,
  }));

  const result = await prisma.customFieldOption.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} custom field options.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
