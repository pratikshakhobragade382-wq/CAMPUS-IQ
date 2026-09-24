const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

const VALID_PAYMENT_MODES = [
  'cash',
  'cheque',
  'online',
  'card',
  'bank_transfer',
  'upi',
];

// =====================================================
// AUTHORIZATION
// =====================================================

const assertCanCollectFees = (actingUser) => {
  if (!actingUser || !actingUser.identity) {
    throw new HttpError(
      403,
      'Unable to identify the logged-in user',
      { code: 'FORBIDDEN' }
    );
  }

  // Admin can collect fees
  if (actingUser.identity === 'admin') {
    return;
  }

  // Accountant staff can collect fees
  if (
    actingUser.identity === 'staff' &&
    actingUser.staffRole === 'accountant'
  ) {
    return;
  }

  throw new HttpError(
    403,
    'Only admins or accountants can collect fees',
    { code: 'FORBIDDEN' }
  );
};

// =====================================================
// ADMIN AUTHORIZATION
// =====================================================

const assertIsAdmin = (actingUser) => {
  if (
    !actingUser ||
    actingUser.identity !== 'admin'
  ) {
    throw new HttpError(
      403,
      'Only admins can manage fee categories and structures',
      { code: 'FORBIDDEN' }
    );
  }
};

// =====================================================
// FIND STAFF FOR FEE COLLECTION
// =====================================================

