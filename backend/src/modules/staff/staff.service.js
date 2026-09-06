const bcrypt = require("bcrypt");

const prisma = require("../../prisma/prismaClient");

// =====================================================
// BCRYPT COST
// =====================================================

function getBcryptCost() {
  const raw =
    Number.parseInt(
      process.env.BCRYPT_COST || "12",
      10
    );

  const cost =
    Number.isFinite(raw)
      ? raw
      : 12;

  return Math.min(
    14,
    Math.max(10, cost)
  );
}

// =====================================================
// GET STAFF BY ID
// =====================================================

const getStaffById = async (
  id,
  tenantId
) => {
  const staff =
    await prisma.staff.findFirst({
      where: {
        id: parseInt(id),
        tenantId,
        isDeleted: false,
      },

      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },

        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },

        address: true,

        otherDetails: true,

        spouse: true,

        children: true,

        user: {
          select: {
            id: true,
            email: true,
            identity: true,
          },
        },
      },
    });

  if (!staff) {
    throw new Error(
      "Staff not found"
    );
  }

  return staff;
};

// =====================================================
// CREATE STAFF
// =====================================================
//
// IMPORTANT:
// Automatic "New Teacher Added" / "New Staff Added"
// notification has intentionally been removed.
//
// =====================================================

const createStaff = async (
  data,
  tenantId
) => {
  const {
    address,
    otherDetails,
    spouse,
    children,
    subjectIds,
    password,
    identity,

    ...staffFields
  } = data;

  // ---------------------------------------------------
  // DUPLICATE EMPLOYEE ID
  // ---------------------------------------------------

  const dupById =
    await prisma.staff.findFirst({
      where: {
        employeeId:
          staffFields.employeeId,

        tenantId,

        isDeleted: false,
      },
    });

  if (dupById) {
    throw new Error(
      "Employee ID already exists"
    );
  }

  // ---------------------------------------------------
  // DUPLICATE EMAIL
  // ---------------------------------------------------

  const dupByEmail =
    await prisma.staff.findFirst({
      where: {
        email:
          staffFields.email,

        tenantId,

        isDeleted: false,
      },
    });

  if (dupByEmail) {
    throw new Error(
      "Email already exists for another staff member"
    );
  }

  // ---------------------------------------------------
  // DEPARTMENT
  // ---------------------------------------------------

  if (staffFields.departmentId) {
    const dept =
      await prisma.department.findFirst({
        where: {
          id: parseInt(
            staffFields.departmentId
          ),

          tenantId,
        },

        select: {
          id: true,
        },
      });

    if (!dept) {
      throw new Error(
        "Invalid department for this tenant"
      );
    }
  }

  // ---------------------------------------------------
  // CREATE LOGIN
  // ---------------------------------------------------

  let hashedPassword = null;

  if (password) {
    const dupUser =
      await prisma.user.findUnique({
        where: {
          email_tenantId: {
            email:
              staffFields.email,

            tenantId,
          },
        },
      });

    if (dupUser) {
      throw new Error(
        "A login already exists for this email"
      );
    }

    hashedPassword =
      await bcrypt.hash(
        password,
        getBcryptCost()
      );
  }

  // ---------------------------------------------------
  // TRANSACTION
  // ---------------------------------------------------

  const staff =
    await prisma.$transaction(
      async (tx) => {
        const created =
          await tx.staff.create({
            data: {
              ...staffFields,

              dateOfJoining:
                staffFields.dateOfJoining
                  ? new Date(
                      staffFields.dateOfJoining
                    )
                  : null,

              dateOfBirth:
                staffFields.dateOfBirth
                  ? new Date(
                      staffFields.dateOfBirth
                    )
                  : null,

              salary:
                staffFields.salary
                  ? parseFloat(
                      staffFields.salary
                    )
                  : null,

              departmentId:
                staffFields.departmentId
                  ? parseInt(
                      staffFields.departmentId
                    )
                  : null,

              busUser:
                staffFields.busUser ||
                false,

              noticePeriod:
                staffFields.noticePeriod ||
                false,

              isReviewer:
                staffFields.isReviewer ||
                false,

              tenantId,
            },
          });

        // ---------------------------------------------
        // ADDRESS
        // ---------------------------------------------

        if (address) {
          await tx.staffAddress.create({
            data: {
              ...address,

              staffId:
                created.id,

              tenantId,
            },
          });
        }

        // ---------------------------------------------
        // OTHER DETAILS
        // ---------------------------------------------

        if (otherDetails) {
          await tx.staffOtherDetails.create({
            data: {
              ...otherDetails,

              staffId:
                created.id,

              tenantId,

              dateOfAppointment:
                otherDetails.dateOfAppointment
                  ? new Date(
                      otherDetails.dateOfAppointment
                    )
                  : null,

              probationUpto:
                otherDetails.probationUpto
                  ? new Date(
                      otherDetails.probationUpto
                    )
                  : null,

              dateOfConfirmation:
                otherDetails.dateOfConfirmation
                  ? new Date(
                      otherDetails.dateOfConfirmation
                    )
                  : null,

              fromDate:
                otherDetails.fromDate
                  ? new Date(
                      otherDetails.fromDate
                    )
                  : null,

              passportIssueDate:
                otherDetails.passportIssueDate
                  ? new Date(
                      otherDetails.passportIssueDate
                    )
                  : null,

              passportExpireDate:
                otherDetails.passportExpireDate
                  ? new Date(
                      otherDetails.passportExpireDate
                    )
                  : null,

              visaIssueDate:
                otherDetails.visaIssueDate
                  ? new Date(
                      otherDetails.visaIssueDate
                    )
                  : null,

              visaExpiryDate:
                otherDetails.visaExpiryDate
                  ? new Date(
                      otherDetails.visaExpiryDate
                    )
                  : null,
            },
          });
        }

        // ---------------------------------------------
        // SPOUSE
        // ---------------------------------------------

        if (spouse) {
          await tx.staffSpouse.create({
            data: {
              ...spouse,

              staffId:
                created.id,

              tenantId,

              dateOfBirth:
                spouse.dateOfBirth
                  ? new Date(
                      spouse.dateOfBirth
                    )
                  : null,

              marriageDate:
                spouse.marriageDate
                  ? new Date(
                      spouse.marriageDate
                    )
                  : null,
            },
          });
        }

        // ---------------------------------------------
        // CHILDREN
        // ---------------------------------------------

        if (
          children &&
          children.length > 0
        ) {
          await tx.staffChild.createMany({
            data: children.map(
              (child) => ({
                ...child,

                staffId:
                  created.id,

                tenantId,

                dateOfBirth:
                  child.dateOfBirth
                    ? new Date(
                        child.dateOfBirth
                      )
                    : null,
              })
            ),
          });
        }

        // ---------------------------------------------
        // USER LOGIN
        // ---------------------------------------------

        if (hashedPassword) {
          await tx.user.create({
            data: {
              name:
                staffFields.name,

              email:
                staffFields.email,

              password:
                hashedPassword,

              tenantId,

              identity:
                identity ||
                "staff",

              staffId:
                created.id,
            },
          });
        }

        return created;
      }
    );

  // ---------------------------------------------------
  // RETURN FULL STAFF
  // ---------------------------------------------------

  const fullStaff =
    await getStaffById(
      staff.id,
      tenantId
    );

  return fullStaff;
};

