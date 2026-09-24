const bcrypt = require("bcrypt");
const prisma = require("../../prisma/prismaClient");
const {
  createNotification,
} = require("../notification/notification.service");

function getBcryptCost() {
  const raw = Number.parseInt(
    process.env.BCRYPT_COST || "12",
    10
  );

  const cost = Number.isFinite(raw) ? raw : 12;

  return Math.min(14, Math.max(10, cost));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ============================================================
// PRISMA TRANSACTION OPTIONS
// ============================================================
// Prisma's default interactive transaction timeout is 5 seconds.
//
// Student creation can take longer because it may create:
// - Student
// - Father / Mother / Guardian
// - Parent login users
// - Student login user
// - bcrypt password hashes
//
// We therefore allow up to 15 seconds.
// ============================================================

const TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 15000,
};

// ============================================================
// PARENT LOGIN LINKING
// ============================================================
// A parent is matched using email + tenant.
//
// If the parent User already exists, we connect the
// StudentParent record to that User.
//
// If the parent User does not exist, we create it first
// and then connect it to the StudentParent record.
// ============================================================

async function maybeCreateParentUser(
  tx,
  studentParent,
  tenantId
) {
  if (
    !studentParent.email ||
    !studentParent.mobile
  ) {
    return null;
  }

  const digits = String(
    studentParent.mobile
  ).replace(/\D/g, "");

  if (digits.length < 4) {
    return null;
  }

  const existingUser =
    await tx.user.findUnique({
      where: {
        email_tenantId: {
          email: studentParent.email,
          tenantId,
        },
      },
    });

  // ----------------------------------------------------------
  // Parent User already exists
  // ----------------------------------------------------------

  if (existingUser) {
    if (existingUser.identity !== "parent") {
      return null;
    }

    await tx.studentParent.update({
      where: {
        id: studentParent.id,
      },

      data: {
        user: {
          connect: {
            id: existingUser.id,
          },
        },
      },
    });

    return null;
  }

  // ----------------------------------------------------------
  // Create new Parent User
  // ----------------------------------------------------------

  const rawPassword = digits.slice(-6);

  const hashedPassword =
    await bcrypt.hash(
      rawPassword,
      getBcryptCost()
    );

  const newUser =
    await tx.user.create({
      data: {
        name: studentParent.name,
        email: studentParent.email,
        password: hashedPassword,
        tenantId,
        identity: "parent",
        mustChangePassword: true,
      },
    });

  // ----------------------------------------------------------
  // Connect StudentParent to the new User
  // ----------------------------------------------------------

  await tx.studentParent.update({
    where: {
      id: studentParent.id,
    },

    data: {
      user: {
        connect: {
          id: newUser.id,
        },
      },
    },
  });

  return rawPassword;
}

// ============================================================
// STUDENT LOGIN
// ============================================================
// Students rarely have a real email on file.
//
// Login:
// {admissionNo}@{tenantSubdomain}.student
//
// Password:
// DOB as DDMMYYYY
// ============================================================