const resolveCollectorStaffId = async (
  actingUser,
  tenantId
) => {
  // ---------------------------------------------------
  // 1. Logged-in user's staffId
  // ---------------------------------------------------

  if (actingUser?.staffId) {
    const staffId = parseInt(
      actingUser.staffId,
      10
    );

    if (!Number.isNaN(staffId)) {
      const linkedStaff =
        await prisma.staff.findFirst({
          where: {
            id: staffId,
            tenantId,
            isDeleted: false,
          },
          select: {
            id: true,
          },
        });

      if (linkedStaff) {
        return linkedStaff.id;
      }
    }
  }

  // ---------------------------------------------------
  // 2. Staff linked to authenticated user
  // ---------------------------------------------------

  if (actingUser?.userId) {
    const userId = parseInt(
      actingUser.userId,
      10
    );

    if (!Number.isNaN(userId)) {
      const user =
        await prisma.user.findFirst({
          where: {
            id: userId,
            tenantId,
            isDeleted: false,
          },
          select: {
            staffId: true,
          },
        });

      if (user?.staffId) {
        const linkedStaff =
          await prisma.staff.findFirst({
            where: {
              id: user.staffId,
              tenantId,
              isDeleted: false,
            },
            select: {
              id: true,
            },
          });

        if (linkedStaff) {
          return linkedStaff.id;
        }
      }
    }
  }

  // ---------------------------------------------------
  // 3. Admin fallback
  // Prefer accountant
  // ---------------------------------------------------

  if (actingUser?.identity === 'admin') {
    const accountant =
      await prisma.staff.findFirst({
        where: {
          tenantId,
          isDeleted: false,
          role: 'accountant',
        },
        select: {
          id: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

    if (accountant) {
      return accountant.id;
    }

    // -------------------------------------------------
    // 4. Any active staff member
    // -------------------------------------------------

    const anyStaff =
      await prisma.staff.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

    if (anyStaff) {
      return anyStaff.id;
    }
  }

  throw new HttpError(
    403,
    'No active staff record is available in this school to record the payment',
    { code: 'NO_COLLECTOR_STAFF' }
  );
};

// =====================================================
// FEE CATEGORY
// =====================================================

const createFeeCategory = async (
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(actingUser);

  const {
    name,
    description,
  } = data;

  if (!name) {
    throw new HttpError(
      400,
      'name is required',
      { code: 'VALIDATION_ERROR' }
    );
  }

  try {
    return await prisma.feeCategory.create({
      data: {
        tenantId,
        name,
        description:
          description || null,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(
        409,
        'A fee category with this name already exists',
        { code: 'DUPLICATE' }
      );
    }

    throw err;
  }
};

// =====================================================
// GET FEE CATEGORIES
// =====================================================

const getAllFeeCategories = async (
  tenantId
) => {
  return prisma.feeCategory.findMany({
    where: {
      tenantId,
      isActive: true,
    },

    orderBy: {
      name: 'asc',
    },
  });
};

// =====================================================
// UPDATE FEE CATEGORY
// =====================================================

const updateFeeCategory = async (
  id,
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(actingUser);

  const categoryId =
    parseInt(id, 10);

  const existing =
    await prisma.feeCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
    });

  if (!existing) {
    throw new HttpError(
      404,
      'Fee category not found',
      { code: 'NOT_FOUND' }
    );
  }

  return prisma.feeCategory.update({
    where: {
      id: categoryId,
    },

    data: {
      ...(data.name && {
        name: data.name,
      }),

      ...(data.description !== undefined && {
        description:
          data.description,
      }),

      ...(data.isActive !== undefined && {
        isActive:
          data.isActive,
      }),
    },
  });
};

// =====================================================
// DELETE FEE CATEGORY
// =====================================================

const deleteFeeCategory = async (
  id,
  tenantId,
  actingUser
) => {
  assertIsAdmin(actingUser);

  const categoryId =
    parseInt(id, 10);

  const existing =
    await prisma.feeCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
    });

  if (!existing) {
    throw new HttpError(
      404,
      'Fee category not found',
      { code: 'NOT_FOUND' }
    );
  }

  await prisma.feeCategory.update({
    where: {
      id: categoryId,
    },

    data: {
      isActive: false,
    },
  });

  return {
    message:
      'Fee category deactivated successfully',
  };
};

// =====================================================
// CREATE FEE STRUCTURE
// =====================================================

const createFeeStructure = async (
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(actingUser);

  const {
    academicYearId,
    classId,
    feeCategoryId,
    stream,
    studentCategory,
    amount,
    frequency,
    dueDay,
  } = data;

  if (
    !academicYearId ||
    !classId ||
    !feeCategoryId ||
    amount === undefined
  ) {
    throw new HttpError(
      400,
      'academicYearId, classId, feeCategoryId and amount are required',
      { code: 'VALIDATION_ERROR' }
    );
  }

  if (parseFloat(amount) <= 0) {
    throw new HttpError(
      400,
      'amount must be greater than 0',
      { code: 'VALIDATION_ERROR' }
    );
  }

  const [
    academicYear,
    cls,
    category,
  ] = await Promise.all([
    prisma.academicYear.findFirst({
      where: {
        id: parseInt(
          academicYearId,
          10
        ),
        tenantId,
      },
    }),

    prisma.class.findFirst({
      where: {
        id: parseInt(
          classId,
          10
        ),
        tenantId,
      },
    }),

    prisma.feeCategory.findFirst({
      where: {
        id: parseInt(
          feeCategoryId,
          10
        ),
        tenantId,
      },
    }),
  ]);

  if (!academicYear) {
    throw new HttpError(
      404,
      'Academic year not found',
      { code: 'NOT_FOUND' }
    );
  }

  if (!cls) {
    throw new HttpError(
      404,
      'Class not found',
      { code: 'NOT_FOUND' }
    );
  }

  if (!category) {
    throw new HttpError(
      404,
      'Fee category not found',
      { code: 'NOT_FOUND' }
    );
  }

  return prisma.feeStructure.create({
    data: {
      tenantId,

      academicYearId:
        parseInt(
          academicYearId,
          10
        ),

      classId:
        parseInt(
          classId,
          10
        ),

      feeCategoryId:
        parseInt(
          feeCategoryId,
          10
        ),

      stream:
        stream || null,

      studentCategory:
        studentCategory || null,

      amount:
        parseFloat(amount),

      frequency:
        frequency || 'annual',

      dueDay:
        dueDay
          ? parseInt(
              dueDay,
              10
            )
          : null,
    },
  });
};

// =====================================================
// GET FEE STRUCTURES
// =====================================================

const getFeeStructures = async (
  tenantId,
  filters = {}
) => {
  const {
    academicYearId,
    classId,
    feeCategoryId,
  } = filters;

  return prisma.feeStructure.findMany({
    where: {
      tenantId,
      isActive: true,

      ...(academicYearId && {
        academicYearId:
          parseInt(
            academicYearId,
            10
          ),
      }),

      ...(classId && {
        classId:
          parseInt(
            classId,
            10
          ),
      }),

      ...(feeCategoryId && {
        feeCategoryId:
          parseInt(
            feeCategoryId,
            10
          ),
      }),
    },

    include: {
      feeCategory: {
        select: {
          id: true,
          name: true,
        },
      },

      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
};

// =====================================================
// UPDATE FEE STRUCTURE
// =====================================================

const updateFeeStructure = async (
  id,
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(actingUser);

  const structureId =
    parseInt(id, 10);

  const existing =
    await prisma.feeStructure.findFirst({
      where: {
        id: structureId,
        tenantId,
      },
    });

  if (!existing) {
    throw new HttpError(
      404,
      'Fee structure not found',
      { code: 'NOT_FOUND' }
    );
  }

  if (
    data.amount !== undefined &&
    parseFloat(data.amount) <= 0
  ) {
    throw new HttpError(
      400,
      'amount must be greater than 0',
      { code: 'VALIDATION_ERROR' }
    );
  }

  return prisma.feeStructure.update({
    where: {
      id: structureId,
    },

    data: {
      ...(data.amount !== undefined && {
        amount:
          parseFloat(
            data.amount
          ),
      }),

      ...(data.frequency && {
        frequency:
          data.frequency,
      }),

      ...(data.dueDay !== undefined && {
        dueDay:
          data.dueDay
            ? parseInt(
                data.dueDay,
                10
              )
            : null,
      }),

      ...(data.isActive !== undefined && {
        isActive:
          data.isActive,
      }),
    },
  });
};

// =====================================================
// RECEIPT NUMBER
// =====================================================

const generateReceiptNo = async (
  tenantId,
  academicYearId
) => {
  const agg =
    await prisma.feeCollection.aggregate({
      where: {
        tenantId,
        academicYearId,
      },

      _max: {
        receiptNo: true,
      },
    });

  let next = 1;

  if (agg?._max?.receiptNo) {
    const parts =
      String(
        agg._max.receiptNo
      ).split('/');

    if (parts.length === 3) {
      const currentMax =
        parseInt(
          parts[2],
          10
        );

      if (
        !Number.isNaN(
          currentMax
        )
      ) {
        next =
          currentMax + 1;
      }
    }
  }

  // IMPORTANT:
  // Keep this template literal completely closed.
  return `RC/${academicYearId}/${String(next).padStart(6, '0')}`;
};

// =====================================================
// COLLECT FEE
// =====================================================

const collectFee = async (
  data,
  tenantId,
  actingUser
) => {
  // ---------------------------------------------------
  // Authorization
  // ---------------------------------------------------

  assertCanCollectFees(
    actingUser
  );

  const {
    studentId,
    feeStructureId,
    academicYearId,
    amount,
    discount,
    fine,
    paymentMode,
    paymentDate,
    chequeNo,
    bankName,
    transactionId,
    remark,
  } = data;

  // ---------------------------------------------------
  // Validation
  // ---------------------------------------------------

  if (
    !studentId ||
    !feeStructureId ||
    !academicYearId ||
    amount === undefined ||
    !paymentMode ||
    !paymentDate
  ) {
    throw new HttpError(
      400,
      'studentId, feeStructureId, academicYearId, amount, paymentMode and paymentDate are required',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  if (
    !VALID_PAYMENT_MODES.includes(
      paymentMode
    )
  ) {
    throw new HttpError(
      400,
      `paymentMode must be one of: ${VALID_PAYMENT_MODES.join(', ')}`,
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  if (parseFloat(amount) <= 0) {
    throw new HttpError(
      400,
      'amount must be greater than 0',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  // ---------------------------------------------------
  // Parse IDs
  // ---------------------------------------------------

  const parsedStudentId =
    parseInt(
      studentId,
      10
    );

  const parsedFeeStructureId =
    parseInt(
      feeStructureId,
      10
    );

  const parsedAcademicYearId =
    parseInt(
      academicYearId,
      10
    );

  if (
    Number.isNaN(
      parsedStudentId
    ) ||
    Number.isNaN(
      parsedFeeStructureId
    ) ||
    Number.isNaN(
      parsedAcademicYearId
    )
  ) {
    throw new HttpError(
      400,
      'Invalid student, fee structure or academic year',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  // ---------------------------------------------------
  // Find student + fee structure
  // ---------------------------------------------------

  const [
    student,
    feeStructure,
  ] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id:
          parsedStudentId,

        tenantId,

        isDeleted: false,
      },
    }),

    prisma.feeStructure.findFirst({
      where: {
        id:
          parsedFeeStructureId,

        tenantId,

        isActive: true,
      },
    }),
  ]);

  if (!student) {
    throw new HttpError(
      404,
      'Student not found',
      {
        code:
          'NOT_FOUND',
      }
    );
  }

  if (!feeStructure) {
    throw new HttpError(
      404,
      'Fee structure not found',
      {
        code:
          'NOT_FOUND',
      }
    );
  }

  // ---------------------------------------------------
  // Amount calculation
  // ---------------------------------------------------

  const discountAmt =
    discount !== undefined &&
    discount !== null &&
    discount !== ''
      ? parseFloat(discount)
      : 0;

  const fineAmt =
    fine !== undefined &&
    fine !== null &&
    fine !== ''
      ? parseFloat(fine)
      : 0;

  if (
    Number.isNaN(
      discountAmt
    ) ||
    discountAmt < 0
  ) {
    throw new HttpError(
      400,
      'discount cannot be negative',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  if (
    Number.isNaN(
      fineAmt
    ) ||
    fineAmt < 0
  ) {
    throw new HttpError(
      400,
      'fine cannot be negative',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  const parsedAmount =
    parseFloat(amount);

  const netAmount =
    parsedAmount -
    discountAmt +
    fineAmt;

  if (
    Number.isNaN(
      netAmount
    ) ||
    netAmount <= 0
  ) {
    throw new HttpError(
      400,
      'netAmount must be greater than 0 (check amount/discount/fine)',
      {
        code:
          'VALIDATION_ERROR',
      }
    );
  }

  // ---------------------------------------------------
  // Resolve Staff collector
  // ---------------------------------------------------

  const collectedById =
    await resolveCollectorStaffId(
      actingUser,
      tenantId
    );

  // ---------------------------------------------------
  // Create payment
  // ---------------------------------------------------

  let attempts = 0;

  while (attempts < 3) {
    attempts++;

    const receiptNo =
      await generateReceiptNo(
        tenantId,
        parsedAcademicYearId
      );

    try {
      const collection =
        await prisma.feeCollection.create({
          data: {
            tenantId,

            receiptNo,

            studentId:
              parsedStudentId,

            feeStructureId:
              parsedFeeStructureId,

            academicYearId:
              parsedAcademicYearId,

            amount:
              parsedAmount,

            discount:
              discountAmt,

            fine:
              fineAmt,

            netAmount,

            paymentMode,

            paymentDate:
              new Date(
                paymentDate
              ),

            chequeNo:
              chequeNo || null,

            bankName:
              bankName || null,

            transactionId:
              transactionId ||
              null,

            remark:
              remark || null,

            collectedById,
          },
        });

      // -------------------------------------------------
      // NOTIFICATIONS
      // -------------------------------------------------

      try {
        const {
          createNotification,
        } = require(
          '../notification/notification.service'
        );

        const receiptMessage =
          `Fee payment of ₹${Number(
            netAmount
          ).toFixed(2)} has been recorded for ${
            student.studentName
          }. Receipt No: ${receiptNo}.`;

        // -----------------------------------------------
        // Student notification
        // -----------------------------------------------

        const studentUser =
          await prisma.user.findFirst({
            where: {
              studentId:
                student.id,

              tenantId,

              identity:
                'student',

              isDeleted:
                false,
            },

            select: {
              id: true,
            },
          });

        if (studentUser) {
          await createNotification({
            tenantId,

            title:
              'Fee Payment Recorded',

            message:
              receiptMessage,

            type:
              'fee_payment',

            priority:
              'normal',

            audience:
              'individual',

            userId:
              studentUser.id,

            createdById:
              actingUser?.userId ||
              actingUser?.id ||
              null,
          });
        }

        // -----------------------------------------------
        // Parent notifications
        // -----------------------------------------------

        const parents =
          await prisma.studentParent.findMany({
            where: {
              studentId:
                student.id,

              tenantId,
            },

            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          });

        for (
          const parent of parents
        ) {
          if (
            !parent.user?.id
          ) {
            continue;
          }

          await createNotification({
            tenantId,

            title:
              'Fee Payment Recorded',

            message:
              receiptMessage,

            type:
              'fee_payment',

            priority:
              'normal',

            audience:
              'individual',

            userId:
              parent.user.id,

            createdById:
              actingUser?.userId ||
              actingUser?.id ||
              null,
          });
        }
      } catch (
        notificationError
      ) {
        console.error(
          'Fee notification creation failed (non-fatal):',
          notificationError
        );
      }

      return collection;
    } catch (err) {
      // -----------------------------------------------
      // Receipt collision
      // -----------------------------------------------

      if (
        err.code === 'P2002' &&
        attempts < 3
      ) {
        continue;
      }

      if (
        err.code === 'P2002'
      ) {
        throw new HttpError(
          409,
          'Could not generate a unique receipt number, please retry',
          {
            code:
              'CONFLICT',
          }
        );
      }

      throw err;
    }
  }

  throw new HttpError(
    409,
    'Could not generate a unique receipt number after multiple attempts',
    {
      code:
        'CONFLICT',
    }
  );
};

// =====================================================
// FIND STUDENT BY IDENTIFIER
// =====================================================

const findStudentByIdentifier = async (
  tenantId,
  identifier
) => {
  const value =
    String(
      identifier ?? ''
    ).trim();

  if (!value) {
    return null;
  }

  const numericId =
    Number(value);

  const isNumeric =
    Number.isInteger(
      numericId
    );

  return prisma.student.findFirst({
    where: {
      tenantId,

      isDeleted: false,

      ...(isNumeric
        ? {
            id:
              numericId,
          }
        : {
            admissionNo:
              value,
          }),
    },

    select: {
      id: true,
      studentName: true,
      admissionNo: true,
      classId: true,
    },
  });
};

// =====================================================
// STUDENT FEE STATUS
// =====================================================

const getStudentFeeStatus = async (
  tenantId,
  studentId,
  academicYearId
) => {
  const student =
    await findStudentByIdentifier(
      tenantId,
      studentId
    );

  if (!student) {
    throw new HttpError(
      404,
      'Student not found',
      {
        code:
          'NOT_FOUND',
      }
    );
  }

  const structures =
    await prisma.feeStructure.findMany({
      where: {
        tenantId,

        classId:
          student.classId,

        isActive: true,

        ...(academicYearId && {
          academicYearId:
            parseInt(
              academicYearId,
              10
            ),
        }),
      },

      include: {
        feeCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  const breakdown =
    await Promise.all(
      structures.map(
        async (
          structure
        ) => {
          const collections =
            await prisma.feeCollection.findMany({
              where: {
                tenantId,

                studentId:
                  student.id,

                feeStructureId:
                  structure.id,
              },
            });

          const paid =
            collections.reduce(
              (
                sum,
                collection
              ) =>
                sum +
                parseFloat(
                  collection.netAmount
                ),
              0
            );

          const owed =
            parseFloat(
              structure.amount
            );

          return {
            feeCategory:
              structure
                .feeCategory
                .name,

            feeStructureId:
              structure.id,

            owed,

            paid,

            balance:
              Math.max(
                owed -
                  paid,
                0
              ),

            status:
              paid >= owed
                ? 'paid'
                : paid > 0
                  ? 'partial'
                  : 'unpaid',
          };
        }
      )
    );

  const totals =
    breakdown.reduce(
      (
        acc,
        item
      ) => ({
        owed:
          acc.owed +
          item.owed,

        paid:
          acc.paid +
          item.paid,

        balance:
          acc.balance +
          item.balance,
      }),
      {
        owed: 0,
        paid: 0,
        balance: 0,
      }
    );

  return {
    student: {
      id:
        student.id,

      name:
        student.studentName,

      admissionNo:
        student.admissionNo,
    },

    breakdown,

    totals,
  };
};

// =====================================================
// STUDENT PAYMENT HISTORY
// =====================================================

const getStudentPaymentHistory = async (
  tenantId,
  studentId
) => {
  const student =
    await findStudentByIdentifier(
      tenantId,
      studentId
    );

  if (!student) {
    throw new HttpError(
      404,
      'Student not found',
      {
        code:
          'NOT_FOUND',
      }
    );
  }

  return prisma.feeCollection.findMany({
    where: {
      tenantId,

      studentId:
        student.id,
    },

    include: {
      feeStructure: {
        include: {
          feeCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      collectedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      paymentDate:
        'desc',
    },
  });
};

// =====================================================
// COLLECTION REPORT
// =====================================================

const getCollectionsByDateRange = async (
  tenantId,
  fromDate,
  toDate
) => {
  const from = fromDate
    ? new Date(fromDate)
    : new Date(
        new Date().setHours(
          0,
          0,
          0,
          0
        )
      );

  const to = toDate
    ? new Date(toDate)
    : new Date();

  const collections =
    await prisma.feeCollection.findMany({
      where: {
        tenantId,

        paymentDate: {
          gte: from,
          lte: to,
        },
      },

      include: {
        student: {
          select: {
            id: true,
            studentName: true,
            admissionNo: true,
          },
        },

        feeStructure: {
          include: {
            feeCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        collectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        paymentDate:
          'desc',
      },
    });

  const totalCollected =
    collections.reduce(
      (
        sum,
        collection
      ) =>
        sum +
        parseFloat(
          collection.netAmount
        ),
      0
    );

  return {
    fromDate: from,

    toDate: to,

    totalCollected,

    count:
      collections.length,

    collections,
  };
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createFeeCategory,
  getAllFeeCategories,
  updateFeeCategory,
  deleteFeeCategory,

  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,

  collectFee,

  getStudentFeeStatus,
  getStudentPaymentHistory,
  getCollectionsByDateRange,
};