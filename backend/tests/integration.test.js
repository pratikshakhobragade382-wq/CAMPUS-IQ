// tests/integration.test.js

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

describe('School ERP Integration Test Suite', () => {
  let tenantA, tenantB;
  let academicYearA, academicYearB;
  let classA, classB;
  let sectionA;
  let subjectA;
  let periodSlotA;
  let studentA, studentB;
  let staffAdminA, staffTeacherA, staffAccountantA, staffTeacherB;
  let userAdminA, userTeacherA, userAccountantA, userTeacherB;
  let feeCategoryA, feeStructureA;

  let tokenAdminA, tokenTeacherA, tokenAccountantA, tokenTeacherB;
  let tokenAdminB;

  beforeAll(async () => {
    // Clean up any remnants of previous test runs
    await deleteTenantBySubdomain('tenant-test-a');
    await deleteTenantBySubdomain('tenant-test-b');

    // 1. Create Test Tenants
    tenantA = await prisma.tenant.create({
      data: { name: 'Test Tenant A', subdomain: 'tenant-test-a' },
    });
    tenantB = await prisma.tenant.create({
      data: { name: 'Test Tenant B', subdomain: 'tenant-test-b' },
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
        admissionNo: 'ADM-TEST-001',
        studentName: 'Student Test A',
        classId: classA.id,
        sectionId: sectionA.id,
      },
    });
    studentB = await prisma.student.create({
      data: {
        tenantId: tenantB.id,
        admissionNo: 'ADM-TEST-002',
        studentName: 'Student Test B',
        classId: classB.id,
      },
    });

    // 5. Create Staff and linked Users
    const passwordHash = await bcrypt.hash('password123', 10);

    // Admin A
    staffAdminA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-T-ADMINA', name: 'Admin Test A', email: 'adminA@test.com', role: 'other' },
    });
    userAdminA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Admin Test A', email: 'admina@test.com', password: passwordHash, identity: 'admin', staffId: staffAdminA.id },
    });

    // Teacher A (timetabled)
    staffTeacherA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-T-TEACHERA', name: 'Teacher Test A', email: 'teacherA@test.com', role: 'teacher' },
    });
    userTeacherA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Teacher Test A', email: 'teachera@test.com', password: passwordHash, identity: 'staff', staffId: staffTeacherA.id },
    });

    // Accountant A
    staffAccountantA = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-T-ACCT', name: 'Accountant Test A', email: 'accountantA@test.com', role: 'accountant' },
    });
    userAccountantA = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Accountant Test A', email: 'accountanta@test.com', password: passwordHash, identity: 'staff', staffId: staffAccountantA.id },
    });

    // Teacher B (not timetabled)
    staffTeacherB = await prisma.staff.create({
      data: { tenantId: tenantA.id, employeeId: 'EMP-T-TEACHERB', name: 'Teacher Test B', email: 'teacherB@test.com', role: 'teacher' },
    });
    userTeacherB = await prisma.user.create({
      data: { tenantId: tenantA.id, name: 'Teacher Test B', email: 'teacherb@test.com', password: passwordHash, identity: 'staff', staffId: staffTeacherB.id },
    });

    // Tenant B Admin User
    const staffAdminB = await prisma.staff.create({
      data: { tenantId: tenantB.id, employeeId: 'EMP-T-ADMINB', name: 'Admin Test B', email: 'adminB@test.com', role: 'other' },
    });
    await prisma.user.create({
      data: { tenantId: tenantB.id, name: 'Admin Test B', email: 'adminb@test.com', password: passwordHash, identity: 'admin', staffId: staffAdminB.id },
    });

    // 6. Create Subject and PeriodSlot for Timetable
    subjectA = await prisma.subject.create({
      data: { tenantId: tenantA.id, name: 'Mathematics', code: 'MATH-T101' },
    });
    periodSlotA = await prisma.periodSlot.create({
      data: { tenantId: tenantA.id, slotNo: 1, label: 'Period 1', slotType: 'period', startTime: '08:00', endTime: '08:45' },
    });

    // 7. Create Timetable Entry (Teacher A teaches Class A on Fridays)
    await prisma.timetable.create({
      data: {
        tenantId: tenantA.id,
        academicYearId: academicYearA.id,
        classId: classA.id,
        sectionId: sectionA.id,
        subjectId: subjectA.id,
        staffId: staffTeacherA.id,
        periodSlotId: periodSlotA.id,
        dayOfWeek: 5, // Friday
      },
    });

    // 8. Create Fee Category and Fee Structure (Tenant A)
    feeCategoryA = await prisma.feeCategory.create({
      data: { tenantId: tenantA.id, name: 'Tuition Fee Test', description: 'Test category' },
    });
    feeStructureA = await prisma.feeStructure.create({
      data: {
        tenantId: tenantA.id,
        academicYearId: academicYearA.id,
        classId: classA.id,
        feeCategoryId: feeCategoryA.id,
        amount: 5000.00,
        frequency: 'annual',
      },
    });

    // 9. Login to obtain tokens
    const loginResAdminA = await request(app).post('/api/v1/auth/login').send({ email: 'admina@test.com', password: 'password123', tenantId: tenantA.id });
    tokenAdminA = loginResAdminA.body.data.token;

    const loginResTeacherA = await request(app).post('/api/v1/auth/login').send({ email: 'teachera@test.com', password: 'password123', tenantId: tenantA.id });
    tokenTeacherA = loginResTeacherA.body.data.token;

    const loginResAccountantA = await request(app).post('/api/v1/auth/login').send({ email: 'accountanta@test.com', password: 'password123', tenantId: tenantA.id });
    tokenAccountantA = loginResAccountantA.body.data.token;

    const loginResTeacherB = await request(app).post('/api/v1/auth/login').send({ email: 'teacherb@test.com', password: 'password123', tenantId: tenantA.id });
    tokenTeacherB = loginResTeacherB.body.data.token;

    const loginResAdminB = await request(app).post('/api/v1/auth/login').send({ email: 'adminb@test.com', password: 'password123', tenantId: tenantB.id });
    tokenAdminB = loginResAdminB.body.data.token;
  });

  afterAll(async () => {
    // Cleanup the database using CASCADE deletes
    await deleteTenantBySubdomain('tenant-test-a');
    await deleteTenantBySubdomain('tenant-test-b');
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

  describe('Auth Module Integration', () => {
    it('should successfully log in admin and teacher and carry correct JWT claims', async () => {
      // Admin verification
      const decodedAdmin = jwt.decode(tokenAdminA);
      expect(decodedAdmin.userId).toBe(userAdminA.id);
      expect(decodedAdmin.tenantId).toBe(tenantA.id);
      expect(decodedAdmin.identity).toBe('admin');
      expect(decodedAdmin.staffId).toBe(staffAdminA.id);

      // Teacher verification
      const decodedTeacher = jwt.decode(tokenTeacherA);
      expect(decodedTeacher.userId).toBe(userTeacherA.id);
      expect(decodedTeacher.tenantId).toBe(tenantA.id);
      expect(decodedTeacher.identity).toBe('staff');
      expect(decodedTeacher.staffId).toBe(staffTeacherA.id);
      expect(decodedTeacher.staffRole).toBe('teacher');
    });

    it('should confirm markedById (attendance) is derived from token, not request body', async () => {
      // Mark attendance as Teacher A, passing a fake markedById in the body.
      // 2026-07-10 is a Friday. Teacher A is timetabled, so it should succeed.
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-10',
          markedById: 9999, // Fake markedById in body
          records: [
            { studentId: studentA.id, status: 'present', remark: 'Good' }
          ]
        });

      expect(response.status).toBe(200);

      // Retrieve from database and verify markedById matches Teacher A's staffId (not 9999)
      const record = await prisma.studentAttendance.findUnique({
        where: {
          tenantId_studentId_date: {
            tenantId: tenantA.id,
            studentId: studentA.id,
            date: new Date('2026-07-10T00:00:00.000Z')
          }
        }
      });
      expect(record).not.toBeNull();
      expect(record.markedById).toBe(staffTeacherA.id);
      expect(record.markedById).not.toBe(9999);
    });

    it('should confirm collectedById (fees) is derived from token, not request body', async () => {
      // Collect fee as Accountant A, passing fake collectedById in body
      const response = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentA.id,
          feeStructureId: feeStructureA.id,
          academicYearId: academicYearA.id,
          amount: 1000.00,
          paymentMode: 'cash',
          paymentDate: '2026-07-06',
          collectedById: 9999 // Fake collectedById in body
        });

      expect(response.status).toBe(201);

      // Retrieve collection from database and verify collectedById matches Accountant A's staffId (not 9999)
      const collection = await prisma.feeCollection.findUnique({
        where: {
          receiptNo_tenantId: {
            receiptNo: response.body.data.receiptNo,
            tenantId: tenantA.id
          }
        }
      });
      expect(collection).not.toBeNull();
      expect(collection.collectedById).toBe(staffAccountantA.id);
      expect(collection.collectedById).not.toBe(9999);
    });
  });

  describe('Attendance Module Integration', () => {
    it('should reject class marking if teacher is NOT timetabled for it -> 403', async () => {
      // Teacher B is NOT timetabled to teach Class A on Friday (or any day)
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenTeacherB}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-10',
          records: [
            { studentId: studentA.id, status: 'present' }
          ]
        });

      expect(response.status).toBe(403);
    });

    it('should reject staff marking by a teacher -> 403', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/staff/mark')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          academicYearId: academicYearA.id,
          staffId: staffTeacherB.id,
          date: '2026-07-10',
          status: 'present'
        });

      expect(response.status).toBe(403);
    });

    it('should allow admin to mark class attendance -> 200', async () => {
      // Admin should bypass timetabled check
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-10',
          records: [
            { studentId: studentA.id, status: 'present' }
          ]
        });

      expect(response.status).toBe(200);
    });

    it('should reject class marking on a Sunday -> 400', async () => {
      // 2026-07-12 is Sunday
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-12',
          records: [
            { studentId: studentA.id, status: 'present' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('Sunday');
    });

    it('should reject class marking on a 2nd Saturday -> 400', async () => {
      // 2026-07-11 is the 2nd Saturday of July 2026
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-11',
          records: [
            { studentId: studentA.id, status: 'present' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('Saturday');
    });

    it('should reject class marking on a declared holiday -> 400', async () => {
      // 2026-07-13 is Monday. Let's first declare it as a holiday.
      await prisma.holiday.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          name: 'Declared Test Holiday',
          date: new Date('2026-07-13T00:00:00.000Z'),
          holidayType: 'public',
        }
      });

      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-13',
          records: [
            { studentId: studentA.id, status: 'present' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('holiday');
    });
  });

  describe('Holiday Module Integration', () => {
    it('should reject duplicate holiday on same date under same tenant -> 409', async () => {
      // Holiday on 2026-07-14
      const res1 = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Test Holiday 1',
          date: '2026-07-14',
          holidayType: 'public'
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Test Holiday 2',
          date: '2026-07-14',
          holidayType: 'public'
        });
      expect(res2.status).toBe(409); // Should be 409 Conflict, not 500
    });

    it('should reject holiday outside academic year date range -> 400', async () => {
      // Academic year range is 2026-06-01 to 2027-05-31
      // 2026-05-15 is outside range
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Pre-Academic Year Holiday',
          date: '2026-05-15',
          holidayType: 'public'
        });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toContain('academic year date range');
    });

    it('should correctly block a non-admin (teacher) from managing holidays (Fix verified)', async () => {
      // 1. Teacher creates holiday -> 403
      const createRes = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          academicYearId: academicYearA.id,
          name: 'Teacher Created Holiday',
          date: '2026-07-28',
          holidayType: 'school'
        });
      
      expect(createRes.status).toBe(403);

      // (We skip testing update/delete since we couldn't create it in the first place,
      // but to be thorough we can try to update a non-existent ID or an existing one)
      const updateRes = await request(app)
        .put('/api/v1/holidays/999')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({ name: 'Teacher Updated Title' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete('/api/v1/holidays/999')
        .set('Authorization', `Bearer ${tokenTeacherA}`);

      expect(deleteRes.status).toBe(403);
    });
  });

  describe('Fee Management Module Integration', () => {
    it('should prevent non-admin from creating fee categories -> 403', async () => {
      const response = await request(app)
        .post('/api/v1/fees/categories')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({ name: 'Teacher Created Category' });

      expect(response.status).toBe(403);
    });

    it('should prevent non-admin from creating fee structures -> 403', async () => {
      const response = await request(app)
        .post('/api/v1/fees/structures')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          feeCategoryId: feeCategoryA.id,
          amount: 1000
        });

      expect(response.status).toBe(403);
    });

    it('should prevent teacher (non-accountant) from collecting payment -> 403', async () => {
      const response = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenTeacherA}`)
        .send({
          studentId: studentA.id,
          feeStructureId: feeStructureA.id,
          academicYearId: academicYearA.id,
          amount: 500,
          paymentMode: 'cash',
          paymentDate: '2026-07-06'
        });

      expect(response.status).toBe(403);
    });

    it('should allow accountant to collect payment and return a sequential receiptNo -> 201', async () => {
      // First collection for this academic year A -> RC/academicYearA.id/000001 or similar
      const res1 = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentA.id,
          feeStructureId: feeStructureA.id,
          academicYearId: academicYearA.id,
          amount: 2000.00,
          paymentMode: 'cash',
          paymentDate: '2026-07-06'
        });

      expect(res1.status).toBe(201);
      const receiptNo1 = res1.body.data.receiptNo;
      expect(receiptNo1).toMatch(new RegExp(`RC\\/${academicYearA.id}\\/\\d{6}`));
      
      // Get the serial number at the end
      const serial1 = parseInt(receiptNo1.split('/').pop());

      // Second collection
      const res2 = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentA.id,
          feeStructureId: feeStructureA.id,
          academicYearId: academicYearA.id,
          amount: 1000.00,
          paymentMode: 'cash',
          paymentDate: '2026-07-07'
        });

      expect(res2.status).toBe(201);
      const receiptNo2 = res2.body.data.receiptNo;
      const serial2 = parseInt(receiptNo2.split('/').pop());

      expect(serial2).toBe(serial1 + 1); // Verify sequential order
    });

    it('should compute netAmount server-side (netAmount = amount - discount + fine) and ignore body', async () => {
      // Let's send a request with a mismatching netAmount in request body
      const amount = 1500.00;
      const discount = 200.00;
      const fine = 50.00;
      const fakeNetAmount = 9999.99; // Body sent fake netAmount
      const expectedNetAmount = amount - discount + fine; // 1350.00

      const response = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentA.id,
          feeStructureId: feeStructureA.id,
          academicYearId: academicYearA.id,
          amount,
          discount,
          fine,
          netAmount: fakeNetAmount,
          paymentMode: 'cash',
          paymentDate: '2026-07-08'
        });

      expect(response.status).toBe(201);
      
      // Query the database to verify the stored value
      const storedCollection = await prisma.feeCollection.findUnique({
        where: {
          receiptNo_tenantId: {
            receiptNo: response.body.data.receiptNo,
            tenantId: tenantA.id
          }
        }
      });

      expect(storedCollection).not.toBeNull();
      expect(Number(storedCollection.netAmount)).toBe(expectedNetAmount);
      expect(Number(storedCollection.netAmount)).not.toBe(fakeNetAmount);
    });

    it('should show "partial" status and correct remaining balance on partial payment', async () => {
      // Let's create a new class, student, and fee structure under Tenant A.
      const classTestFee = await prisma.class.create({
        data: { tenantId: tenantA.id, name: 'Fee Test Class' }
      });
      const studentTestFee = await prisma.student.create({
        data: { tenantId: tenantA.id, admissionNo: 'ADM-FEE-PARTIAL', studentName: 'Partial Student', classId: classTestFee.id }
      });
      const feeStructureTestFee = await prisma.feeStructure.create({
        data: {
          tenantId: tenantA.id,
          academicYearId: academicYearA.id,
          classId: classTestFee.id,
          feeCategoryId: feeCategoryA.id,
          amount: 5000.00,
        }
      });

      // Now collect a partial payment of 2000 (owed 5000, remaining balance 3000)
      const payRes = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentTestFee.id,
          feeStructureId: feeStructureTestFee.id,
          academicYearId: academicYearA.id,
          amount: 2000.00,
          paymentMode: 'cash',
          paymentDate: '2026-07-06'
        });
      expect(payRes.status).toBe(201);

      // Now query student status
      const statusRes = await request(app)
        .get(`/api/v1/fees/students/${studentTestFee.id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .query({ academicYearId: academicYearA.id });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.student.id).toBe(studentTestFee.id);
      
      const breakdown = statusRes.body.data.breakdown.find(b => b.feeStructureId === feeStructureTestFee.id);
      expect(breakdown).toBeDefined();
      expect(breakdown.status).toBe('partial');
      expect(Number(breakdown.owed)).toBe(5000);
      expect(Number(breakdown.paid)).toBe(2000);
      expect(Number(breakdown.balance)).toBe(3000);
    });
  });

  describe('Tenant Scoping Verification', () => {
    it('should prevent User A from logging in under Tenant B', async () => {
      // admina@test.com belongs to Tenant A. Try logging in with tenantId = Tenant B.
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admina@test.com',
          password: 'password123',
          tenantId: tenantB.id
        });

      expect(response.status).toBe(401);
    });

    it('should reject Admin A getting Tenant B student history -> 404', async () => {
      const response = await request(app)
        .get(`/api/v1/attendance/students/${studentB.id}/history`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .query({ academicYearId: academicYearA.id });

      expect(response.status).toBe(404);
    });

    it('should reject Admin A updating Tenant B holiday -> 404', async () => {
      // Create holiday in Tenant B
      const holidayB = await prisma.holiday.create({
        data: {
          tenantId: tenantB.id,
          academicYearId: academicYearB.id,
          name: 'Tenant B Holiday',
          date: new Date('2026-07-20T00:00:00.000Z'),
          holidayType: 'public',
        }
      });

      const response = await request(app)
        .put(`/api/v1/holidays/${holidayB.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(404);
    });

    it('should reject Admin A deleting Tenant B holiday -> 404', async () => {
      // Create holiday in Tenant B
      const holidayB = await prisma.holiday.create({
        data: {
          tenantId: tenantB.id,
          academicYearId: academicYearB.id,
          name: 'Tenant B Holiday 2',
          date: new Date('2026-07-21T00:00:00.000Z'),
          holidayType: 'public',
        }
      });

      const response = await request(app)
        .delete(`/api/v1/holidays/${holidayB.id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(response.status).toBe(404);
    });

    it('should reject Admin A getting Student B fee status -> 404', async () => {
      const response = await request(app)
        .get(`/api/v1/fees/students/${studentB.id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .query({ academicYearId: academicYearA.id });

      expect(response.status).toBe(404);
    });

    it('should reject Accountant A collecting fees for Student B (Tenant B) -> 404', async () => {
      const response = await request(app)
        .post('/api/v1/fees/collect')
        .set('Authorization', `Bearer ${tokenAccountantA}`)
        .send({
          studentId: studentB.id,
          feeStructureId: feeStructureA.id, // Structure belonging to Tenant A (mismatch)
          academicYearId: academicYearA.id,
          amount: 500,
          paymentMode: 'cash',
          paymentDate: '2026-07-06'
        });

      expect(response.status).toBe(404);
    });

    it('should correctly block Tenant A admin from marking attendance for Tenant B student (Fix verified)', async () => {
      // Validates that Student B (tenant B) cannot be marked by Tenant A admin
      const response = await request(app)
        .post('/api/v1/attendance/students/mark-class')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          academicYearId: academicYearA.id,
          classId: classA.id,
          sectionId: sectionA.id,
          date: '2026-07-10',
          records: [
            { studentId: studentB.id, status: 'present' }
          ]
        });

      // Security Fix: Should return 400 for validation failure (invalid/wrong tenant student)
      expect(response.status).toBe(400);

      const record = await prisma.studentAttendance.findUnique({
        where: {
          tenantId_studentId_date: {
            tenantId: tenantA.id,
            studentId: studentB.id,
            date: new Date('2026-07-10T00:00:00.000Z')
          }
        }
      });
      expect(record).toBeNull();
    });
  });
});
