const bcrypt = require('bcrypt');
const prisma = require('../../prisma/prismaClient');

function getBcryptCost() {
  const raw = Number.parseInt(process.env.BCRYPT_COST || '12', 10);
  const cost = Number.isFinite(raw) ? raw : 12;
  return Math.min(14, Math.max(10, cost));
}

// Creates a parent login (User) from a StudentParent record, IF:
//  - it has both an email and a mobile number, AND
//  - no login already exists for that email in this tenant
//    (e.g. same father already has a login from a sibling's record — skip silently)
// Password = last 6 digits of mobile (or fewer if the number is short, min 4).
// Returns the plaintext password (so the caller can surface it once), or null if skipped.
async function maybeCreateParentUser(tx, studentParent, tenantId) {
  if (!studentParent.email || !studentParent.mobile) return null;

  const digits = String(studentParent.mobile).replace(/\D/g, '');
  if (digits.length < 4) return null;

  const existingUser = await tx.user.findUnique({
    where: { email_tenantId: { email: studentParent.email, tenantId } },
  });
  if (existingUser) return null;

  const rawPassword = digits.slice(-6);
  const hashedPassword = await bcrypt.hash(rawPassword, getBcryptCost());

  await tx.user.create({
    data: {
      name: studentParent.name,
      email: studentParent.email,
      password: hashedPassword,
      tenantId,
      identity: 'parent',
      parentId: studentParent.id,
    },
  });

  return rawPassword;
}

// Returns the set of studentIds a given parent User is allowed to see,
// via their StudentParent link(s). A parent User is 1:1 with a single
// StudentParent row (see User.parentId), so this is normally a single
// studentId, but kept as an array for safety/clarity.
async function getStudentIdsForParent(parentUserParentId, tenantId) {
  if (!parentUserParentId) return [];
  const link = await prisma.studentParent.findFirst({
    where: { id: parentUserParentId, tenantId },
    select: { studentId: true },
  });
  return link ? [link.studentId] : [];
}

const createStudent = async (data, tenantId) => {
  const {
    admissionNo, feeNo, siblingAdmNo, studentName, childLivingWith,
    photoUrl, signatureUrl, fatherTitle, fatherName, motherTitle, motherName,
    classId, sectionId, stream, feeGroup, feePaymentStartFrom,
    dateOfBirth, dateOfAdmission, dateOfJoin, rollNo, gender,
    admissionType, classAdmitted, emergencyPhoneNo, house, boardingCategory,
    board, medium, boardRegistrationNo, studentEmail, countryCode,
    communicationMobile, communicationEmail, aadharNo, remark, feeRemark,
    uniqueNo, grNo, rfidNo, eNach, bankName, accountNo, ifsc,
    virtualAccountNo, apaarId, srnNo,
    bloodGroup, religion, category, motherTongue, nationality, maritalStatus,
    father, mother, guardian,
  } = data;

  const existing = await prisma.student.findFirst({
    where: { admissionNo, tenantId, isDeleted: false },
  });
  if (existing) throw new Error('Admission number already exists');

  const validClass = await prisma.class.findFirst({
    where: { id: parseInt(classId), tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!validClass) throw new Error('Invalid class for this tenant');

  if (sectionId) {
    const validSection = await prisma.section.findFirst({
      where: { id: parseInt(sectionId), tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!validSection) throw new Error('Invalid section for this tenant');
  }

  const parentCredentials = [];

  const student = await prisma.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: {
        admissionNo, feeNo, siblingAdmNo, studentName, childLivingWith,
        photoUrl, signatureUrl, fatherTitle, fatherName, motherTitle, motherName,
        classId: parseInt(classId),
        sectionId: sectionId ? parseInt(sectionId) : null,
        stream, feeGroup, feePaymentStartFrom,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfAdmission: dateOfAdmission ? new Date(dateOfAdmission) : null,
        dateOfJoin: dateOfJoin ? new Date(dateOfJoin) : null,
        rollNo, gender, admissionType, classAdmitted, emergencyPhoneNo,
        house, boardingCategory, board, medium, boardRegistrationNo,
        studentEmail, countryCode, communicationMobile, communicationEmail,
        aadharNo, remark, feeRemark, uniqueNo, grNo, rfidNo, eNach,
        bankName, accountNo, ifsc, virtualAccountNo, apaarId, srnNo,
        bloodGroup, religion, category, motherTongue, nationality, maritalStatus,
        tenantId,
      },
    });

    const parentsInput = [];
    if (father) parentsInput.push({ ...father, relation: 'father' });
    if (mother) parentsInput.push({ ...mother, relation: 'mother' });
    if (guardian) parentsInput.push({ ...guardian, relation: 'guardian' });

    for (const p of parentsInput) {
      const createdParent = await tx.studentParent.create({
        data: { ...p, studentId: created.id, tenantId },
      });

      const rawPassword = await maybeCreateParentUser(tx, createdParent, tenantId);
      if (rawPassword) {
        parentCredentials.push({
          relation: createdParent.relation,
          name: createdParent.name,
          email: createdParent.email,
          password: rawPassword,
        });
      }
    }

    return created;
  });

  const fullStudent = await getStudentById(student.id, tenantId);
  return { ...fullStudent, parentCredentials };
};

