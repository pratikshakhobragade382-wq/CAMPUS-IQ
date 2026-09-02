const bcrypt = require("bcrypt");
const prisma = require("../../prisma/prismaClient");

function getBcryptCost() {
  const raw = Number.parseInt(
    process.env.BCRYPT_COST || "12",
    10
  );

  const cost = Number.isFinite(raw) ? raw : 12;

  return Math.min(
    14,
    Math.max(10, cost)
  );
}

// =====================================================
// CREATE PARENT USER
// =====================================================

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

  if (existingUser) {
    return null;
  }

  const rawPassword =
    digits.slice(-6);

  const hashedPassword =
    await bcrypt.hash(
      rawPassword,
      getBcryptCost()
    );

  await tx.user.create({
    data: {
      name: studentParent.name,
      email: studentParent.email,
      password: hashedPassword,
      tenantId,
      identity: "parent",
      parentId: studentParent.id,
    },
  });

  return rawPassword;
}

// =====================================================
// GET STUDENT IDS FOR PARENT
// =====================================================

async function getStudentIdsForParent(
  parentUserParentId,
  tenantId
) {
  if (!parentUserParentId) {
    return [];
  }

  const link =
    await prisma.studentParent.findFirst({
      where: {
        id: parentUserParentId,
        tenantId,
      },
      select: {
        studentId: true,
      },
    });

  return link
    ? [link.studentId]
    : [];
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

  // ===================================================
  // CHECK DUPLICATE ADMISSION NUMBER
  // ===================================================

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

  // ===================================================
  // VALIDATE CLASS
  // ===================================================

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

  // ===================================================
  // VALIDATE SECTION
  // ===================================================

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

  // ===================================================
  // CREATE STUDENT + PARENTS
  // ===================================================

  const student =
    await prisma.$transaction(
      async (tx) => {
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

              dateOfBirth: dateOfBirth
                ? new Date(dateOfBirth)
                : null,

              dateOfAdmission:
                dateOfAdmission
                  ? new Date(
                      dateOfAdmission
                    )
                  : null,

              dateOfJoin: dateOfJoin
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

        // =================================================
        // PREPARE PARENTS
        // =================================================

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

        // =================================================
        // CREATE PARENTS
        // =================================================

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

        return created;
      }
    );

  // ===================================================
  // GET COMPLETE STUDENT
  // ===================================================

  const fullStudent =
    await getStudentById(
      student.id,
      tenantId
    );

  // ===================================================
  // IMPORTANT
  // ===================================================
  //
  // DO NOT CREATE A NOTIFICATION HERE.
  //
  // Admin adding a student must NOT generate a
  // notification in the Teacher Portal.
  //
  // Teacher notifications should come from actions
  // performed by the teacher / teacher portal.
  //
  // ===================================================

  return {
    ...fullStudent,
    parentCredentials,
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

  // ===================================================
  // PARENT ACCESS
  // ===================================================

  if (
    requester &&
    requester.identity === "parent"
  ) {
    const allowedIds =
      await getStudentIdsForParent(
        requester.parentId,
        tenantId
      );

    where.id = {
      in: allowedIds,
    };
  }

  // ===================================================
  // GET STUDENTS + TOTAL
  // ===================================================

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
      totalPages: Math.ceil(
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
  // ===================================================
  // PARENT ACCESS CHECK
  // ===================================================

  if (
    requester &&
    requester.identity === "parent"
  ) {
    const allowedIds =
      await getStudentIdsForParent(
        requester.parentId,
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

  // ===================================================
  // GET STUDENT
  // ===================================================

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
  // ===================================================
  // CHECK EXISTING STUDENT
  // ===================================================

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

  // ===================================================
  // REMOVE TENANT ID FROM REQUEST DATA
  // ===================================================

  const {
    father,
    mother,
    guardian,
    tenantId: _ignored,
    ...studentData
  } = data;

  // ===================================================
  // VALIDATE CLASS
  // ===================================================

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

  // ===================================================
  // VALIDATE SECTION
  // ===================================================

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

  // ===================================================
  // UPDATE STUDENT
  // ===================================================

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
            dateOfBirth: new Date(
              studentData.dateOfBirth
            ),
          }),

          ...(studentData.dateOfAdmission && {
            dateOfAdmission: new Date(
              studentData.dateOfAdmission
            ),
          }),

          ...(studentData.dateOfJoin && {
            dateOfJoin: new Date(
              studentData.dateOfJoin
            ),
          }),
        },
      });

      // =================================================
      // UPDATE PARENTS
      // =================================================

      const parentEntries = [
        ["father", father],
        ["mother", mother],
        ["guardian", guardian],
      ];

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

        // ===============================================
        // FIND EXISTING PARENT
        // ===============================================

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

        // ===============================================
        // UPDATE EXISTING PARENT
        // ===============================================

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

          // =============================================
          // CREATE LOGIN IF MISSING
          // =============================================

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

        // ===============================================
        // CREATE NEW PARENT
        // ===============================================

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
    }
  );

  // ===================================================
  // GET UPDATED STUDENT
  // ===================================================

  const fullStudent =
    await getStudentById(
      id,
      tenantId
    );

  return {
    ...fullStudent,
    parentCredentials,
  };
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (
  id,
  tenantId
) => {
  // ===================================================
  // CHECK STUDENT
  // ===================================================

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

  // ===================================================
  // SOFT DELETE
  // ===================================================

  await prisma.student.update({
    where: {
      id: parseInt(id),
    },

    data: {
      isDeleted: true,
    },
  });

  return {
    message:
      "Student deleted successfully",
  };
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};