async function maybeCreateStudentUser(
  tx,
  student,
  tenantId
) {
  const existingLink =
    await tx.user.findUnique({
      where: {
        studentId: student.id,
      },
    });

  if (existingLink) {
    return null;
  }

  const tenant =
    await tx.tenant.findUnique({
      where: {
        id: tenantId,
      },

      select: {
        subdomain: true,
      },
    });

  if (!tenant?.subdomain) {
    throw new Error(
      "Tenant subdomain not found"
    );
  }

  const loginEmail =
    `${student.admissionNo.toLowerCase()}@${tenant.subdomain.toLowerCase()}.student`;

  const existingByEmail =
    await tx.user.findUnique({
      where: {
        email_tenantId: {
          email: loginEmail,
          tenantId,
        },
      },
    });

  if (existingByEmail) {
    return null;
  }

  let rawPassword;

  if (student.dateOfBirth) {
    const d = new Date(
      student.dateOfBirth
    );

    rawPassword =
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(d).replace(/\//g, "");
  } else {
    rawPassword =
      `${student.admissionNo}@123`;
  }

  const hashedPassword =
    await bcrypt.hash(
      rawPassword,
      getBcryptCost()
    );

  await tx.user.create({
    data: {
      name: student.studentName,
      email: loginEmail,
      password: hashedPassword,
      tenantId,
      identity: "student",
      studentId: student.id,
      mustChangePassword: true,
    },
  });

  return {
    email: loginEmail,
    password: rawPassword,
  };
}

// ============================================================
// GET STUDENT IDS FOR PARENT
// ============================================================
// Returns ALL student IDs linked to a parent's user account.
// ============================================================

async function getStudentIdsForParent(
  userId,
  tenantId
) {
  if (!userId) {
    return [];
  }

  const user =
    await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        identity: "parent",
        isDeleted: false,
      },

      select: {
        parentId: true,
      },
    });

  if (!user?.parentId) {
    return [];
  }

  const parent =
    await prisma.studentParent.findFirst({
      where: {
        id: user.parentId,
        tenantId,
      },

      select: {
        studentId: true,
      },
    });

  return parent?.studentId
    ? [parent.studentId]
    : [];
}
async function getStudentIdsForTeacher(
  userId,
  tenantId
) {

  if (!userId) {
    return [];
  }


  // Find logged in staff
  const staff = await prisma.staff.findFirst({

    where: {

      user: {
        id: userId,
      },

      tenantId,

      isDeleted:false,

    },

    select:{
      id:true,
    },

  });


  if (!staff) {
    return [];
  }


  // Find sections from timetable where teacher is assigned
  const timetableSections = await prisma.timetable.findMany({

    where: {

      staffId: staff.id,

      tenantId,

    },

    select: {

      sectionId:true,

    },

    distinct:["sectionId"],

  });


  const sectionIds = timetableSections.map(
    item => item.sectionId
  );


  if(sectionIds.length === 0){
    return [];
  }


  // Get students from those sections
  const students = await prisma.student.findMany({

    where: {

      tenantId,

      isDeleted:false,

      sectionId:{
        in:sectionIds,
      },

    },

    select:{
      id:true,
    },

  });


  return students.map(
    student => student.id
  );

}
// =====================================================
// CREATE STUDENT
// =====================================================

