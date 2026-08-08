// tests/exam.test.js

// 1. Mock express-rate-limit before loading app to prevent API throttling
jest.mock('express-rate-limit', () => {
  return () => (req, res, next) => next();
});

require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const prisma = require('../src/prisma/prismaClient');

describe('Exam & ExamMark Module Integration Test Suite', () => {
  let tenantA, tenantB;
  let academicYearA, academicYearB;
  let classA, classB;
  let sectionA;
  let subjectA, subjectB;
  let periodSlotA;
  let studentA, studentB;
  let staffAdminA, staffTeacherA, staffAccountantA, staffTeacherB;
  let userAdminA, userTeacherA, userAccountantA, userTeacherB;

  let tokenAdminA, tokenTeacherA, tokenAccountantA, tokenTeacherB;
  let tokenAdminB;

  beforeAll(async () => {
    // Clean up any remnants of previous test runs
    await deleteTenantBySubdomain('tenant-exam-test-a');
    await deleteTenantBySubdomain('tenant-exam-test-b');

    // 1. Create Test Tenants
    tenantA = await prisma.tenant.create({
      data: { name: 'Test Tenant A', subdomain: 'tenant-exam-test-a' },
    });
    tenantB = await prisma.tenant.create({
      data: { name: 'Test Tenant B', subdomain: 'tenant-exam-test-b' },
    });

    // 2. Create Academic Years
    academicYearA = await prisma.academicYear.create({
      data: {
        tenantId: tenantA.id,
        name: 'Academic Year 2026-27 A',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2027-05-31T23:59:59.000Z'),
        isActive: true,
      },
    });
    academicYearB = await prisma.academicYear.create({
      data: {
        tenantId: tenantB.id,
        name: 'Academic Year 2026-27 B',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2027-05-31T23:59:59.000Z'),
        isActive: true,
      },
    });

    // 3. Create Classes & Section
    classA = await prisma.class.create({
      data: { tenantId: tenantA.id, name: 'Class 10-A' },
    });
    classB = await prisma.class.create({
      data: { tenantId: tenantB.id, name: 'Class 10-B' },
    });
    sectionA = await prisma.section.create({
      data: { tenantId: tenantA.id, classId: classA.id, name: 'Section A' },
    });

    // 4. Create Students
    studentA = await prisma.student.create({
      data: {
        tenantId: tenantA.id,
        admissionNo: 'ADM-EXAM-001',
        studentName: 'Student Exam A',
        classId: classA.id,
        sectionId: sectionA.id,
      },
    });
    studentB = await prisma.student.create({
      data: {
        tenantId: tenantB.id,
        admissionNo: 'ADM-EXAM-002',
        studentName: 'Student Exam B',
        classId: classB.id,
      },
    });

    // 5. Create Staff and linked Users
    const passwordHash = await bcrypt.hash('password123', 10);

    // Admin A
    staffAdminA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-EXAM-ADMINA', name: 'Admin Exam A', email: 'adminA@examtest.com', role: 'other' },
    });
    userAdminA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Admin Exam A', email: 'admina@examtest.com', password: passwordHash, identity: 'admin', staffId: staffAdminA.id },
    });

    // Teacher A (timetabled for classA, subjectA)
    staffTeacherA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-EXAM-TEACHERA', name: 'Teacher Exam A', email: 'teacherA@examtest.com', role: 'teacher' },
    });
    userTeacherA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Teacher Exam A', email: 'teachera@examtest.com', password: passwordHash, identity: 'staff', staffId: staffTeacherA.id },
    });

    // Accountant A
    staffAccountantA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-EXAM-ACCT', name: 'Accountant Exam A', email: 'accountantA@examtest.com', role: 'accountant' },
    });
    userAccountantA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Accountant Exam A', email: 'accountanta@examtest.com', password: passwordHash, identity: 'staff', staffId: staffAccountantA.id },
    });

    // Teacher B (not timetabled for subjectA)
    staffTeacherB = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-EXAM-TEACHERB', name: 'Teacher Exam B', email: 'teacherB@examtest.com', role: 'teacher' },
    });
    userTeacherB = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Teacher Exam B', email: 'teacherb@examtest.com', password: passwordHash, identity: 'staff', staffId: staffTeacherB.id },
    });

    // Tenant B Admin User
    const staffAdminB = await prisma.staff.create({
      data: { tenantId: tenantB.id, employeeId: 'EMP-EXAM-ADMINB', name: 'Admin Exam B', email: 'adminB@examtest.com', role: 'other' },
    });
    await prisma.user.create({
      data: { tenantId: tenantB.id, name: 'Admin Exam B', email: 'adminb@examtest.com', password: passwordHash, identity: 'admin', staffId: staffAdminB.id },
    });

    // 6. Create Subjects and PeriodSlot
    subjectA = await prisma.subject.create({
      data: { tenantId: tenantA.id, name: 'Mathematics', code: 'MATH-EXAM-T101' },
    });
    subjectB = await prisma.subject.create({
      data: { tenantId: tenantA.id, name: 'Science', code: 'SCI-EXAM-T101' },
    });
    periodSlotA = await prisma.periodSlot.create({
      data: { tenantId: tenantA.id, slotNo: 1, label: 'Period 1', slotType: 'period', startTime: '08:00', endTime: '08:45' },
    });

    // 7. Create Timetable Entry (Teacher A teaches Class A, subject A)
    await prisma.timetable.create({
      data: {
        tenantId: tenantA.id,
        academicYearId: academicYearA.id,
        classId: classA.id,
        sectionId: sectionA.id,
        subjectId: subjectA.id,
        staffId: staffTeacherA.id,
        periodSlotId: periodSlotA.id,
        dayOfWeek: 1,
      },
    });

    // Timetable Entry (Teacher B teaches Class A, subject B)
    await prisma.timetable.create({
      data: {
        tenantId: tenantA.id,
        academicYearId: academicYearA.id,
        classId: classA.id,
        sectionId: sectionA.id,
        subjectId: subjectB.id,
        staffId: staffTeacherB.id,
        periodSlotId: periodSlotA.id,
        dayOfWeek: 2,
      },
    });

    // 8. Login to obtain tokens
    const loginResAdminA = await request(app).post('/api/v1/auth/login').send({ email: 'admina@examtest.com', password: 'password123', tenantId: tenantA.id });
    tokenAdminA = loginResAdminA.body.data.token;

    const loginResTeacherA = await request(app).post('/api/v1/auth/login').send({ email: 'teachera@examtest.com', password: 'password123', tenantId: tenantA.id });
    tokenTeacherA = loginResTeacherA.body.data.token;

    const loginResAccountantA = await request(app).post('/api/v1/auth/login').send({ email: 'accountanta@examtest.com', password: 'password123', tenantId: tenantA.id });
    tokenAccountantA = loginResAccountantA.body.data.token;

    const loginResTeacherB = await request(app).post('/api/v1/auth/login').send({ email: 'teacherb@examtest.com', password: 'password123', tenantId: tenantA.id });
    tokenTeacherB = loginResTeacherB.body.data.token;

    const loginResAdminB = await request(app).post('/api/v1/auth/login').send({ email: 'adminb@examtest.com', password: 'password123', tenantId: tenantB.id });
    tokenAdminB = loginResAdminB.body.data.token;
  });

  afterAll(async () => {
    // Cleanup the database using CASCADE deletes
    await deleteTenantBySubdomain('tenant-exam-test-a');
    await deleteTenantBySubdomain('tenant-exam-test-b');
    await prisma.$disconnect();
  });

  async function deleteTenantBySubdomain(subdomain) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
      if (tenant) {
        await prisma.tenant.delete({ where: { id: tenant.id } });
      }
    } catch (err) {
      console.error(`Failed to delete tenant with subdomain ${subdomain}:`, err);
    }
  }

  describe('Exam Scheduling & CRUD (Admin Only)', () => {
    it('should successfully create an exam when logged in as admin', async () => {
      const response = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'First Term Exam',
          examType: 'unit_test_1',
          classId: classA.id,
          startDate: '2026-07-01',
          endDate: '2026-07-05'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('First Term Exam');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should reject exam creation when startDate is after endDate', async () => {
      const response = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Invalid Date Exam',
          examType: 'unit_test_1',
          classId: classA.id,
          startDate: '2026-07-05',
          endDate: '2026-07-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('startDate');
    });

    it('should reject exam creation when dates fall outside the academic year range', async () => {
      // Academic year starts 2026-06-01, ends 2027-05-31. Date 2026-05-15 is outside.
      const response = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Outside Range Exam',
          examType: 'unit_test_1',
          classId: classA.id,
          startDate: '2026-05-10',
          endDate: '2026-05-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('academic year date range');
    });

    it('should block non-admins from creating exams -> 403', async () => {
      const response = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Teacher Created Exam',
          examType: 'unit_test_1',
          classId: classA.id,
          startDate: '2026-07-01',
          endDate: '2026-07-05'
        });

      expect(response.status).toBe(403);
    });

    it('should successfully update exam details as admin', async () => {
      const exam = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Original Exam',
          examType: 'half_yearly',
          classId: classA.id,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-10'),
        }
      });

      const response = await request(app)
        .put(`/api/v1/exams/${exam.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ name: 'Updated Exam Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Exam Name');
    });

    it('should successfully deactivate an exam if marks exist', async () => {
      const exam = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Marks Exist Exam',
          examType: 'half_yearly',
          classId: classA.id,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-10'),
        }
      });

      // Insert dummy marks record directly
      await prisma.examMark.create({
        data: {
          tenantId: tenantA.id,
          examId: exam.id,
          studentId: studentA.id,
          subjectId: subjectA.id,
          maxMarks: 100.00,
          marksObtained: 85.00,
          enteredById: staffAdminA.id
        }
      });

      // Attempt delete
      const response = await request(app)
        .delete(`/api/v1/exams/${exam.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Deactivated');

      // Verify it was soft-deleted/deactivated
      const dbExam = await prisma.exam.findUnique({ where: { id: exam.id } });
      expect(dbExam.isActive).toBe(false);
    });

    it('should hard delete an exam if no marks exist', async () => {
      const exam = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'No Marks Exam',
          examType: 'half_yearly',
          classId: classA.id,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-10'),
        }
      });

      const response = await request(app)
        .delete(`/api/v1/exams/${exam.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      const dbExam = await prisma.exam.findUnique({ where: { id: exam.id } });
      expect(dbExam).toBeNull();
    });
  });

  describe('Exam Marks Management', () => {
    let exam;

    beforeEach(async () => {
      exam = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Marks Module Exam',
          examType: 'unit_test_2',
          classId: classA.id,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-05'),
        }
      });
    });

    it('should derive enteredById from authenticated user and ignore request body', async () => {
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 95.5, enteredById: 9999 } // 9999 is fake
          ]
        });

      expect(response.status).toBe(200);

      const dbMark = await prisma.examMark.findFirst({
        where: { examId: exam.id, studentId: studentA.id, subjectId: subjectA.id }
      });
      expect(dbMark.enteredById).toBe(staffTeacherA.id);
      expect(dbMark.enteredById).not.toBe(9999);
    });

    it('should reject marks entry if teacher is NOT timetabled for the subject -> 403', async () => {
      // Teacher A teaches Subject A (Math). Let's attempt entering marks for Subject B (Science).
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectB.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 80 }
          ]
        });

      expect(response.status).toBe(403);
    });

    it('should allow admin to enter marks for any subject', async () => {
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          subjectId: subjectB.id, // Subject B (Science) which teacherA teaches, but admin can enter
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 75 }
          ]
        });

      expect(response.status).toBe(200);
    });

    it('should reject marksObtained greater than maxMarks -> 400', async () => {
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 50,
          records: [
            { studentId: studentA.id, marksObtained: 55 } // maxMarks is 50
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('maxMarks');
    });

    it('should enforce isAbsent rules correctly', async () => {
      // 1. isAbsent is true, but marksObtained is supplied -> should reset marksObtained to null
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 90, isAbsent: true }
          ]
        });

      expect(response.status).toBe(200);
      const dbMark = await prisma.examMark.findFirst({
        where: { examId: exam.id, studentId: studentA.id, subjectId: subjectA.id }
      });
      expect(dbMark.isAbsent).toBe(true);
      expect(dbMark.marksObtained).toBeNull();
    });

    it('should auto-compute grade and gradePoint using default CBSE scale', async () => {
      // Math marks: 85/100 -> 85% -> A2 (81-90) -> GP 9
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 85 }
          ]
        });

      expect(response.status).toBe(200);

      const dbMark = await prisma.examMark.findFirst({
        where: { examId: exam.id, studentId: studentA.id, subjectId: subjectA.id }
      });
      expect(dbMark.grade).toBe('A2');
      expect(Number(dbMark.gradePoint)).toBe(9);
    });

    it('should respect custom grading scale in MasterData if present', async () => {
      // Create a custom scale in MasterData
      // 90-100:EX:10, 80-89:VG:9, 0-79:G:8
      await prisma.masterData.create({
        data: {
          tenantId: tenantA.id,
          category: 'GradingScale',
          value: '90-100:EX:10,80-89:VG:9,0-79:G:8',
          isActive: true
        }
      });

      // Math marks: 95/100 -> EX (Excellent) -> GP 10
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 95 }
          ]
        });

      expect(response.status).toBe(200);

      const dbMark = await prisma.examMark.findFirst({
        where: { examId: exam.id, studentId: studentA.id, subjectId: subjectA.id }
      });
      expect(dbMark.grade).toBe('EX');
      expect(Number(dbMark.gradePoint)).toBe(10);
    });

    it('should allow explicit grade override and append note to remark', async () => {
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentA.id, marksObtained: 95, grade: 'S_OVERRIDE', remark: 'Good effort' }
          ]
        });

      expect(response.status).toBe(200);

      const dbMark = await prisma.examMark.findFirst({
        where: { examId: exam.id, studentId: studentA.id, subjectId: subjectA.id }
      });
      expect(dbMark.grade).toBe('S_OVERRIDE');
      expect(dbMark.remark).toContain('Manually Overridden');
    });

    it('should reject bulk marks if students do not belong to the exam class -> 400', async () => {
      // studentB belongs to classB, but this exam is for classA
      const response = await request(app)
        .post(`/api/v1/exams/${exam.id}/marks`)
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          subjectId: subjectA.id,
          maxMarks: 100,
          records: [
            { studentId: studentB.id, marksObtained: 85 }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('class');
    });
  });

  describe('Report Card and Listings', () => {
    let exam1, exam2;

    beforeAll(async () => {
      exam1 = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Mid Term',
          examType: 'half_yearly',
          classId: classA.id,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-05'),
        }
      });

      exam2 = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Final Term',
          examType: 'annual',
          classId: classA.id,
          startDate: new Date('2026-11-01'),
          endDate: new Date('2026-11-10'),
        }
      });

      // Seed Teacher A entering marks
      await prisma.examMark.create({
        data: {
          tenantId: tenantA.id,
          examId: exam1.id,
          studentId: studentA.id,
          subjectId: subjectA.id,
          maxMarks: 100.00,
          marksObtained: 85.00,
          grade: 'A2',
          gradePoint: 9.00,
          enteredById: staffTeacherA.id
        }
      });

      await prisma.examMark.create({
        data: {
          tenantId: tenantA.id,
          examId: exam2.id,
          studentId: studentA.id,
          subjectId: subjectA.id,
          maxMarks: 100.00,
          marksObtained: 95.00,
          grade: 'A1',
          gradePoint: 10.00,
          enteredById: staffTeacherA.id
        }
      });
    });

    it('should return report card with grouped exams and subjects', async () => {
      const response = await request(app)
        .get(`/api/v1/exams/students/${studentA.id}/report`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .query({ academicYearId: academicYearA.id });

      expect(response.status).toBe(200);
      expect(response.body.data.student.name).toBe('Student Exam A');
      expect(response.body.data.exams.length).toBeGreaterThanOrEqual(2);

      const midTerm = response.body.data.exams.find(e => e.examName === 'Mid Term');
      expect(midTerm).toBeDefined();
      expect(midTerm.subjects[0].marksObtained).toBe(85);
      expect(midTerm.subjects[0].grade).toBe('A2');

      const finalTerm = response.body.data.exams.find(e => e.examName === 'Final Term');
      expect(finalTerm).toBeDefined();
      expect(finalTerm.subjects[0].marksObtained).toBe(95);
      expect(finalTerm.subjects[0].grade).toBe('A1');
    });

    it('should reject report card viewing for accountant -> 403', async () => {
      const response = await request(app)
        .get(`/api/v1/exams/students/${studentA.id}/report`)
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .query({ academicYearId: academicYearA.id });

      expect(response.status).toBe(403);
    });
  });

  describe('Tenant Scoping', () => {
    let examA;

    beforeAll(async () => {
      examA = await prisma.exam.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Tenant A Exam',
          examType: 'unit_test_1',
          classId: classA.id,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-05'),
        }
      });
    });

    it('should reject Admin B from reading Tenant A exam -> 404', async () => {
      const response = await request(app)
        .get(`/api/v1/exams/${examA.id}`)
        .set('Authorization', `Bearer ${tokenAdminB}`);

      expect(response.status).toBe(404);
    });

    it('should reject Admin B from updating Tenant A exam -> 404', async () => {
      const response = await request(app)
        .put(`/api/v1/exams/${examA.id}`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ name: 'Hacked name' });

      expect(response.status).toBe(404);
    });

    it('should reject Admin B from deleting Tenant A exam -> 404', async () => {
      const response = await request(app)
        .delete(`/api/v1/exams/${examA.id}`)
        .set('Authorization', `Bearer ${tokenAdminB}`);

      expect(response.status).toBe(404);
    });

    it('should prevent Admin B from fetching report card for Student A -> 404', async () => {
      const response = await request(app)
        .get(`/api/v1/exams/students/${studentA.id}/report`)
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .query({ academicYearId: academicYearA.id });

      expect(response.status).toBe(404);
    });
  });
});
