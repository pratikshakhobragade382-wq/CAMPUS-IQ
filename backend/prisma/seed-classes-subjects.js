const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  console.log(`Seeding classes, sections, and subjects for tenantId=${tenantId}...`);

  // Classes
  const classNames = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
  ];

  const sectionNames = ['A', 'B', 'C'];

  for (const name of classNames) {
    const existingClass = await prisma.class.findFirst({
      where: { name, tenantId, isDeleted: false },
    });

    let cls = existingClass;
    if (!cls) {
      cls = await prisma.class.create({
        data: { name, tenantId, isDeleted: false },
      });
      console.log(`Created class: ${name}`);
    }

    // Create sections A, B, C for each class
    for (const sName of sectionNames) {
      const existingSec = await prisma.section.findFirst({
        where: { name: sName, classId: cls.id, tenantId, isDeleted: false },
      });

      if (!existingSec) {
        await prisma.section.create({
          data: { name: sName, classId: cls.id, tenantId, isDeleted: false },
        });
      }
    }
  }

  // Subjects
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH101' },
    { name: 'Science', code: 'SCI102' },
    { name: 'English', code: 'ENG103' },
    { name: 'Social Studies', code: 'SST104' },
    { name: 'Hindi', code: 'HIN105' },
    { name: 'Computer Science', code: 'CS106' },
    { name: 'Physics', code: 'PHY201' },
    { name: 'Chemistry', code: 'CHE202' },
    { name: 'Biology', code: 'BIO203' },
  ];

  for (const sub of subjectsData) {
    const existingSub = await prisma.subject.findFirst({
      where: { code: sub.code, tenantId, isDeleted: false },
    });

    if (!existingSub) {
      await prisma.subject.create({
        data: { name: sub.name, code: sub.code, tenantId, isDeleted: false },
      });
      console.log(`Created subject: ${sub.name} (${sub.code})`);
    }
  }

  console.log('✅ Classes, sections, and subjects seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