// =====================================================
// GET ALL STAFF
// =====================================================

const getAllStaff = async (
  tenantId,
  query = {}
) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    role,
    departmentId,
    gender,
  } = query;

  const skip =
    (parseInt(page) - 1) *
    parseInt(limit);

  const where = {
    tenantId,

    isDeleted: false,

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          employeeId: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),

    ...(role && {
      role,
    }),

    ...(departmentId && {
      departmentId:
        parseInt(departmentId),
    }),

    ...(gender && {
      gender,
    }),
  };

  const [
    staffList,
    total,
  ] = await Promise.all([
    prisma.staff.findMany({
      where,

      skip,

      take:
        parseInt(limit),

      orderBy: {
        createdAt: "desc",
      },

      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },

        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },

        address: true,

        otherDetails: true,

        spouse: true,

        children: true,

        user: {
          select: {
            id: true,
            email: true,
            identity: true,
          },
        },
      },
    }),

    prisma.staff.count({
      where,
    }),
  ]);

  return {
    staff: staffList,

    pagination: {
      total,

      page:
        parseInt(page),

      limit:
        parseInt(limit),

      totalPages:
        Math.ceil(
          total /
            parseInt(limit)
        ),
    },
  };
};

// =====================================================
// UPDATE STAFF
// =====================================================