const createStudent = async (
  data,
  tenantId
) => {
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

  // ----------------------------------------------------------
  // Check duplicate admission number
  // ----------------------------------------------------------

  const existing =
    await prisma.student.findFirst({
      where: {
        admissionNo,
        tenantId,
        isDeleted: false,
      },
    });

  if (existing) {
    throw new Error(
      "Admission number already exists"
    );
  }

  // ----------------------------------------------------------
  // Validate class
  // ----------------------------------------------------------

  const validClass =
    await prisma.class.findFirst({
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
    throw new Error(
      "Invalid class for this tenant"
    );
  }

  // ----------------------------------------------------------
  // Validate section
  // ----------------------------------------------------------

  if (sectionId) {
    const validSection =
      await prisma.section.findFirst({
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
      throw new Error(
        "Invalid section for this tenant"
      );
    }
  }

  const parentCredentials = [];

  // ==========================================================
  // TRANSACTION
  // ==========================================================

  const txResult =
    await prisma.$transaction(
      async (tx) => {
        // --------------------------------------------------------
        // Create Student
        // --------------------------------------------------------

        const created =
          await tx.student.create({
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

              sectionId: sectionId
                ? parseInt(sectionId)
                : null,

              stream,
              feeGroup,
              feePaymentStartFrom,

              dateOfBirth:
                dateOfBirth
                  ? new Date(dateOfBirth)
                  : null,

              dateOfAdmission:
                dateOfAdmission
                  ? new Date(dateOfAdmission)
                  : null,

              dateOfJoin:
                dateOfJoin
                  ? new Date(dateOfJoin)
                  : null,

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

        // --------------------------------------------------------
        // Prepare parents
        // --------------------------------------------------------

        const parentsInput = [];

        if (father) {
          parentsInput.push({
            ...father,
            relation: "father",
          });
        }

        if (mother) {
          parentsInput.push({
            ...mother,
            relation: "mother",
          });
        }

        if (guardian) {
          parentsInput.push({
            ...guardian,
            relation: "guardian",
          });
        }

        // --------------------------------------------------------
        // Create parents
        // --------------------------------------------------------

        for (
          const parent of parentsInput
        ) {
          const createdParent =
            await tx.studentParent.create({
              data: {
                ...parent,
                studentId: created.id,
                tenantId,
              },
            });

          const rawPassword =
            await maybeCreateParentUser(
              tx,
              createdParent,
              tenantId
            );

          if (rawPassword) {
            parentCredentials.push({
              relation:
                createdParent.relation,

              name:
                createdParent.name,

              email:
                createdParent.email,

              password:
                rawPassword,
            });
          }
        }

        // --------------------------------------------------------
        // Create student login
        // --------------------------------------------------------

        const studentCredentials =
          await maybeCreateStudentUser(
            tx,
            created,
            tenantId
          );

        return {
          created,
          studentCredentials,
        };
      },

      TRANSACTION_OPTIONS
    );

  const {
    created: student,
    studentCredentials,
  } = txResult;

  // ----------------------------------------------------------
  // Get complete student
  // ----------------------------------------------------------

  const fullStudent =
    await getStudentById(
      student.id,
      tenantId
    );

  // ----------------------------------------------------------
  // Notification
  // ----------------------------------------------------------

  try {
    await createNotification({
      tenantId,

      title:
        "New Student Added",

      message:
        `${fullStudent.studentName} has been added as a new student.`,

      type: "student",

      priority: "normal",

      audience: "all",
    });
  } catch (notifyErr) {
    console.error(
      "Notification creation failed (non-fatal):",
      notifyErr
    );
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

const getAllStudents = async (
  tenantId,
  query = {},
  requester = null
) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    classId,
    gender,
  } = query;

  const pageNumber =
    parseInt(page);

  const limitNumber =
    parseInt(limit);

  const skip =
    (pageNumber - 1) *
    limitNumber;

  const where = {
    tenantId,

    isDeleted: false,

    ...(search && {
      OR: [
        {
          studentName: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          admissionNo: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          grNo: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),

    ...(classId && {
      classId: parseInt(classId),
    }),

    ...(gender && {
      gender,
    }),
  };

  // ----------------------------------------------------------
  // Parent can only see allowed students
  // ----------------------------------------------------------

  if (
    requester &&
    requester.identity === "parent"
  ) {
    const allowedIds =
      await getStudentIdsForParent(
        requester.userId,
        tenantId
      );

    where.id = {
      in: allowedIds,
    };
  }

  // ----------------------------------------------------------
  // Student can only see themselves
  // ----------------------------------------------------------

  if (
    requester &&
    requester.identity === "student"
  ) {
    where.id =
      requester.studentId || -1;
  }
  // Teacher can only see assigned students

if (
  requester &&
  requester.identity === "staff"
) {

  const allowedIds =
    await getStudentIdsForTeacher(
      requester.userId,
      tenantId
    );


  where.id = {
    in: allowedIds,
  };

}
  const [
    students,
    total,
  ] = await Promise.all([
    prisma.student.findMany({
      where,

      skip,

      take: limitNumber,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },

        section: {
          select: {
            id: true,
            name: true,
          },
        },

        parents: true,
      },
    }),

    prisma.student.count({
      where,
    }),
  ]);

  return {
    students,

    pagination: {
      total,

      page: pageNumber,

      limit: limitNumber,

      totalPages:
        Math.ceil(
          total / limitNumber
        ),
    },
  };
};

// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudentById = async (
  id,
  tenantId,
  requester = null
) => {
  // ----------------------------------------------------------
  // Parent authorization
  // ----------------------------------------------------------

  if (
    requester &&
    requester.identity === "parent"
  ) {
    const allowedIds =
      await getStudentIdsForParent(
        requester.userId,
        tenantId
      );

    if (
      !allowedIds.includes(
        parseInt(id)
      )
    ) {
      throw new Error(
        "Student not found"
      );
    }
  }

  // ----------------------------------------------------------
  // Student authorization
  // ----------------------------------------------------------

  if (
    requester &&
    requester.identity === "student"
  ) {
    if (
      requester.studentId !==
      parseInt(id)
    ) {
      throw new Error(
        "Student not found"
      );
    }
  }

  const student =
    await prisma.student.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },

      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },

        section: {
          select: {
            id: true,
            name: true,
          },
        },

        parents: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                identity: true,
              },
            },
          },
        },

        customFieldValues: {
          include: {
            customField: true,
          },
        },
      },
    });

  if (!student) {
    throw new Error(
      "Student not found"
    );
  }

  return student;
};

