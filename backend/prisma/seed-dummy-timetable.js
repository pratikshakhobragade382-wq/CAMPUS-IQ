const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');
  const tenantId = tenant.id;

  const academicYear = await prisma.academicYear.findFirst({ where: { tenantId } }) || 
                       await prisma.academicYear.create({
                         data: { name: '2024-2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isCurrent: true, tenantId }
                       });

  // Ensure period slots exist
  let slots = await prisma.periodSlot.findMany({ where: { tenantId, isActive: true }, orderBy: { slotNo: 'asc' } });
  if (slots.length === 0) {
    const defaultSlots = [
      { slotNo: 1, label: 'Period 1', slotType: 'period', startTime: '08:00', endTime: '08:45' },
      { slotNo: 2, label: 'Period 2', slotType: 'period', startTime: '08:45', endTime: '09:30' },
      { slotNo: 3, label: 'Period 3', slotType: 'period', startTime: '09:30', endTime: '10:15' },
      { slotNo: 4, label: 'Recess', slotType: 'recess', startTime: '10:15', endTime: '10:30' },
      { slotNo: 5, label: 'Period 4', slotType: 'period', startTime: '10:30', endTime: '11:15' },
      { slotNo: 6, label: 'Period 5', slotType: 'period', startTime: '11:15', endTime: '12:00' },
      { slotNo: 7, label: 'Lunch Break', slotType: 'lunch', startTime: '12:00', endTime: '12:30' },
      { slotNo: 8, label: 'Period 6', slotType: 'period', startTime: '12:30', endTime: '13:15' },
      { slotNo: 9, label: 'Period 7', slotType: 'period', startTime: '13:15', endTime: '14:00' },
      { slotNo: 10, label: 'Sports', slotType: 'sports', startTime: '14:00', endTime: '15:00' },
    ];
    await prisma.periodSlot.createMany({
      data: defaultSlots.map((s) => ({ ...s, tenantId, isActive: true })),
    });
    slots = await prisma.periodSlot.findMany({ where: { tenantId, isActive: true }, orderBy: { slotNo: 'asc' } });
  }

  // Ensure classes exist
  let classes = await prisma.class.findMany({ where: { tenantId, isDeleted: false } });
  if (classes.length === 0) {
    const classNames = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    for (const cName of classNames) {
      await prisma.class.create({ data: { name: cName, tenantId, isDeleted: false } });
    }
    classes = await prisma.class.findMany({ where: { tenantId, isDeleted: false } });
  }

  // Ensure sections exist
  let sections = await prisma.section.findMany({ where: { tenantId, isDeleted: false } });
  if (sections.length === 0 && classes.length > 0) {
    for (const cls of classes) {
      await prisma.section.create({ data: { name: 'A', classId: cls.id, tenantId, isDeleted: false } });
      await prisma.section.create({ data: { name: 'B', classId: cls.id, tenantId, isDeleted: false } });
    }
    sections = await prisma.section.findMany({ where: { tenantId, isDeleted: false } });
  }

  // Ensure departments exist
  let depts = await prisma.department.findMany({ where: { tenantId, isDeleted: false } });
  if (depts.length === 0) {
    const deptNames = ['Science', 'Mathematics', 'English', 'Social Studies', 'Computer Science'];
    for (const dName of deptNames) {
      await prisma.department.create({ data: { name: dName, tenantId, isDeleted: false } });
    }
    depts = await prisma.department.findMany({ where: { tenantId, isDeleted: false } });
  }

  // Ensure subjects exist
  let subjects = await prisma.subject.findMany({ where: { tenantId, isDeleted: false } });
  if (subjects.length === 0) {
    const subjectList = [
      { name: 'Mathematics', code: 'MATH101' },
      { name: 'Physics', code: 'PHY101' },
      { name: 'Chemistry', code: 'CHEM101' },
      { name: 'Biology', code: 'BIO101' },
      { name: 'English Literature', code: 'ENG101' },
      { name: 'Computer Science', code: 'CS101' },
      { name: 'History', code: 'HIST101' },
      { name: 'Geography', code: 'GEO101' },
    ];
    for (const sub of subjectList) {
      await prisma.subject.create({ data: { name: sub.name, code: sub.code, tenantId, isDeleted: false } });
    }
    subjects = await prisma.subject.findMany({ where: { tenantId, isDeleted: false } });
  }

  // Create 4 distinct Dummy Teachers
  const dummyTeachersData = [
    {
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@campusiq.com',
      employeeId: 'TCH-001',
      phone: '9823011221',
      role: 'teacher',
      deptName: 'Science',
      primarySubject: 'Physics',
      secondarySubject: 'Chemistry',
    },
    {
      name: 'Mrs. Priya Kulkarni',
      email: 'priya.kulkarni@campusiq.com',
      employeeId: 'TCH-002',
      phone: '9823011222',
      role: 'teacher',
      deptName: 'Mathematics',
      primarySubject: 'Mathematics',
      secondarySubject: 'Computer Science',
    },
    {
      name: 'Mr. Amit Verma',
      email: 'amit.verma@campusiq.com',
      employeeId: 'TCH-003',
      phone: '9823011223',
      role: 'teacher',
      deptName: 'English',
      primarySubject: 'English Literature',
      secondarySubject: 'History',
    },
    {
      name: 'Ms. Sneha Patil',
      email: 'sneha.patil@campusiq.com',
      employeeId: 'TCH-004',
      phone: '9823011224',
      role: 'teacher',
      deptName: 'Computer Science',
      primarySubject: 'Computer Science',
      secondarySubject: 'Mathematics',
    },
  ];

  const createdTeachers = [];

  for (const tData of dummyTeachersData) {
    const dept = depts.find((d) => d.name.toLowerCase().includes(tData.deptName.toLowerCase())) || depts[0];

    let staff = await prisma.staff.findFirst({
      where: {
        tenantId,
        OR: [{ email: tData.email }, { employeeId: tData.employeeId }, { name: tData.name }],
      },
    });

    if (!staff) {
      staff = await prisma.staff.create({
        data: {
          name: tData.name,
          email: tData.email,
          employeeId: tData.employeeId,
          phone: tData.phone,
          mobileNo: tData.phone,
          role: 'teacher',
          departmentId: dept ? dept.id : null,
          tenantId,
          isDeleted: false,
        },
      });
    } else {
      staff = await prisma.staff.update({
        where: { id: staff.id },
        data: { name: tData.name, role: 'teacher', isDeleted: false, departmentId: dept ? dept.id : null },
      });
    }

    createdTeachers.push({ staff, meta: tData });
  }

  // Only assignable slots (period and sports)
  const assignableSlots = slots.filter((s) => ['period', 'sports'].includes(s.slotType));

  // Generate complete timetables (Monday=1 to Saturday=6) for each teacher
  console.log('Generating Timetable entries for 4 teachers...');

  for (const { staff, meta } of createdTeachers) {
    // Clear old timetable entries for this staff to have clean fresh data
    await prisma.timetable.deleteMany({
      where: { tenantId, staffId: staff.id },
    });

    const primarySub = subjects.find((s) => s.name.toLowerCase().includes(meta.primarySubject.toLowerCase())) || subjects[0];
    const secondarySub = subjects.find((s) => s.name.toLowerCase().includes(meta.secondarySubject.toLowerCase())) || subjects[1] || subjects[0];

    const entriesToCreate = [];

    // Days 1 (Mon) to 6 (Sat)
    for (let day = 1; day <= 6; day++) {
      // Pick 3 to 4 periods per day
      const periodIndices = day % 2 === 0 ? [0, 1, 3, 5] : [0, 2, 4, 6];

      for (let i = 0; i < periodIndices.length; i++) {
        const slotIdx = periodIndices[i];
        const slot = assignableSlots[slotIdx];
        if (!slot) continue;

        const cls = classes[(day + i) % classes.length];
        const sec = sections.find((s) => s.classId === cls.id) || sections[0];
        const sub = (i % 2 === 0) ? primarySub : secondarySub;

        entriesToCreate.push({
          tenantId,
          academicYearId: academicYear.id,
          classId: cls.id,
          sectionId: sec ? sec.id : null,
          subjectId: sub.id,
          staffId: staff.id,
          periodSlotId: slot.id,
          dayOfWeek: day,
          isActive: true,
        });
      }
    }

    await prisma.timetable.createMany({
      data: entriesToCreate,
      skipDuplicates: true,
    });

    console.log(`Created ${entriesToCreate.length} timetable entries for ${staff.name} (ID: ${staff.id})`);
  }

  console.log('Successfully seeded 4 teachers and their timetables!');
}

main()
  .catch((err) => {
    console.error('Failed to seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