const updateStaff = async (
  id,
  data,
  tenantId
) => {
  const existing =
    await prisma.staff.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },
    });

  if (!existing) {
    throw new Error(
      "Staff not found"
    );
  }

  const {
    tenantId: _ignored,
    address,
    otherDetails,
    spouse,
    children,
    subjectIds,

    ...staffData
  } = data;

  // ---------------------------------------------------
  // EMAIL
  // ---------------------------------------------------

  if (
    staffData.email &&
    staffData.email !==
      existing.email
  ) {
    const dup =
      await prisma.staff.findFirst({
        where: {
          email:
            staffData.email,

          tenantId,

          isDeleted: false,

          NOT: {
            id: parseInt(id),
          },
        },
      });

    if (dup) {
      throw new Error(
        "Email already exists for another staff member"
      );
    }
  }

  // ---------------------------------------------------
  // EMPLOYEE ID
  // ---------------------------------------------------

  if (
    staffData.employeeId &&
    staffData.employeeId !==
      existing.employeeId
  ) {
    const dup =
      await prisma.staff.findFirst({
        where: {
          employeeId:
            staffData.employeeId,

          tenantId,

          isDeleted: false,

          NOT: {
            id: parseInt(id),
          },
        },
      });

    if (dup) {
      throw new Error(
        "Employee ID already exists"
      );
    }
  }

  // ---------------------------------------------------
  // TRANSACTION
  // ---------------------------------------------------

  await prisma.$transaction(
    async (tx) => {
      await tx.staff.update({
        where: {
          id: parseInt(id),
        },

        data: {
          ...staffData,

          ...(staffData.departmentId !==
            undefined && {
            departmentId:
              staffData.departmentId
                ? parseInt(
                    staffData.departmentId
                  )
                : null,
          }),

          ...(staffData.dateOfJoining && {
            dateOfJoining:
              new Date(
                staffData.dateOfJoining
              ),
          }),

          ...(staffData.dateOfBirth && {
            dateOfBirth:
              new Date(
                staffData.dateOfBirth
              ),
          }),

          ...(staffData.salary !==
            undefined && {
            salary:
              staffData.salary
                ? parseFloat(
                    staffData.salary
                  )
                : null,
          }),
        },
      });

      // ---------------------------------------------
      // ADDRESS
      // ---------------------------------------------

      if (address) {
        await tx.staffAddress.upsert({
          where: {
            staffId:
              parseInt(id),
          },

          update: {
            ...address,
          },

          create: {
            ...address,

            staffId:
              parseInt(id),

            tenantId,
          },
        });
      }

      // ---------------------------------------------
      // OTHER DETAILS
      // ---------------------------------------------

      if (otherDetails) {
        const details = {
          ...otherDetails,

          dateOfAppointment:
            otherDetails.dateOfAppointment
              ? new Date(
                  otherDetails.dateOfAppointment
                )
              : null,

          probationUpto:
            otherDetails.probationUpto
              ? new Date(
                  otherDetails.probationUpto
                )
              : null,

          dateOfConfirmation:
            otherDetails.dateOfConfirmation
              ? new Date(
                  otherDetails.dateOfConfirmation
                )
              : null,

          fromDate:
            otherDetails.fromDate
              ? new Date(
                  otherDetails.fromDate
                )
              : null,

          passportIssueDate:
            otherDetails.passportIssueDate
              ? new Date(
                  otherDetails.passportIssueDate
                )
              : null,

          passportExpireDate:
            otherDetails.passportExpireDate
              ? new Date(
                  otherDetails.passportExpireDate
                )
              : null,

          visaIssueDate:
            otherDetails.visaIssueDate
              ? new Date(
                  otherDetails.visaIssueDate
                )
              : null,

          visaExpiryDate:
            otherDetails.visaExpiryDate
              ? new Date(
                  otherDetails.visaExpiryDate
                )
              : null,
        };

        await tx.staffOtherDetails.upsert({
          where: {
            staffId:
              parseInt(id),
          },

          update:
            details,

          create: {
            ...details,

            staffId:
              parseInt(id),

            tenantId,
          },
        });
      }

      // ---------------------------------------------
      // SPOUSE
      // ---------------------------------------------

      if (spouse) {
        const spouseData = {
          ...spouse,

          dateOfBirth:
            spouse.dateOfBirth
              ? new Date(
                  spouse.dateOfBirth
                )
              : null,

          marriageDate:
            spouse.marriageDate
              ? new Date(
                  spouse.marriageDate
                )
              : null,
        };

        await tx.staffSpouse.upsert({
          where: {
            staffId:
              parseInt(id),
          },

          update:
            spouseData,

          create: {
            ...spouseData,

            staffId:
              parseInt(id),

            tenantId,
          },
        });
      }

      // ---------------------------------------------
      // CHILDREN
      // ---------------------------------------------

      if (
        children !== undefined
      ) {
        await tx.staffChild.deleteMany({
          where: {
            staffId:
              parseInt(id),
          },
        });

        if (
          children.length > 0
        ) {
          await tx.staffChild.createMany({
            data:
              children.map(
                (child) => ({
                  ...child,

                  staffId:
                    parseInt(id),

                  tenantId,

                  dateOfBirth:
                    child.dateOfBirth
                      ? new Date(
                          child.dateOfBirth
                        )
                      : null,
                })
              ),
          });
        }
      }
    }
  );

  return getStaffById(
    id,
    tenantId
  );
};

