const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  console.log(`Seeding academic year, exams, and sample students for tenantId=${tenantId}...`);

  // 1. Academic Year
  let academicYear = await prisma.academicYear.findFirst({
    where: { name: '2026-2027', tenantId, isDeleted: false },
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isActive: true,
        tenantId,
        isDeleted: false,
      },
    });
    console.log('Created Academic Year 2026-2027');
  }

  // 2. Fetch Classes
  const classes = await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    include: { sections: true },
    orderBy: { id: 'asc' },
  });

  if (classes.length === 0) {
    console.log('No classes found. Please run seed-classes-subjects.js first.');
    return;
  }

  // 3. Create Exams for each class
  const examTemplates = [
    { name: 'Unit Test 1 (2026)', examType: 'unit_test_1', startDate: '2026-07-15', endDate: '2026-07-22' },
    { name: 'Half Yearly Examination', examType: 'half_yearly', startDate: '2026-09-20', endDate: '2026-09-30' },
    { name: 'Unit Test 2 (2026)', examType: 'unit_test_2', startDate: '2026-11-10', endDate: '2026-11-17' },
    { name: 'Annual Final Examination', examType: 'annual', startDate: '2027-03-01', endDate: '2027-03-15' },
  ];

  for (const cls of classes) {
    for (const tpl of examTemplates) {
      const existingExam = await prisma.exam.findFirst({
        where: {
          name: `${cls.name} - ${tpl.name}`,
          classId: cls.id,
          academicYearId: academicYear.id,
          tenantId,
        },
      });

      if (!existingExam) {
        await prisma.exam.create({
          data: {
            name: `${cls.name} - ${tpl.name}`,
            examType: tpl.examType,
            classId: cls.id,
            academicYearId: academicYear.id,
            startDate: new Date(tpl.startDate),
            endDate: new Date(tpl.endDate),
            isActive: true,
            tenantId,
          },
        });
      }
    }
  }
  console.log(`Created exam schedules for ${classes.length} classes.`);

  // 4. Sample Students for marks testing
  const sampleStudentNames = [
    'Aarav Sharma', 'Ananya Patel', 'Rohan Gupta', 'Sneha Deshmukh',
    'Ishaan Verma', 'Pooja Kulkarni', 'Aditya Joshi', 'Riya Mehra',
    'Siddharth Nair', 'Kavya Reddy'
  ];

  for (const cls of classes) {
    const sec = cls.sections[0];
    for (let i = 0; i < sampleStudentNames.length; i++) {
      const sName = sampleStudentNames[i];
      const admNo = `ADM-${cls.id}-${100 + i + 1}`;
      
      const existingStudent = await prisma.student.findUnique({
        where: {
          admissionNo_tenantId: { admissionNo: admNo, tenantId }
        }
      });

      if (!existingStudent) {
        await prisma.student.create({
          data: {
            admissionNo: admNo,
            studentName: sName,
            rollNo: String(i + 1),
            classId: cls.id,
            sectionId: sec ? sec.id : null,
            tenantId,
            gender: i % 2 === 0 ? 'male' : 'female',
            dateOfAdmission: new Date('2026-06-01'),
            isDeleted: false,
          }
        });
      }
    }
  }
  console.log('Sample students enrolled in classes.');
  console.log('✅ Exam seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Exam seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
