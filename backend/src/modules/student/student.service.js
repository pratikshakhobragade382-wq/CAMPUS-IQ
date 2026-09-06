const bcrypt = require("bcrypt");
const prisma = require("../../prisma/prismaClient");
const {
  createNotification,
} = require("../notification/notification.service");

function getBcryptCost() {
  const raw = Number.parseInt(process.env.BCRYPT_COST || "12", 10);
  const cost = Number.isFinite(raw) ? raw : 12;
  return Math.min(14, Math.max(10, cost));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ============================================================
// PARENT LOGIN LINKING
// ------------------------------------------------------------
// A single parent (matched by email) may be linked to MANY
// StudentParent rows (siblings). We match on email as the
// canonical identity key. If a User already exists for this
// email, we attach this new StudentParent row to it instead
// of creating a second account or silently dropping the link.
// ============================================================
async function maybeCreateParentUser(tx, studentParent, tenantId) {
  if (!studentParent.email || !studentParent.mobile) return null;

  const digits = String(studentParent.mobile).replace(/\D/g, "");
  if (digits.length < 4) return null;

  const existingUser = await tx.user.findUnique({
    where: {
      email_tenantId: {
        email: studentParent.email,
        tenantId,
      },
    },
  });

  if (existingUser) {
    if (existingUser.identity !== "parent") return null;

    await tx.studentParent.update({
      where: { id: studentParent.id },
      data: { userId: existingUser.id },
    });

    return null;
  }

  const rawPassword = digits.slice(-6);
  const hashedPassword = await bcrypt.hash(rawPassword, getBcryptCost());

  const newUser = await tx.user.create({
    data: {
      name: studentParent.name,
      email: studentParent.email,
      password: hashedPassword,
      tenantId,
      identity: "parent",
    },
  });

  await tx.studentParent.update({
    where: { id: studentParent.id },
    data: { userId: newUser.id },
  });

  return rawPassword;
}

// ============================================================
// STUDENT LOGIN
// ------------------------------------------------------------
// Students rarely have a real email on file, so we generate a
// stable system login: {admissionNo}@{tenantSubdomain}.student
// Initial password = DOB as DDMMYYYY.
// ============================================================
async function maybeCreateStudentUser(tx, student, tenantId) {
  const existingLink = await tx.user.findUnique({
    where: { studentId: student.id },
  });
  if (existingLink) return null;

  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: { subdomain: true },
  });

  const loginEmail = `${student.admissionNo.toLowerCase()}@${tenant.subdomain.toLowerCase()}.student`;

  const existingByEmail = await tx.user.findUnique({
    where: { email_tenantId: { email: loginEmail, tenantId } },
  });
  if (existingByEmail) return null;

  let rawPassword;
  if (student.dateOfBirth) {
    const d = new Date(student.dateOfBirth);
    rawPassword = `${pad2(d.getDate())}${pad2(d.getMonth() + 1)}${d.getFullYear()}`;
  } else {
    rawPassword = `${student.admissionNo}@123`;
  }

  const hashedPassword = await bcrypt.hash(rawPassword, getBcryptCost());

  await tx.user.create({
    data: {
      name: student.studentName,
      email: loginEmail,
      password: hashedPassword,
      tenantId,
      identity: "student",
      studentId: student.id,
    },
  });

  return { email: loginEmail, password: rawPassword };
}

// Returns ALL student IDs linked to a parent's user account
// (handles siblings correctly — one parent, many children).
async function getStudentIdsForParent(userId, tenantId) {
  if (!userId) return [];

  const links = await prisma.studentParent.findMany({
    where: { userId, tenantId },
    select: { studentId: true },
  });

  return [...new Set(links.map((l) => l.studentId))];
}

// =====================================================
// CREATE STUDENT
// =====================================================