const getAllStudents = async (tenantId, query = {}, requester = null) => {
  const { page = 1, limit = 10, search = '', classId, gender } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    tenantId, isDeleted: false,
    ...(search && {
      OR: [
        { studentName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { grNo: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(classId && { classId: parseInt(classId) }),
    ...(gender && { gender }),
  };

  // Parents only ever see the student(s) they are linked to.
  if (requester && requester.identity === 'parent') {
    const allowedIds = await getStudentIdsForParent(requester.parentId, tenantId);
    where.id = { in: allowedIds }; // empty array -> no results, not "all"
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        parents: true,
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students,
    pagination: {
      total, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

const getStudentById = async (id, tenantId, requester = null) => {
  // Parents may only fetch a student they are linked to.
  if (requester && requester.identity === 'parent') {
    const allowedIds = await getStudentIdsForParent(requester.parentId, tenantId);
    if (!allowedIds.includes(parseInt(id))) {
      throw new Error('Student not found');
    }
  }

  const student = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      parents: {
        include: { user: { select: { id: true, email: true, identity: true } } },
      },
      customFieldValues: {
        include: { customField: true },
      },
    },
  });
  if (!student) throw new Error('Student not found');
  return student;
};

const updateStudent = async (id, data, tenantId) => {
  const existing = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
  });
  if (!existing) throw new Error('Student not found');

  const { father, mother, guardian, tenantId: _ignored, ...studentData } = data;

  if (studentData.classId) {
    const validClass = await prisma.class.findFirst({
      where: { id: parseInt(studentData.classId), tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!validClass) throw new Error('Invalid class for this tenant');
  }

  if (studentData.sectionId) {
    const validSection = await prisma.section.findFirst({
      where: { id: parseInt(studentData.sectionId), tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!validSection) throw new Error('Invalid section for this tenant');
  }

  const parentCredentials = [];

  await prisma.$transaction(async (tx) => {
    const { classId: _cid, sectionId: _sid, dateOfBirth: _dob, dateOfAdmission: _doa, dateOfJoin: _doj, ...restStudentData } = studentData;
    await tx.student.update({
      where: { id: parseInt(id) },
      data: {
        ...restStudentData,
        ...(studentData.classId && { classId: parseInt(studentData.classId) }),
        ...(studentData.sectionId && { sectionId: parseInt(studentData.sectionId) }),
        ...(studentData.dateOfBirth && { dateOfBirth: new Date(studentData.dateOfBirth) }),
        ...(studentData.dateOfAdmission && { dateOfAdmission: new Date(studentData.dateOfAdmission) }),
        ...(studentData.dateOfJoin && { dateOfJoin: new Date(studentData.dateOfJoin) }),
      },
    });

    for (const [relation, parentData] of [['father', father], ['mother', mother], ['guardian', guardian]]) {
      if (!parentData) continue;
      const { tenantId: _t, ...safeParentData } = parentData;

      const existingParent = await tx.studentParent.findFirst({
        where: { studentId: parseInt(id), relation },
        include: { user: { select: { id: true } } },
      });

      let parentRecord;
      if (existingParent) {
        parentRecord = await tx.studentParent.update({
          where: { id: existingParent.id },
          data: { ...safeParentData, tenantId },
        });
        if (!existingParent.user) {
          const rawPassword = await maybeCreateParentUser(tx, parentRecord, tenantId);
          if (rawPassword) {
            parentCredentials.push({ relation, name: parentRecord.name, email: parentRecord.email, password: rawPassword });
          }
        }
      } else {
        parentRecord = await tx.studentParent.create({
          data: { ...safeParentData, relation, studentId: parseInt(id), tenantId },
        });
        const rawPassword = await maybeCreateParentUser(tx, parentRecord, tenantId);
        if (rawPassword) {
          parentCredentials.push({ relation, name: parentRecord.name, email: parentRecord.email, password: rawPassword });
        }
      }
    }
  });

  const fullStudent = await getStudentById(id, tenantId);
  return { ...fullStudent, parentCredentials };
};

const deleteStudent = async (id, tenantId) => {
  const existing = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
  });
  if (!existing) throw new Error('Student not found');
  await prisma.student.update({ where: { id: parseInt(id) }, data: { isDeleted: true } });
  return { message: 'Student deleted successfully' };
};

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };
