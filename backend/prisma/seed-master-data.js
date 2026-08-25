const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anyRow = await prisma.masterData.findFirst();
  if (!anyRow) {
    throw new Error('No existing MasterData rows found — cannot infer tenantId.');
  }
  const tenantId = anyRow.tenantId;
  console.log(`Using tenantId=${tenantId}`);

  const data = {
    Religion: ['Christian', 'Hindu', 'Islam', 'Buddhist', 'Sikh', 'Jewish', 'Other'],
    Category: ['General', 'OBC', 'SC', 'ST', 'EWS'],
    Gender: ['Male', 'Female', 'Other'],
    HolidayType: ['Public', 'School', 'Regional'],
    House: ['Red House', 'Blue House', 'Green House', 'Yellow House'],
    MaritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'],
    Nationality: ['Indian', 'Foreign National'],
    MotherTongue: ['Hindi', 'Marathi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'],
  };

  const records = [];
  for (const [category, values] of Object.entries(data)) {
    for (const value of values) {
      records.push({ category, value, tenantId, isActive: true });
    }
  }

  const result = await prisma.masterData.createMany({
    data: records,
    skipDuplicates: true, // @@unique([category, value, tenantId])
  });

  console.log(`Inserted ${result.count} master data values.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