// =====================================================
// UPDATE STUDENT
// =====================================================

const updateStudent = async (
  id,
  data,
  tenantId
) => {
  const existing =
    await prisma.student.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },
    });

  if (!existing) {
    throw new Error(
      "Student not found"
    );
  }

  const {
    father,
    mother,
    guardian,
    tenantId: _ignored,
    ...studentData
  } = data;

  // ----------------------------------------------------------
  // Validate class
  // ----------------------------------------------------------

  if (studentData.classId) {
    const validClass =
      await prisma.class.findFirst({
        where: {
          id: parseInt(
            studentData.classId
          ),

          tenantId,

          isDeleted: false,
        },

        select: {
          id: true,
        },
      });

    if (!validClass) {
      throw new Error(
        "Invalid class for this tenant"
      );
    }
  }

  // ----------------------------------------------------------
  // Validate section
  // ----------------------------------------------------------

  if (studentData.sectionId) {
    const validSection =
      await prisma.section.findFirst({
        where: {
          id: parseInt(
            studentData.sectionId
          ),

          tenantId,

          isDeleted: false,
        },

        select: {
          id: true,
        },
      });

    if (!validSection) {
      throw new Error(
        "Invalid section for this tenant"
      );
    }
  }

  const parentCredentials = [];

  // ==========================================================
  // TRANSACTION
  // ==========================================================

  await prisma.$transaction(
    async (tx) => {
      const {
        classId: _cid,
        sectionId: _sid,
        dateOfBirth: _dob,
        dateOfAdmission: _doa,
        dateOfJoin: _doj,
        ...restStudentData
      } = studentData;

      // --------------------------------------------------------
      // Update Student
      // --------------------------------------------------------

      await tx.student.update({
        where: {
          id: parseInt(id),
        },

        data: {
          ...restStudentData,

          ...(studentData.classId && {
            classId: parseInt(
              studentData.classId
            ),
          }),

          ...(studentData.sectionId && {
            sectionId: parseInt(
              studentData.sectionId
            ),
          }),

          ...(studentData.dateOfBirth && {
            dateOfBirth:
              new Date(
                studentData.dateOfBirth
              ),
          }),

          ...(studentData.dateOfAdmission && {
            dateOfAdmission:
              new Date(
                studentData.dateOfAdmission
              ),
          }),

          ...(studentData.dateOfJoin && {
            dateOfJoin:
              new Date(
                studentData.dateOfJoin
              ),
          }),
        },
      });

      // --------------------------------------------------------
      // Parent entries
      // --------------------------------------------------------

      const parentEntries = [
        ["father", father],
        ["mother", mother],
        ["guardian", guardian],
      ];

      // --------------------------------------------------------
      // Update / Create parents
      // --------------------------------------------------------

      for (
        const [
          relation,
          parentData,
        ] of parentEntries
      ) {
        if (!parentData) {
          continue;
        }

        const {
          tenantId: _t,
          ...safeParentData
        } = parentData;

        const existingParent =
          await tx.studentParent.findFirst({
            where: {
              studentId: parseInt(id),

              relation,
            },

            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          });

        let parentRecord;

        // ------------------------------------------------------
        // Existing parent
        // ------------------------------------------------------

        if (existingParent) {
          parentRecord =
            await tx.studentParent.update({
              where: {
                id: existingParent.id,
              },

              data: {
                ...safeParentData,

                tenantId,
              },
            });

          // ----------------------------------------------------
          // Parent does not have login yet
          // ----------------------------------------------------

          if (
            !existingParent.user
          ) {
            const rawPassword =
              await maybeCreateParentUser(
                tx,
                parentRecord,
                tenantId
              );

            if (rawPassword) {
              parentCredentials.push({
                relation,

                name:
                  parentRecord.name,

                email:
                  parentRecord.email,

                password:
                  rawPassword,
              });
            }
          }
        }

        // ------------------------------------------------------
        // New parent
        // ------------------------------------------------------

        else {
          parentRecord =
            await tx.studentParent.create({
              data: {
                ...safeParentData,

                relation,

                studentId:
                  parseInt(id),

                tenantId,
              },
            });

          const rawPassword =
            await maybeCreateParentUser(
              tx,
              parentRecord,
              tenantId
            );

          if (rawPassword) {
            parentCredentials.push({
              relation,

              name:
                parentRecord.name,

              email:
                parentRecord.email,

              password:
                rawPassword,
            });
          }
        }
      }
    },

    TRANSACTION_OPTIONS
  );

  // ----------------------------------------------------------
  // Get updated student
  // ----------------------------------------------------------

  const fullStudent =
    await getStudentById(
      id,
      tenantId
    );

  // ----------------------------------------------------------
  // Ensure the student has a login (idempotent, non-fatal)
  // ----------------------------------------------------------

  let studentCredentials = null;

  try {
    studentCredentials = await prisma.$transaction(
      (tx) => maybeCreateStudentUser(tx, fullStudent, tenantId),
      TRANSACTION_OPTIONS
    );
  } catch (loginErr) {
    if (loginErr && loginErr.code !== "P2002") {
      console.error(
        "Student login provisioning failed (non-fatal):",
        loginErr
      );
    }
  }

  return {
    ...fullStudent,

    parentCredentials,

    studentCredentials,
  };
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (
  id,
  tenantId
) => {
  const existing =
    await prisma.student.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },
    });

  if (!existing) {
    throw new Error(
      "Student not found"
    );
  }

  await prisma.$transaction([
    prisma.student.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true },
    }),
    prisma.user.updateMany({
      where: { studentId: parseInt(id), tenantId },
      data: { isDeleted: true },
    }),
  ]);

  return {
    message:
      "Student deleted successfully",
  };
};

// =====================================================
// EXPORTS
// =====================================================

// =====================================================
// RESET STUDENT PASSWORD (admin action)
// =====================================================

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = require("crypto").randomBytes(10);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out + "@1";
}

const resetStudentPassword = async (id, tenantId) => {
  const student = await prisma.student.findFirst({
    where: { id: parseInt(id), tenantId, isDeleted: false },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const user = await prisma.user.findUnique({
    where: { studentId: student.id },
  });

  // No login yet: create one with the standard initial password.
  if (!user) {
    const creds = await prisma.$transaction(
      (tx) => maybeCreateStudentUser(tx, student, tenantId),
      TRANSACTION_OPTIONS
    );
    if (!creds) {
      throw new Error("Could not create login for this student");
    }
    return creds;
  }

  const tempPassword = generateTempPassword();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(tempPassword, getBcryptCost()),
      mustChangePassword: true,
      isDeleted: false,
      tokenVersion: { increment: 1 },
    },
  });

  return { email: user.email, password: tempPassword };
};

module.exports = {
  resetStudentPassword,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentIdsForParent,
  getStudentIdsForTeacher,
};