const createStudent = async (data, tenantId) => {
  const {
    admissionNo,
    feeNo,
    siblingAdmNo,
    studentName,
    childLivingWith,
    photoUrl,
    signatureUrl,
    fatherTitle,
    fatherName,
    motherTitle,
    motherName,
    classId,
    sectionId,
    stream,
    feeGroup,
    feePaymentStartFrom,
    dateOfBirth,
    dateOfAdmission,
    dateOfJoin,
    rollNo,
    gender,
    admissionType,
    classAdmitted,
    emergencyPhoneNo,
    house,
    boardingCategory,
    board,
    medium,
    boardRegistrationNo,
    studentEmail,
    countryCode,
    communicationMobile,
    communicationEmail,
    aadharNo,
    remark,
    feeRemark,
    uniqueNo,
    grNo,
    rfidNo,
    eNach,
    bankName,
    accountNo,
    ifsc,
    virtualAccountNo,
    apaarId,
    srnNo,
    bloodGroup,
    religion,
    category,
    motherTongue,
    nationality,
    maritalStatus,
    father,
    mother,
    guardian,
  } = data;

  const existing = await prisma.student.findFirst({
    where: {
      admissionNo,
      tenantId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("Admission number already exists");
  }

  const validClass = await prisma.class.findFirst({
    where: {
      id: parseInt(classId),
      tenantId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!validClass) {
    throw new Error("Invalid class for this tenant");
  }

  if (sectionId) {
    const validSection = await prisma.section.findFirst({
      where: {
        id: parseInt(sectionId),
        tenantId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!validSection) {
      throw new Error("Invalid section for this tenant");
    }
  }

  const parentCredentials = [];

  const txResult = await prisma.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: {
        admissionNo,
        feeNo,
        siblingAdmNo,
        studentName,
        childLivingWith,
        photoUrl,
        signatureUrl,
        fatherTitle,
        fatherName,
        motherTitle,
        motherName,
        classId: parseInt(classId),
        sectionId: sectionId ? parseInt(sectionId) : null,
        stream,
        feeGroup,
        feePaymentStartFrom,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfAdmission: dateOfAdmission ? new Date(dateOfAdmission) : null,
        dateOfJoin: dateOfJoin ? new Date(dateOfJoin) : null,
        rollNo,
        gender,
        admissionType,
        classAdmitted,
        emergencyPhoneNo,
        house,
        boardingCategory,
        board,
        medium,
        boardRegistrationNo,
        studentEmail,
        countryCode,
        communicationMobile,
        communicationEmail,
        aadharNo,
        remark,
        feeRemark,
        uniqueNo,
        grNo,
        rfidNo,
        eNach,
        bankName,
        accountNo,
        ifsc,
        virtualAccountNo,
        apaarId,
        srnNo,
        bloodGroup,
        religion,
        category,
        motherTongue,
        nationality,
        maritalStatus,
        tenantId,
      },
    });

    const parentsInput = [];

    if (father) {
      parentsInput.push({ ...father, relation: "father" });
    }
    if (mother) {
      parentsInput.push({ ...mother, relation: "mother" });
    }
    if (guardian) {
      parentsInput.push({ ...guardian, relation: "guardian" });
    }

    for (const parent of parentsInput) {
      const createdParent = await tx.studentParent.create({
        data: {
          ...parent,
          studentId: created.id,
          tenantId,
        },
      });

      const rawPassword = await maybeCreateParentUser(
        tx,
        createdParent,
        tenantId
      );

      if (rawPassword) {
        parentCredentials.push({
          relation: createdParent.relation,
          name: createdParent.name,
          email: createdParent.email,
          password: rawPassword,
        });
      }
    }

    const studentCredentials = await maybeCreateStudentUser(
      tx,
      created,
      tenantId
    );

    return { created, studentCredentials };
  });

  const { created: student, studentCredentials } = txResult;

  const fullStudent = await getStudentById(student.id, tenantId);

  try {
    await createNotification({
      tenantId,
      title: "New Student Added",
      message: `${fullStudent.studentName} has been added as a new student.`,
      type: "student",
      priority: "normal",
      audience: "all",
    });
  } catch (notifyErr) {
    console.error("Notification creation failed (non-fatal):", notifyErr);
  }

  return {
    ...fullStudent,
    parentCredentials,
    studentCredentials,
  };
};

// =====================================================
// GET ALL STUDENTS
// =====================================================

const getAllStudents = async (tenantId, query = {}, requester = null) => {
  const { page = 1, limit = 10, search = "", classId, gender } = query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const where = {
    tenantId,
    isDeleted: false,
    ...(search && {
      OR: [
        { studentName: { contains: search, mode: "insensitive" } },
        { admissionNo: { contains: search, mode: "insensitive" } },
        { grNo: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(classId && { classId: parseInt(classId) }),
    ...(gender && { gender }),
  };

  if (requester && requester.identity === "parent") {
    const allowedIds = await getStudentIdsForParent(
      requester.userId,
      tenantId
    );
    where.id = { in: allowedIds };
  }

  if (requester && requester.identity === "student") {
    where.id = requester.studentId || -1;
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: "desc" },
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
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudentById = async (id, tenantId, requester = null) => {
  if (requester && requester.identity === "parent") {
    const allowedIds = await getStudentIdsForParent(
      requester.userId,
      tenantId
    );
    if (!allowedIds.includes(parseInt(id))) {
      throw new Error("Student not found");
    }
  }

  if (requester && requester.identity === "student") {
    if (requester.studentId !== parseInt(id)) {
      throw new Error("Student not found");
    }
  }

  const student = await prisma.student.findFirst({
    where: {
      id: parseInt(id),
      tenantId,
      isDeleted: false,
    },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      parents: {
        include: {
          user: { select: { id: true, email: true, identity: true } },
        },
      },
      customFieldValues: { include: { customField: true } },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
};

// =====================================================
// UPDATE STUDENT
// =====================================================

const updateStudent = async (id, data, tenantId) => {
  const existing = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Student not found");
  }

  const {
    father,
    mother,
    guardian,
    tenantId: _ignored,
    ...studentData
  } = data;

  if (studentData.classId) {
    const validClass = await prisma.class.findFirst({
      where: {
        id: parseInt(studentData.classId),
        tenantId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!validClass) {
      throw new Error("Invalid class for this tenant");
    }
  }

  if (studentData.sectionId) {
    const validSection = await prisma.section.findFirst({
      where: {
        id: parseInt(studentData.sectionId),
        tenantId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!validSection) {
      throw new Error("Invalid section for this tenant");
    }
  }

  const parentCredentials = [];

  await prisma.$transaction(async (tx) => {
    const {
      classId: _cid,
      sectionId: _sid,
      dateOfBirth: _dob,
      dateOfAdmission: _doa,
      dateOfJoin: _doj,
      ...restStudentData
    } = studentData;

    await tx.student.update({
      where: { id: parseInt(id) },
      data: {
        ...restStudentData,
        ...(studentData.classId && {
          classId: parseInt(studentData.classId),
        }),
        ...(studentData.sectionId && {
          sectionId: parseInt(studentData.sectionId),
        }),
        ...(studentData.dateOfBirth && {
          dateOfBirth: new Date(studentData.dateOfBirth),
        }),
        ...(studentData.dateOfAdmission && {
          dateOfAdmission: new Date(studentData.dateOfAdmission),
        }),
        ...(studentData.dateOfJoin && {
          dateOfJoin: new Date(studentData.dateOfJoin),
        }),
      },
    });

    const parentEntries = [
      ["father", father],
      ["mother", mother],
      ["guardian", guardian],
    ];

    for (const [relation, parentData] of parentEntries) {
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
          const rawPassword = await maybeCreateParentUser(
            tx,
            parentRecord,
            tenantId
          );
          if (rawPassword) {
            parentCredentials.push({
              relation,
              name: parentRecord.name,
              email: parentRecord.email,
              password: rawPassword,
            });
          }
        }
      } else {
        parentRecord = await tx.studentParent.create({
          data: {
            ...safeParentData,
            relation,
            studentId: parseInt(id),
            tenantId,
          },
        });

        const rawPassword = await maybeCreateParentUser(
          tx,
          parentRecord,
          tenantId
        );
        if (rawPassword) {
          parentCredentials.push({
            relation,
            name: parentRecord.name,
            email: parentRecord.email,
            password: rawPassword,
          });
        }
      }
    }
  });

  const fullStudent = await getStudentById(id, tenantId);

  return {
    ...fullStudent,
    parentCredentials,
  };
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (id, tenantId) => {
  const existing = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Student not found");
  }

  await prisma.student.update({
    where: { id: parseInt(id) },
    data: { isDeleted: true },
  });

  return { message: "Student deleted successfully" };
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentIdsForParent,
};
