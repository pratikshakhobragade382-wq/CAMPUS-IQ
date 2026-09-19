/**
 * ADDITIVE test-data seeder for CAMPUS-IQ.
 * - Never truncates existing data (unlike a typical seed.js).
 * - Uses upsert on natural unique keys wherever possible, so it's safe to re-run.
 * - Operates on the FIRST tenant found in the DB (prints which one).
 *
 * Run with:  node src/seed/testData.js
 */

const bcrypt = require("bcrypt");
const prisma = require("../prisma/prismaClient");

const BCRYPT_COST = 10; // kept low intentionally — this is test data, not production
const STAFF_PASSWORD = "Teacher@123";

const pad2 = (n) => String(n).padStart(2, "0");

function dobPassword(date) {
  const d = new Date(date);
  return `${pad2(d.getDate())}${pad2(d.getMonth() + 1)}${d.getFullYear()}`;
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ orderBy: { id: "asc" } });
  if (!tenant) {
    console.error("No tenant found. Register/login through the app once first, then re-run this script.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  console.log(`Seeding test data into tenant: "${tenant.name}" (id=${tenantId}, subdomain=${tenant.subdomain})\n`);

  // =====================================================
  // 1. ACADEMIC YEAR
  // =====================================================
  let academicYear = await prisma.academicYear.findFirst({ where: { tenantId, isActive: true } });
  if (!academicYear) {
    academicYear = await prisma.academicYear.upsert({
      where: { name_tenantId: { name: "2026-2027", tenantId } },
      update: {},
      create: {
        name: "2026-2027",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2027-04-30"),
        isActive: true,
        tenantId,
      },
    });
  }
  console.log(`Academic Year: ${academicYear.name} (id=${academicYear.id})`);

  // =====================================================
  // 2. DEPARTMENTS (5)
  // =====================================================
  const departmentNames = ["Primary Wing", "Middle Wing", "Senior Wing", "Administration", "Sports & Co-curricular"];
  const departments = [];
  for (const name of departmentNames) {
    const dep = await prisma.department.upsert({
      where: { name_tenantId: { name, tenantId } },
      update: {},
      create: { name, tenantId },
    });
    departments.push(dep);
  }
  console.log(`Departments: ${departments.length}`);

  // =====================================================
  // 3. CLASSES (15) + SECTIONS (2 each = 30)
  // =====================================================
  const classNames = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const classes = [];
  for (let i = 0; i < classNames.length; i++) {
    const cls = await prisma.class.upsert({
      where: { name_tenantId: { name: classNames[i], tenantId } },
      update: {},
      create: { name: classNames[i], tenantId, departmentId: departments[i % departments.length].id },
    });
    classes.push(cls);
  }
  const sections = [];
  for (const cls of classes) {
    for (const secName of ["A", "B"]) {
      const sec = await prisma.section.upsert({
        where: { name_classId_tenantId: { name: secName, classId: cls.id, tenantId } },
        update: {},
        create: { name: secName, classId: cls.id, tenantId },
      });
      sections.push(sec);
    }
  }
  console.log(`Classes: ${classes.length}, Sections: ${sections.length}`);

  // =====================================================
  // 4. SUBJECTS (10)
  // =====================================================
  const subjectDefs = [
    ["Mathematics", "MATH"],
    ["Science", "SCI"],
    ["English", "ENG"],
    ["Hindi", "HIN"],
    ["Social Studies", "SST"],
    ["Computer Science", "COMP"],
    ["Art", "ART"],
    ["Physical Education", "PE"],
    ["Music", "MUS"],
    ["Environmental Studies", "EVS"],
  ];
  const subjects = [];
  for (const [name, code] of subjectDefs) {
    const subj = await prisma.subject.upsert({
      where: { code_tenantId: { code, tenantId } },
      update: {},
      create: { name, code, tenantId },
    });
    subjects.push(subj);
  }
  console.log(`Subjects: ${subjects.length}`);

  // =====================================================
  // 5. PERIOD SLOTS (8)
  // =====================================================
  const slotDefs = [
    [1, "Period 1", "08:00", "08:45"],
    [2, "Period 2", "08:45", "09:30"],
    [3, "Period 3", "09:30", "10:15"],
    [4, "Recess", "10:15", "10:30"],
    [5, "Period 4", "10:30", "11:15"],
    [6, "Period 5", "11:15", "12:00"],
    [7, "Period 6", "12:00", "12:45"],
    [8, "Period 7", "12:45", "13:30"],
  ];
  const periodSlots = [];
  for (const [slotNo, label, startTime, endTime] of slotDefs) {
    const slot = await prisma.periodSlot.upsert({
      where: { tenantId_slotNo: { tenantId, slotNo } },
      update: {},
      create: { tenantId, slotNo, label, startTime, endTime, slotType: label === "Recess" ? "break" : "class" },
    });
    periodSlots.push(slot);
  }
  console.log(`Period Slots: ${periodSlots.length}`);

  // =====================================================
  // 6. STAFF (50) — 35 teachers + 15 other roles, each with a login
  // =====================================================
  const otherRoles = ["accountant", "librarian", "clerk", "receptionist", "nurse", "counselor", "coordinator", "lab_assistant", "peon", "driver", "security", "other"];
  const firstNames = ["Ravi", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rahul", "Neha", "Suresh", "Kavita", "Manoj", "Deepa", "Arjun", "Pooja", "Sanjay", "Meera", "Rajesh", "Divya", "Kiran", "Anita", "Vijay", "Swati", "Ashok", "Rekha", "Naveen"];
  const lastNames = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Nair", "Reddy", "Joshi", "Mehta", "Rao", "Iyer", "Das", "Bose", "Shah"];

  const staffPasswordHash = await bcrypt.hash(STAFF_PASSWORD, BCRYPT_COST);
  const staffList = [];

  for (let i = 1; i <= 50; i++) {
    const isTeacher = i <= 35;
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    const name = `${fname} ${lname}`;
    const employeeId = `EMP${String(i).padStart(3, "0")}`;
    const email = `staff${i}@campusiq.test`;
    const role = isTeacher ? "teacher" : otherRoles[i % otherRoles.length];

    const staff = await prisma.staff.upsert({
      where: { employeeId_tenantId: { employeeId, tenantId } },
      update: {},
      create: {
        employeeId,
        name,
        email,
        phone: `9${String(100000000 + i).slice(0, 9)}`,
        role,
        gender: i % 2 === 0 ? "male" : "female",
        dateOfJoining: new Date(2020 + (i % 5), i % 12, 1),
        salary: 25000 + (i % 10) * 1500,
        departmentId: departments[i % departments.length].id,
        tenantId,
      },
    });
    staffList.push(staff);

    if (isTeacher) {
      const subjA = subjects[i % subjects.length];
      const subjB = subjects[(i + 1) % subjects.length];
      for (const subj of [subjA, subjB]) {
        await prisma.staffSubject.upsert({
          where: { staffId_subjectId: { staffId: staff.id, subjectId: subj.id } },
          update: {},
          create: { staffId: staff.id, subjectId: subj.id, tenantId },
        });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { staffId: staff.id } });
    if (!existingUser) {
      const existingByEmail = await prisma.user.findUnique({ where: { email_tenantId: { email, tenantId } } });
      if (!existingByEmail) {
        await prisma.user.create({
          data: {
            name,
            email,
            password: staffPasswordHash,
            tenantId,
            identity: "staff",
            staffId: staff.id,
          },
        });
      }
    }
  }
  const teacherList = staffList.slice(0, 35);
  console.log(`Staff: ${staffList.length} (${teacherList.length} teachers with logins, password for all: "${STAFF_PASSWORD}")`);

  // =====================================================
  // 7. STUDENTS (50) with father parent (auto login)
  // =====================================================
  const studentPasswordCache = [];
  const existingStudentCount = await prisma.student.count({ where: { tenantId } });
  const startAdmNo = existingStudentCount + 1;

  for (let i = 0; i < 50; i++) {
    const admissionNo = `SEED-${String(startAdmNo + i).padStart(4, "0")}`;
    const existing = await prisma.student.findUnique({ where: { admissionNo_tenantId: { admissionNo, tenantId } } });
    if (existing) continue;

    const cls = classes[3 + (i % (classes.length - 3))];
    const clsSections = sections.filter((s) => s.classId === cls.id);
    const sec = clsSections[i % clsSections.length];
    const fname = firstNames[(i + 3) % firstNames.length];
    const lname = lastNames[(i + 5) % lastNames.length];
    const studentName = `${fname} ${lname}`;
    const dob = new Date(2010 + (i % 12), i % 12, 1 + (i % 27));

    const student = await prisma.student.create({
      data: {
        admissionNo,
        studentName,
        classId: cls.id,
        sectionId: sec.id,
        rollNo: String((i % 40) + 1),
        gender: i % 2 === 0 ? "male" : "female",
        dateOfBirth: dob,
        dateOfAdmission: new Date("2026-06-01"),
        admissionType: "new",
        tenantId,
      },
    });

    const fatherMobile = `9${String(200000000 + i).slice(0, 9)}`;
    const fatherEmail = `parent${startAdmNo + i}@campusiq.test`;
    const parent = await prisma.studentParent.create({
      data: {
        studentId: student.id,
        tenantId,
        relation: "father",
        name: `${firstNames[i % firstNames.length]} ${lname}`,
        mobile: fatherMobile,
        email: fatherEmail,
      },
    });
    const parentPassword = fatherMobile.slice(-6);
    const parentHash = await bcrypt.hash(parentPassword, BCRYPT_COST);
    const parentUser = await prisma.user.create({
      data: {
        name: parent.name,
        email: fatherEmail,
        password: parentHash,
        tenantId,
        identity: "parent",
      },
    });
    await prisma.studentParent.update({ where: { id: parent.id }, data: { userId: parentUser.id } });

    const studentLoginEmail = `${admissionNo.toLowerCase()}@${tenant.subdomain.toLowerCase()}.student`;
    const studentPassword = dobPassword(dob);
    const studentHash = await bcrypt.hash(studentPassword, BCRYPT_COST);
    await prisma.user.create({
      data: {
        name: studentName,
        email: studentLoginEmail,
        password: studentHash,
        tenantId,
        identity: "student",
        studentId: student.id,
      },
    });

    studentPasswordCache.push({ admissionNo, studentName, studentLoginEmail, studentPassword, fatherEmail, parentPassword });
  }
  console.log(`Students: 50 created (each with father-parent login + student login)`);

  const allStudents = await prisma.student.findMany({ where: { tenantId, admissionNo: { startsWith: "SEED-" } } });

  // =====================================================
  // 8. TIMETABLE (50)
  // =====================================================
  let timetableCount = 0;
  const period1 = periodSlots[0];
  for (let t = 0; t < 10; t++) {
    const teacher = teacherList[t];
    const cls = classes[3 + t];
    const clsSections = sections.filter((s) => s.classId === cls.id);
    const sec = clsSections[0];
    const subj = subjects[t % subjects.length];
    for (let day = 1; day <= 5; day++) {
      const exists = await prisma.timetable.findFirst({
        where: { tenantId, academicYearId: academicYear.id, staffId: teacher.id, dayOfWeek: day, periodSlotId: period1.id },
      });
      if (exists) continue;
      await prisma.timetable.create({
        data: {
          tenantId,
          academicYearId: academicYear.id,
          classId: cls.id,
          sectionId: sec.id,
          subjectId: subj.id,
          staffId: teacher.id,
          periodSlotId: period1.id,
          dayOfWeek: day,
        },
      });
      timetableCount++;
    }
  }
  console.log(`Timetable entries: ${timetableCount}`);

  // =====================================================
  // 9. ATTENDANCE — last 7 days
  // =====================================================
  const markerStaff = staffList[0];
  let studentAttCount = 0;
  let staffAttCount = 0;
  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - d);

    for (const student of allStudents) {
      const exists = await prisma.studentAttendance.findUnique({
        where: { tenantId_studentId_date: { tenantId, studentId: student.id, date } },
      });
      if (exists) continue;
      const roll = Number(student.rollNo) || 1;
      const status = (roll + d) % 10 === 0 ? "absent" : (roll + d) % 15 === 0 ? "late" : "present";
      await prisma.studentAttendance.create({
        data: {
          tenantId,
          academicYearId: academicYear.id,
          studentId: student.id,
          classId: student.classId,
          sectionId: student.sectionId,
          date,
          status,
          markedById: markerStaff.id,
        },
      });
      studentAttCount++;
    }

    for (const staff of staffList) {
      const exists = await prisma.staffAttendance.findUnique({
        where: { tenantId_staffId_date: { tenantId, staffId: staff.id, date } },
      });
      if (exists) continue;
      await prisma.staffAttendance.create({
        data: {
          tenantId,
          academicYearId: academicYear.id,
          staffId: staff.id,
          date,
          status: staff.id % 20 === 0 ? "absent" : "present",
          inTime: "08:00",
          outTime: "15:30",
        },
      });
      staffAttCount++;
    }
  }
  console.log(`Student attendance rows: ${studentAttCount}, Staff attendance rows: ${staffAttCount}`);

  // =====================================================
  // 10. FEES
  // =====================================================
  const feeCategoryDefs = ["Tuition Fee", "Transport Fee", "Library Fee", "Exam Fee"];
  const feeCategories = [];
  for (const name of feeCategoryDefs) {
    const cat = await prisma.feeCategory.upsert({
      where: { name_tenantId: { name, tenantId } },
      update: {},
      create: { name, tenantId },
    });
    feeCategories.push(cat);
  }
  const feeStructures = [];
  for (const cls of classes.slice(3)) {
    for (const cat of feeCategories.slice(0, 3)) {
      const amount = cat.name === "Tuition Fee" ? 30000 : cat.name === "Transport Fee" ? 8000 : 1500;
      const existing = await prisma.feeStructure.findFirst({
        where: { tenantId, academicYearId: academicYear.id, classId: cls.id, feeCategoryId: cat.id },
      });
      const fs = existing
        ? existing
        : await prisma.feeStructure.create({
            data: { tenantId, academicYearId: academicYear.id, classId: cls.id, feeCategoryId: cat.id, amount },
          });
      feeStructures.push(fs);
    }
  }
  const accountantStaff = staffList.find((s) => s.role === "accountant") || staffList[0];
  const existingReceiptCount = await prisma.feeCollection.count({ where: { tenantId, receiptNo: { startsWith: "SEED-RCPT" } } });
  let feeCollCount = 0;
  for (let i = 0; i < 50; i++) {
    const student = allStudents[i % allStudents.length];
    const fs = feeStructures.find((f) => f.classId === student.classId) || feeStructures[0];
    const receiptNo = `SEED-RCPT${String(existingReceiptCount + i + 1).padStart(4, "0")}`;
    await prisma.feeCollection.create({
      data: {
        tenantId,
        receiptNo,
        studentId: student.id,
        feeStructureId: fs.id,
        academicYearId: academicYear.id,
        amount: fs.amount,
        netAmount: fs.amount,
        paymentMode: i % 3 === 0 ? "cash" : i % 3 === 1 ? "upi" : "cheque",
        paymentDate: new Date(Date.now() - i * 86400000),
        collectedById: accountantStaff.id,
      },
    });
    feeCollCount++;
  }
  console.log(`Fee categories: ${feeCategories.length}, structures: ${feeStructures.length}, collections: ${feeCollCount}`);

  // =====================================================
  // 11. EXAMS + MARKS (published)
  // =====================================================
  const examTeacher = teacherList[0];
  const examDefs = [
    ["Unit Test 1", "unit_test_1"],
    ["Half Yearly Exam", "half_yearly"],
  ];
  let examMarkCount = 0;
  for (const [examName, examType] of examDefs) {
    for (const cls of classes.slice(3, 6)) {
      let exam = await prisma.exam.findFirst({ where: { tenantId, name: examName, classId: cls.id } });
      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            tenantId,
            academicYearId: academicYear.id,
            name: examName,
            examType,
            classId: cls.id,
            startDate: new Date("2026-09-15"),
            endDate: new Date("2026-09-20"),
          },
        });
      }
      const clsStudents = allStudents.filter((s) => s.classId === cls.id);
      for (const student of clsStudents.slice(0, 5)) {
        for (const subj of subjects.slice(0, 2)) {
          const exists = await prisma.examMark.findFirst({ where: { examId: exam.id, studentId: student.id, subjectId: subj.id } });
          if (exists) continue;
          const marksObtained = 60 + ((student.id + subj.id) % 35);
          await prisma.examMark.create({
            data: {
              tenantId,
              examId: exam.id,
              studentId: student.id,
              subjectId: subj.id,
              maxMarks: 100,
              marksObtained,
              grade: marksObtained >= 90 ? "A+" : marksObtained >= 75 ? "A" : marksObtained >= 60 ? "B" : "C",
              enteredById: examTeacher.id,
            },
          });
          examMarkCount++;
        }
      }
      const alreadyPublished = await prisma.resultPublication.findFirst({
        where: { academicYearId: academicYear.id, classId: cls.id, examId: exam.id },
      });
      if (!alreadyPublished) {
        await prisma.resultPublication.create({
          data: {
            tenantId,
            academicYearId: academicYear.id,
            classId: cls.id,
            examId: exam.id,
            isPublished: true,
            publishedById: examTeacher.id,
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }
  console.log(`Exam marks: ${examMarkCount} (published)`);

  // =====================================================
  // 12. ASSIGNMENTS + SUBMISSIONS
  // =====================================================
  let assignmentCount = 0;
  const assignments = [];
  for (let i = 0; i < 50; i++) {
    const teacher = teacherList[i % teacherList.length];
    const cls = classes[3 + (i % (classes.length - 3))];
    const clsSections = sections.filter((s) => s.classId === cls.id);
    const sec = clsSections[i % clsSections.length];
    const subj = subjects[i % subjects.length];
    const assignment = await prisma.assignment.create({
      data: {
        tenantId,
        title: `${subj.name} Homework ${i + 1}`,
        description: `Auto-generated test assignment #${i + 1} for ${subj.name}`,
        classId: cls.id,
        sectionId: sec.id,
        subjectId: subj.id,
        teacherId: teacher.id,
        dueDate: new Date(Date.now() + (i % 14) * 86400000),
        maxMarks: 100,
      },
    });
    assignments.push(assignment);
    assignmentCount++;
  }
  let submissionCount = 0;
  for (let i = 0; i < 50; i++) {
    const assignment = assignments[i];
    const clsStudents = allStudents.filter((s) => s.classId === assignment.classId);
    if (!clsStudents.length) continue;
    const student = clsStudents[i % clsStudents.length];
    const exists = await prisma.assignmentSubmission.findFirst({
      where: { tenantId, assignmentId: assignment.id, studentId: student.id },
    });
    if (exists) continue;
    await prisma.assignmentSubmission.create({
      data: {
        tenantId,
        assignmentId: assignment.id,
        studentId: student.id,
        content: "Auto-submitted test content.",
        status: i % 4 === 0 ? "graded" : "submitted",
        grade: i % 4 === 0 ? 80 + (i % 20) : null,
      },
    });
    submissionCount++;
  }
  console.log(`Assignments: ${assignmentCount}, Submissions: ${submissionCount}`);

  // =====================================================
  // 13. HOLIDAYS (20)
  // =====================================================
  let holidayCount = 0;
  for (let i = 0; i < 20; i++) {
    const date = new Date("2026-06-01");
    date.setUTCDate(date.getUTCDate() + i * 15);
    const exists = await prisma.holiday.findUnique({ where: { tenantId_date: { tenantId, date } } });
    if (exists) continue;
    await prisma.holiday.create({
      data: { tenantId, academicYearId: academicYear.id, name: `Test Holiday ${i + 1}`, date, holidayType: "public" },
    });
    holidayCount++;
  }
  console.log(`Holidays: ${holidayCount}`);

  // =====================================================
  // 14. NOTIFICATIONS (50)
  // =====================================================
  const audiences = ["all", "staff", "student", "parent", "class"];
  let notificationCount = 0;
  for (let i = 0; i < 50; i++) {
    const audience = audiences[i % audiences.length];
    await prisma.notification.create({
      data: {
        tenantId,
        title: `Test Notification ${i + 1}`,
        message: `This is an auto-generated test notification #${i + 1}.`,
        type: "general",
        priority: i % 10 === 0 ? "urgent" : "normal",
        audience,
        classId: audience === "class" ? classes[i % classes.length].id : null,
      },
    });
    notificationCount++;
  }
  console.log(`Notifications: ${notificationCount}`);

  console.log("\n================ SEED COMPLETE ================");
  console.log(`Staff login password (all 50): ${STAFF_PASSWORD}`);
  console.log(`Staff login emails: staff1@campusiq.test ... staff50@campusiq.test`);
  console.log(`Sample teacher (for dashboard testing): staff1@campusiq.test / ${STAFF_PASSWORD}`);
  console.log(`\nStudent + Parent sample credentials (first 3 of 50):`);
  studentPasswordCache.slice(0, 3).forEach((s) => {
    console.log(`  Student  ${s.admissionNo}: ${s.studentLoginEmail} / ${s.studentPassword}`);
    console.log(`  Parent   (${s.studentName}'s father): ${s.fatherEmail} / ${s.parentPassword}`);
  });
  console.log("=================================================\n");
}

main()
  .catch((err) => {
    console.error("SEED FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
