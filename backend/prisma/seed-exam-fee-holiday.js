const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  const tenantId = 1;
  const academicYearId = 12; // 2026-2027 active year
  const yearStart = new Date('2026-07-01');
  const yearEnd = new Date('2027-04-01');

  // ---------- HOLIDAYS ----------
  const holidayNames = [
    { name: 'Independence Day', date: '2026-08-15', type: 'public' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'public' },
    { name: 'Diwali', date: '2026-11-08', type: 'public' },
    { name: 'Christmas', date: '2026-12-25', type: 'public' },
    { name: 'Republic Day', date: '2027-01-26', type: 'public' },
    { name: 'Holi', date: '2027-03-04', type: 'public' },
    { name: 'Founders Day', date: '2026-09-12', type: 'school' },
    { name: 'Annual Sports Day', date: '2026-12-15', type: 'school' },
    { name: 'Maharashtra Day', date: '2027-05-01', type: 'regional' },
  ];
  const holidayRecords = holidayNames.map((h) => ({
    tenantId,
    academicYearId,
    name: h.name,
    date: new Date(h.date),
    holidayType: h.type,
  }));
  const holidayResult = await prisma.holiday.createMany({
    data: holidayRecords,
    skipDuplicates: true, // @@unique([tenantId, date])
  });
  console.log(`Holidays inserted: ${holidayResult.count}`);

  // ---------- SUBJECTS ----------
  const subjectList = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Hindi', code: 'HIN' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'Physical Education', code: 'PE' },
    { name: 'Art', code: 'ART' },
  ];
  const subjectRecords = subjectList.map((s) => ({ ...s, tenantId }));
  const subjectResult = await prisma.subject.createMany({
    data: subjectRecords,
    skipDuplicates: true, // @@unique([code, tenantId])
  });
  console.log(`Subjects inserted: ${subjectResult.count}`);

  // ---------- FEE STRUCTURES ----------
  const feeCategories = await prisma.feeCategory.findMany({ where: { tenantId, isActive: true } });
  const classes = await prisma.class.findMany({ where: { tenantId, isDeleted: false } });

  const feeStructureRecords = [];
  for (const cls of classes) {
    for (const cat of feeCategories) {
      feeStructureRecords.push({
        tenantId,
        academicYearId,
        classId: cls.id,
        feeCategoryId: cat.id,
        amount: (5000 + Math.floor(Math.random() * 15000)).toFixed(2),
        frequency: 'annual',
        isActive: true,
      });
    }
  }
  // FeeStructure has no @@unique constraint visible, so avoid duplicate combos manually
  const existingStructures = await prisma.feeStructure.findMany({
    where: { tenantId, academicYearId },
    select: { classId: true, feeCategoryId: true },
  });
  const existingKeys = new Set(existingStructures.map(s => `${s.classId}-${s.feeCategoryId}`));
  const newStructures = feeStructureRecords.filter(
    (r) => !existingKeys.has(`${r.classId}-${r.feeCategoryId}`)
  );

  let feeStructureCount = 0;
  if (newStructures.length > 0) {
    const result = await prisma.feeStructure.createMany({ data: newStructures });
    feeStructureCount = result.count;
  }
  console.log(`Fee structures inserted: ${feeStructureCount}`);

  // ---------- FEE COLLECTIONS ----------
  const allStructures = await prisma.feeStructure.findMany({ where: { tenantId, academicYearId } });
  const students = await prisma.student.findMany({ where: { tenantId, isDeleted: false } });
  const staffMember = await prisma.staff.findFirst({ where: { tenantId } });

  if (allStructures.length === 0 || students.length === 0 || !staffMember) {
    console.log('Skipping fee collections — missing structures, students, or staff.');
  } else {
    const paymentModes = ['cash', 'online', 'cheque', 'upi'];
    const collectionRecords = [];
    let receiptCounter = 1000;

    for (const student of students) {
      // Pick a structure matching the student's class if possible, else random
      const matching = allStructures.filter((s) => s.classId === student.classId);
      const structure = matching.length > 0 ? matching[Math.floor(Math.random() * matching.length)] : allStructures[Math.floor(Math.random() * allStructures.length)];

      const amount = parseFloat(structure.amount);
      const discount = Math.random() < 0.2 ? Math.floor(amount * 0.05) : 0;
      const fine = Math.random() < 0.1 ? Math.floor(amount * 0.02) : 0;
      const netAmount = amount - discount + fine;

      collectionRecords.push({
        tenantId,
        receiptNo: `RCT-${receiptCounter++}`,
        studentId: student.id,
        feeStructureId: structure.id,
        academicYearId,
        amount,
        discount,
        fine,
        netAmount,
        paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
        paymentDate: randomDate(yearStart, new Date()),
        collectedById: staffMember.id,
      });
    }

    const collResult = await prisma.feeCollection.createMany({
      data: collectionRecords,
      skipDuplicates: true, // @@unique([receiptNo, tenantId])
    });
    console.log(`Fee collections inserted: ${collResult.count}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
