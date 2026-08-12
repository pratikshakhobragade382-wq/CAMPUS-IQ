const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function pickStatus() {
  const r = Math.random();
  if (r < 0.90) return 'present';
  if (r < 0.95) return 'absent';
  if (r < 0.98) return 'late';
  return 'half_day';
}

// Returns last N weekday dates (Mon-Fri), most recent first, as JS Date objects at midnight
function lastNWeekdays(n) {
  const dates = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < n) {
    const day = cursor.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

async function main() {
  const tenantId = 1;
  const academicYearId = 12; // 2026-2027 (active year)
  const markedById = 1; // staff id

  const students = await prisma.student.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true, classId: true, sectionId: true },
  });

  if (students.length === 0) {
    throw new Error('No students found.');
  }

  console.log(`Found ${students.length} students. Generating attendance...`);

  const days = lastNWeekdays(30);
  const records = [];

  for (const student of students) {
    for (const date of days) {
      records.push({
        tenantId,
        academicYearId,
        studentId: student.id,
        classId: student.classId,
        sectionId: student.sectionId,
        date,
        status: pickStatus(),
        remark: null,
        markedById,
      });
    }
  }

  console.log(`Prepared ${records.length} attendance records (${students.length} students x ${days.length} days).`);

  const result = await prisma.studentAttendance.createMany({
    data: records,
    skipDuplicates: true, // protects @@unique([tenantId, studentId, date])
  });

  console.log(`Inserted ${result.count} attendance records.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