// =====================================================
// DELETE STAFF
// =====================================================

const deleteStaff = async (
  id,
  tenantId
) => {
  const existing =
    await prisma.staff.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },
    });

  if (!existing) {
    throw new Error(
      "Staff not found"
    );
  }

  await prisma.staff.update({
    where: {
      id: parseInt(id),
    },

    data: {
      isDeleted: true,
    },
  });

  return {
    message:
      "Staff deleted successfully",
  };
};

// =====================================================
// ASSIGN SUBJECTS
// =====================================================

const assignSubjects = async (
  id,
  subjectIds,
  tenantId
) => {
  const staff =
    await prisma.staff.findFirst({
      where: {
        id: parseInt(id),

        tenantId,

        isDeleted: false,
      },
    });

  if (!staff) {
    throw new Error(
      "Staff not found"
    );
  }

  const valid =
    await prisma.subject.findMany({
      where: {
        id: {
          in:
            subjectIds.map(Number),
        },

        tenantId,

        isDeleted: false,
      },

      select: {
        id: true,
      },
    });

  if (
    valid.length !==
    subjectIds.length
  ) {
    throw new Error(
      "One or more subject IDs are invalid or do not belong to your school"
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.staffSubject.deleteMany({
        where: {
          staffId:
            parseInt(id),
        },
      });

      if (
        subjectIds.length > 0
      ) {
        await tx.staffSubject.createMany({
          data:
            subjectIds.map(
              (subjectId) => ({
                staffId:
                  parseInt(id),

                subjectId:
                  Number(subjectId),

                tenantId,
              })
            ),

          skipDuplicates: true,
        });
      }
    }
  );

  return getStaffById(
    id,
    tenantId
  );
};

// =====================================================
// REMOVE SUBJECT
// =====================================================

const removeSubject = async (
  staffId,
  subjectId,
  tenantId
) => {
  const staff =
    await prisma.staff.findFirst({
      where: {
        id:
          parseInt(staffId),

        tenantId,

        isDeleted: false,
      },
    });

  if (!staff) {
    throw new Error(
      "Staff not found"
    );
  }

  const assignment =
    await prisma.staffSubject.findFirst({
      where: {
        staffId:
          parseInt(staffId),

        subjectId:
          parseInt(subjectId),

        tenantId,
      },
    });

  if (!assignment) {
    throw new Error(
      "Subject assignment not found"
    );
  }

  await prisma.staffSubject.delete({
    where: {
      id: assignment.id,
    },
  });

  return {
    message:
      "Subject removed successfully",
  };
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createStaff,

  getAllStaff,

  getStaffById,

  updateStaff,

  deleteStaff,

  assignSubjects,

  removeSubject,
};