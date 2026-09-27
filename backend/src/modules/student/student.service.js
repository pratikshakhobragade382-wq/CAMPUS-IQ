const bcrypt = require("bcrypt");
const prisma = require("../../prisma/prismaClient");

const {
  createNotification,
} = require("../notification/notification.service");

// =====================================================
// TRANSACTION OPTIONS
// =====================================================

const TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 20000,
};

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const result = String(value).trim();

  return result === "" ? null : result;
};

const parseIntegerOrNull = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = parseInt(value, 10);

  return Number.isNaN(parsed) ? null : parsed;
};

const parseFloatOrNull = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = parseFloat(value);

  return Number.isNaN(parsed) ? null : parsed;
};

const parseDateOrNull = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const parseBoolean = (value) => {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
};

// =====================================================
// CREATE PARENT USER
// =====================================================

const maybeCreateParentUser = async (
  tx,
  {
    email,
    mobile,
    tenantId,
    studentParentId,
    name,
  }
) => {
  const normalizedEmail = cleanString(email)?.toLowerCase();
  const normalizedMobile = cleanString(mobile);

  // ===================================================
  // PARENT LOGIN REQUIRES EMAIL
  //
  // Mobile is OPTIONAL.
  // ===================================================

  if (!normalizedEmail) {
    return null;
  }

  // ===================================================
  // FIND EXISTING USER
  // ===================================================

  const existingUser = await tx.user.findFirst({
    where: {
      email: normalizedEmail,
      tenantId: Number(tenantId),
    },
  });

  // ===================================================
  // EXISTING USER
  // ===================================================

  if (existingUser) {
    // Never convert another type of account into a parent.
    if (existingUser.identity !== "parent") {
      return null;
    }

    // Link the existing parent account to this parent record.
    await tx.user.update({
      where: {
        id: existingUser.id,
      },

      data: {
        parentId: studentParentId,
      },
    });

    /*
     * The old password cannot be displayed because only
     * the bcrypt hash is stored in the database.
     */
    return {
      email: normalizedEmail,
      password: null,
      userId: existingUser.id,
      name:
        cleanString(name) ||
        normalizedEmail.split("@")[0],
      existing: true,
    };
  }

  // ===================================================
  // GENERATE PASSWORD
  // ===================================================

  /*
   * If mobile is available:
   *   use the last 6 digits.
   *
   * If mobile is not available:
   *   use StudentParent ID + @123.
   */

  const digitsOnly = normalizedMobile
    ? normalizedMobile.replace(/\D/g, "")
    : "";

  const rawPassword =
    digitsOnly.length >= 6
      ? digitsOnly.slice(-6)
      : `${studentParentId}@123`;

  // ===================================================
  // HASH PASSWORD
  // ===================================================

  const hashedPassword = await bcrypt.hash(
    rawPassword,
    10
  );

  // ===================================================
  // CREATE PARENT USER
  // ===================================================

  const user = await tx.user.create({
    data: {
      name:
        cleanString(name) ||
        normalizedEmail.split("@")[0],

      email: normalizedEmail,

      password: hashedPassword,

      tenantId: Number(tenantId),

      identity: "parent",

      parentId: studentParentId,

      mustChangePassword: true,
    },
  });

  // ===================================================
  // RETURN PLAIN-TEXT CREDENTIALS
  //
  // These are returned only immediately after creation
  // so StudentForm.jsx can display them.
  // ===================================================

  return {
    email: normalizedEmail,

    password: rawPassword,

    userId: user.id,

    name:
      cleanString(name) ||
      normalizedEmail.split("@")[0],

    existing: false,
  };
};

// =====================================================
// CREATE STUDENT USER
// =====================================================

const maybeCreateStudentUser = async (
  tx,
  student
) => {
  if (!student?.id || !student?.admissionNo) {
    return null;
  }

  // ===================================================
  // CHECK EXISTING STUDENT USER
  // ===================================================

  const existingStudentUser =
    await tx.user.findUnique({
      where: {
        studentId: student.id,
      },
    });

  if (existingStudentUser) {
    return {
      email: existingStudentUser.email,
      password: null,
      userId: existingStudentUser.id,
    };
  }

  // ===================================================
  // GET TENANT
  // ===================================================

  const tenant =
    await tx.tenant.findUnique({
      where: {
        id: student.tenantId,
      },

      select: {
        subdomain: true,
      },
    });

  const subdomain =
    tenant?.subdomain ||
    `tenant${student.tenantId}`;

  // ===================================================
  // STUDENT LOGIN EMAIL
  // ===================================================

  const loginEmail =
    `${student.admissionNo}@${subdomain}.student`
      .toLowerCase();

  // ===================================================
  // CHECK EMAIL
  // ===================================================

  const existingEmailUser =
    await tx.user.findFirst({
      where: {
        email: loginEmail,
        tenantId: student.tenantId,
      },
    });

  if (existingEmailUser) {
    return {
      email: existingEmailUser.email,
      password: null,
      userId: existingEmailUser.id,
    };
  }

  // ===================================================
  // DEFAULT PASSWORD
  //
  // DOB -> DDMMYYYY
  // Otherwise -> admissionNo@123
  // ===================================================

  let rawPassword =
    `${student.admissionNo}@123`;

  if (student.dateOfBirth) {
    const dob = new Date(
      student.dateOfBirth
    );

    if (!Number.isNaN(dob.getTime())) {
      const day = String(
        dob.getDate()
      ).padStart(2, "0");

      const month = String(
        dob.getMonth() + 1
      ).padStart(2, "0");

      const year =
        dob.getFullYear();

      rawPassword =
        `${day}${month}${year}`;
    }
  }

  const hashedPassword =
    await bcrypt.hash(
      rawPassword,
      10
    );

  // ===================================================
  // CREATE STUDENT USER
  // ===================================================

  const user =
    await tx.user.create({
      data: {
        name:
          cleanString(
            student.studentName
          ) || "Student",

        email: loginEmail,

        password:
          hashedPassword,

        tenantId:
          student.tenantId,

        identity: "student",

        studentId:
          student.id,

        mustChangePassword:
          true,
      },
    });

  return {
    email: user.email,
    password: rawPassword,
    userId: user.id,
  };
};

// =====================================================
// GET STUDENT IDS FOR PARENT
// =====================================================

const getStudentIdsForParent = async (
  userId,
  tenantId
) => {
  if (!userId || !tenantId) {
    return [];
  }

  // ===================================================
  // 1. DIRECT STUDENT PARENT LINK
  // ===================================================

  const studentParentsByUserId =
    await prisma.studentParent.findMany({
      where: {
        user: {
          id: userId,
        },

        tenantId,
      },

      select: {
        studentId: true,
      },
    });

  if (
    studentParentsByUserId.length > 0
  ) {
    const ids =
      studentParentsByUserId
        .map(
          (item) => item.studentId
        )
        .filter(Boolean);

    if (ids.length > 0) {
      return ids;
    }
  }

  // ===================================================
  // 2. USER RECORD
  // ===================================================

  const user =
    await prisma.user.findFirst({
      where: {
        id: userId,

        tenantId,

        identity: "parent",

        isDeleted: false,
      },

      select: {
        id: true,
        parentId: true,
        studentId: true,
        email: true,
        name: true,
      },
    });

  if (!user) {
    return [];
  }

  // ===================================================
  // DIRECT STUDENT ID
  // ===================================================

  if (user.studentId) {
    return [user.studentId];
  }

  // ===================================================
  // PARENT ID
  // ===================================================

  if (user.parentId) {
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

    if (parent?.studentId) {
      return [parent.studentId];
    }
  }

  // ===================================================
  // MATCH BY EMAIL
  // ===================================================

  if (user.email) {
    const matchByEmail =
      await prisma.studentParent.findFirst({
        where: {
          email: user.email,

          tenantId,
        },

        select: {
          studentId: true,
          id: true,
        },
      });

    if (matchByEmail?.studentId) {
      await prisma.user
        .update({
          where: {
            id: userId,
          },

          data: {
            parentId:
              matchByEmail.id,
          },
        })
        .catch(() => {});

      return [
        matchByEmail.studentId,
      ];
    }
  }

  return [];
};

// =====================================================
// GET STUDENT IDS FOR TEACHER
// =====================================================

const getStudentIdsForTeacher = async (
  userId,
  tenantId
) => {
  if (!userId || !tenantId) {
    return [];
  }

  // ===================================================
  // FIND STAFF
  // ===================================================

  const staff =
    await prisma.staff.findFirst({
      where: {
        user: {
          id: userId,
        },

        tenantId,

        isDeleted: false,
      },

      select: {
        id: true,
      },
    });

  if (!staff) {
    return [];
  }

  // ===================================================
  // FIND TIMETABLE SECTIONS
  // ===================================================

  const timetableSections =
    await prisma.timetable.findMany({
      where: {
        staffId: staff.id,

        tenantId,
      },

      select: {
        sectionId: true,
        classId: true,
      },

      distinct: [
        "sectionId",
        "classId",
      ],
    });

  // ===================================================
  // SECTION BASED STUDENTS
  // ===================================================

  const sectionIds =
    timetableSections
      .map(
        (item) => item.sectionId
      )
      .filter(Boolean);

  const classIds =
    timetableSections
      .map(
        (item) => item.classId
      )
      .filter(Boolean);

  // ===================================================
  // IF TEACHER HAS SECTION ASSIGNMENTS
  // ===================================================

  if (sectionIds.length > 0) {
    const students =
      await prisma.student.findMany({
        where: {
          tenantId,

          isDeleted: false,

          sectionId: {
            in: sectionIds,
          },
        },

        select: {
          id: true,
        },
      });

    return students.map(
      (student) => student.id
    );
  }

  // ===================================================
  // FALLBACK TO CLASS ASSIGNMENTS
  // ===================================================

  if (classIds.length > 0) {
    const students =
      await prisma.student.findMany({
        where: {
          tenantId,

          isDeleted: false,

          classId: {
            in: classIds,
          },
        },

        select: {
          id: true,
        },
      });

    return students.map(
      (student) => student.id
    );
  }

  return [];
};

// =====================================================
// CREATE STUDENT
// =====================================================

const createStudent = async (
  data,
  tenantId
) => {
  // ===================================================
  // READ INPUT
  // ===================================================

  const {
    admissionNo,
    feeNo,
    studentName,

    dateOfBirth,
    gender,
    bloodGroup,
    religion,
    category,
    nationality,
    motherTongue,
    maritalStatus,

    aadharNo,
    grNo,
    rollNo,

    classId,
    sectionId,

    house,

    studentEmail,
    countryCode,
    communicationMobile,
    communicationEmail,

    emergencyPhoneNo,

    board,
    medium,
    boardRegistrationNo,

    admissionType,
    classAdmitted,

    boardingCategory,

    remark,
    feeRemark,

    uniqueNo,
    rfidNo,

    eNach,

    bankName,
    accountNo,
    ifsc,
    virtualAccountNo,

    apaarId,
    srnNo,

    siblingAdmNo,
    childLivingWith,

    photoUrl,
    signatureUrl,

    stream,
    feeGroup,
    feePaymentStartFrom,

    dateOfAdmission,
    dateOfJoin,

    fatherTitle,
    fatherName,
    fatherMobile,
    fatherEmail,
    fatherOccupation,

    motherTitle,
    motherName,
    motherMobile,
    motherEmail,
    motherOccupation,

    guardianName,
    guardianMobile,
    guardianEmail,
    guardianOccupation,

    relation,
  } = data || {};

  // ===================================================
  // REQUIRED VALIDATION
  // ===================================================

  const cleanAdmissionNo =
    cleanString(admissionNo);

  const cleanStudentName =
    cleanString(studentName);

  const parsedClassId =
    parseIntegerOrNull(classId);

  const parsedSectionId =
    parseIntegerOrNull(sectionId);

  if (!cleanAdmissionNo) {
    throw new Error(
      "Admission number is required"
    );
  }

  if (!cleanStudentName) {
    throw new Error(
      "Student name is required"
    );
  }

  if (!parsedClassId) {
    throw new Error(
      "Class is required"
    );
  }

  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  // ===================================================
  // DUPLICATE ADMISSION NUMBER
  // ===================================================

  const existingStudent =
    await prisma.student.findFirst({
      where: {
        admissionNo:
          cleanAdmissionNo,

        tenantId,

        isDeleted: false,
      },
    });

  if (existingStudent) {
    throw new Error(
      "Student with this admission number already exists"
    );
  }

  // ===================================================
  // VALIDATE CLASS
  // ===================================================

  const classRecord =
    await prisma.class.findFirst({
      where: {
        id: parsedClassId,

        tenantId,

        isDeleted: false,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!classRecord) {
    throw new Error(
      "Class not found"
    );
  }

  // ===================================================
  // VALIDATE SECTION
  // ===================================================

  if (parsedSectionId) {
    const section =
      await prisma.section.findFirst({
        where: {
          id: parsedSectionId,

          classId:
            parsedClassId,

          tenantId,

          isDeleted: false,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!section) {
      throw new Error(
        "Section not found for the selected class"
      );
    }
  }

  // ===================================================
  // TRANSACTION
  // ===================================================

  const result =
    await prisma.$transaction(
      async (tx) => {
        // =================================================
        // CREATE STUDENT
        // =================================================

        const student =
          await tx.student.create({
            data: {
              // =============================================
              // BASIC
              // =============================================

              admissionNo:
                cleanAdmissionNo,

              feeNo:
                cleanString(feeNo),

              siblingAdmNo:
                cleanString(
                  siblingAdmNo
                ),

              studentName:
                cleanStudentName,

              childLivingWith:
                cleanString(
                  childLivingWith
                ),

              photoUrl:
                cleanString(photoUrl),

              signatureUrl:
                cleanString(
                  signatureUrl
                ),

              // =============================================
              // PARENT FIELDS ON STUDENT
              // =============================================

              fatherTitle:
                cleanString(
                  fatherTitle
                ),

              fatherName:
                cleanString(
                  fatherName
                ),

              motherTitle:
                cleanString(
                  motherTitle
                ),

              motherName:
                cleanString(
                  motherName
                ),

              // =============================================
              // REQUIRED CLASS RELATION
              // =============================================

              class: {
                connect: {
                  id: parsedClassId,
                },
              },

              // =============================================
              // OPTIONAL SECTION RELATION
              // =============================================

              ...(parsedSectionId
                ? {
                    section: {
                      connect: {
                        id:
                          parsedSectionId,
                      },
                    },
                  }
                : {}),

              // =============================================
              // ACADEMIC
              // =============================================

              stream:
                cleanString(stream),

              feeGroup:
                cleanString(
                  feeGroup
                ),

              feePaymentStartFrom:
                cleanString(
                  feePaymentStartFrom
                ),

              dateOfBirth:
                parseDateOrNull(
                  dateOfBirth
                ),

              dateOfAdmission:
                parseDateOrNull(
                  dateOfAdmission
                ),

              dateOfJoin:
                parseDateOrNull(
                  dateOfJoin
                ),

              rollNo:
                cleanString(rollNo),

              gender:
                cleanString(gender),

              admissionType:
                cleanString(
                  admissionType
                ) || "new",

              classAdmitted:
                cleanString(
                  classAdmitted
                ),

              emergencyPhoneNo:
                cleanString(
                  emergencyPhoneNo
                ),

              house:
                cleanString(house),

              boardingCategory:
                cleanString(
                  boardingCategory
                ),

              board:
                cleanString(board),

              medium:
                cleanString(medium),

              boardRegistrationNo:
                cleanString(
                  boardRegistrationNo
                ),

              // =============================================
              // CONTACT
              // =============================================

              studentEmail:
                cleanString(
                  studentEmail
                ),

              countryCode:
                cleanString(
                  countryCode
                ),

              communicationMobile:
                cleanString(
                  communicationMobile
                ),

              communicationEmail:
                cleanString(
                  communicationEmail
                ),

              // =============================================
              // IDENTIFICATION
              // =============================================

              aadharNo:
                cleanString(
                  aadharNo
                ),

              remark:
                cleanString(remark),

              feeRemark:
                cleanString(
                  feeRemark
                ),

              uniqueNo:
                cleanString(uniqueNo),

              grNo:
                cleanString(grNo),

              rfidNo:
                cleanString(rfidNo),

              eNach:
                cleanString(eNach),

              bankName:
                cleanString(bankName),

              accountNo:
                cleanString(accountNo),

              ifsc:
                cleanString(ifsc),

              virtualAccountNo:
                cleanString(
                  virtualAccountNo
                ),

              apaarId:
                cleanString(apaarId),

              srnNo:
                cleanString(srnNo),

              // =============================================
              // OTHER PERSONAL DETAILS
              // =============================================

              bloodGroup:
                cleanString(
                  bloodGroup
                ),

              religion:
                cleanString(
                  religion
                ),

              category:
                cleanString(
                  category
                ),

              motherTongue:
                cleanString(
                  motherTongue
                ),

              nationality:
                cleanString(
                  nationality
                ),

              maritalStatus:
                cleanString(
                  maritalStatus
                ),

              // =============================================
              // REQUIRED TENANT RELATION
              // =============================================

              tenant: {
                connect: {
                  id: Number(tenantId),
                },
              },

              isDeleted: false,
            },
          });

        // =================================================
        // PARENT CREDENTIALS
        // =================================================

        const parentCredentials = [];

        // =================================================
        // FATHER
        // =================================================

        if (
          fatherName ||
          fatherEmail ||
          fatherMobile
        ) {
          const fatherEmailClean =
            cleanString(
              fatherEmail
            )?.toLowerCase();

          const fatherMobileClean =
            cleanString(
              fatherMobile
            );

          const parent =
            await tx.studentParent.create({
              data: {
                student: {
                  connect: {
                    id: student.id,
                  },
                },

                tenantId:
                  Number(tenantId),

                relation:
                  "father",

                name:
                  cleanString(
                    fatherName
                  ) || "Father",

                email:
                  fatherEmailClean,

                mobile:
                  fatherMobileClean ||
                  "",

                occupation:
                  cleanString(
                    fatherOccupation
                  ),
              },
            });

          // Parent credentials are generated when email exists.
          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email:
                  fatherEmailClean,

                mobile:
                  fatherMobileClean,

                tenantId:
                  Number(tenantId),

                studentParentId:
                  parent.id,

                name:
                  cleanString(
                    fatherName
                  ) || "Father",
              }
            );

          /*
           * Only display credentials when a NEW account
           * was actually created.
           *
           * Existing accounts have password: null.
           */
          if (
            credentials &&
            credentials.password
          ) {
            parentCredentials.push({
              relation: "father",
              name:
                credentials.name ||
                cleanString(
                  fatherName
                ) ||
                "Father",
              email:
                credentials.email,
              password:
                credentials.password,
              userId:
                credentials.userId,
            });
          }
        }

        // =================================================
        // MOTHER
        // =================================================

        if (
          motherName ||
          motherEmail ||
          motherMobile
        ) {
          const motherEmailClean =
            cleanString(
              motherEmail
            )?.toLowerCase();

          const motherMobileClean =
            cleanString(
              motherMobile
            );

          const parent =
            await tx.studentParent.create({
              data: {
                student: {
                  connect: {
                    id: student.id,
                  },
                },

                tenantId:
                  Number(tenantId),

                relation:
                  "mother",

                name:
                  cleanString(
                    motherName
                  ) || "Mother",

                email:
                  motherEmailClean,

                mobile:
                  motherMobileClean ||
                  "",

                occupation:
                  cleanString(
                    motherOccupation
                  ),
              },
            });

          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email:
                  motherEmailClean,

                mobile:
                  motherMobileClean,

                tenantId:
                  Number(tenantId),

                studentParentId:
                  parent.id,

                name:
                  cleanString(
                    motherName
                  ) || "Mother",
              }
            );

          if (
            credentials &&
            credentials.password
          ) {
            parentCredentials.push({
              relation: "mother",
              name:
                credentials.name ||
                cleanString(
                  motherName
                ) ||
                "Mother",
              email:
                credentials.email,
              password:
                credentials.password,
              userId:
                credentials.userId,
            });
          }
        }

        // =================================================
        // GUARDIAN
        // =================================================

        if (
          guardianName ||
          guardianEmail ||
          guardianMobile
        ) {
          const guardianEmailClean =
            cleanString(
              guardianEmail
            )?.toLowerCase();

          const guardianMobileClean =
            cleanString(
              guardianMobile
            );

          const parent =
            await tx.studentParent.create({
              data: {
                student: {
                  connect: {
                    id: student.id,
                  },
                },

                tenantId:
                  Number(tenantId),

                relation:
                  cleanString(
                    relation
                  ) || "guardian",

                name:
                  cleanString(
                    guardianName
                  ) || "Guardian",

                email:
                  guardianEmailClean,

                mobile:
                  guardianMobileClean ||
                  "",

                occupation:
                  cleanString(
                    guardianOccupation
                  ),
              },
            });

          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email:
                  guardianEmailClean,

                mobile:
                  guardianMobileClean,

                tenantId:
                  Number(tenantId),

                studentParentId:
                  parent.id,

                name:
                  cleanString(
                    guardianName
                  ) || "Guardian",
              }
            );

          if (
            credentials &&
            credentials.password
          ) {
            parentCredentials.push({
              relation:
                cleanString(
                  relation
                ) || "guardian",

              name:
                credentials.name ||
                cleanString(
                  guardianName
                ) ||
                "Guardian",

              email:
                credentials.email,

              password:
                credentials.password,

              userId:
                credentials.userId,
            });
          }
        }

        // =================================================
        // CREATE STUDENT LOGIN
        // =================================================

        const studentCredentials =
          await maybeCreateStudentUser(
            tx,
            student
          );

        // =================================================
        // RETURN TRANSACTION RESULT
        // =================================================

        return {
          student,

          parentCredentials,

          studentCredentials,
        };
      },

      TRANSACTION_OPTIONS
    );

  // =====================================================
  // GET COMPLETE STUDENT
  // =====================================================

  const fullStudent =
    await getStudentById(
      result.student.id,
      tenantId
    );

  // =====================================================
  // NOTIFICATION
  // =====================================================

  try {
    await createNotification({
      tenantId,

      title:
        "New Student Added",

      message:
        `${result.student.studentName} has been added successfully.`,

      type:
        "student_created",

      priority:
        "normal",

      audience:
        "admin",

      userId: null,
    });
  } catch (notificationError) {
    console.error(
      "Student notification failed:",
      notificationError.message
    );
  }

  // =====================================================
  // RETURN
  // =====================================================

  return {
    ...fullStudent,

    parentCredentials:
      result.parentCredentials,

    studentCredentials:
      result.studentCredentials,

    credentials: {
      student:
        result.studentCredentials,

      parents:
        result.parentCredentials,
    },
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

  // ===================================================
  // PAGINATION
  // ===================================================

  const pageNumber = Math.max(
    1,
    parseInt(page, 10) || 1
  );

  const limitNumber = Math.min(
    100,
    Math.max(
      1,
      parseInt(limit, 10) || 10
    )
  );

  const skip =
    (pageNumber - 1) *
    limitNumber;

  // ===================================================
  // BASE FILTER
  // ===================================================

  const where = {
    tenantId: Number(tenantId),

    isDeleted: false,
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const cleanSearch =
    cleanString(search);

  if (cleanSearch) {
    where.OR = [
      {
        studentName: {
          contains:
            cleanSearch,
          mode: "insensitive",
        },
      },

      {
        admissionNo: {
          contains:
            cleanSearch,
          mode: "insensitive",
        },
      },

      {
        grNo: {
          contains:
            cleanSearch,
          mode: "insensitive",
        },
      },
    ];
  }

  // ===================================================
  // CLASS FILTER
  // ===================================================

  const parsedClassId =
    parseIntegerOrNull(classId);

  if (parsedClassId) {
    where.classId =
      parsedClassId;
  }

  // ===================================================
  // GENDER FILTER
  // ===================================================

  const cleanGender =
    cleanString(gender);

  if (cleanGender) {
    where.gender =
      cleanGender;
  }

  // ===================================================
  // PARENT ACCESS
  // ===================================================

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

  // ===================================================
  // STUDENT ACCESS
  // ===================================================

  if (
    requester &&
    requester.identity === "student"
  ) {
    where.id =
      requester.studentId || -1;
  }

  // ===================================================
  // TEACHER ACCESS
  // ===================================================

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

  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "GET ALL STUDENTS FILTER:",
    JSON.stringify(
      {
        tenantId,
        page: pageNumber,
        limit: limitNumber,
        search: cleanSearch,
        classId: parsedClassId,
        gender: cleanGender,
        requesterIdentity:
          requester?.identity,
      },
      null,
      2
    )
  );

  // ===================================================
  // QUERY
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

        parents: {
          include: {
            user: true,
          },
        },

        user: true,
      },
    }),

    prisma.student.count({
      where,
    }),
  ]);

  console.log(
    `GET ALL STUDENTS RESULT: ${students.length} student(s) found`
  );

  return {
    students,

    pagination: {
      total,

      page:
        pageNumber,

      limit:
        limitNumber,

      totalPages:
        Math.ceil(
          total /
            limitNumber
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
  const studentId =
    parseInt(id, 10);

  if (Number.isNaN(studentId)) {
    throw new Error(
      "Invalid student ID"
    );
  }

  const where = {
    id: studentId,

    tenantId: Number(tenantId),

    isDeleted: false,
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
        requester.userId,
        tenantId
      );

    if (
      !allowedIds.includes(
        studentId
      )
    ) {
      throw new Error(
        "Student not found"
      );
    }
  }

  // ===================================================
  // STUDENT ACCESS
  // ===================================================

  if (
    requester &&
    requester.identity === "student" &&
    requester.studentId !== studentId
  ) {
    throw new Error(
      "Student not found"
    );
  }

  // ===================================================
  // QUERY
  // ===================================================

  const student =
    await prisma.student.findFirst({
      where,

      include: {
        class: true,

        section: true,

        parents: {
          include: {
            user: true,
          },
        },

        user: true,
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
  const studentId =
    parseInt(id, 10);

  if (Number.isNaN(studentId)) {
    throw new Error(
      "Invalid student ID"
    );
  }

  // ===================================================
  // FIND STUDENT
  // ===================================================

  const existingStudent =
    await prisma.student.findFirst({
      where: {
        id: studentId,

        tenantId: Number(tenantId),

        isDeleted: false,
      },
    });

  if (!existingStudent) {
    throw new Error(
      "Student not found"
    );
  }

  // ===================================================
  // DUPLICATE ADMISSION NUMBER
  // ===================================================

  if (data.admissionNo) {
    const duplicate =
      await prisma.student.findFirst({
        where: {
          admissionNo:
            String(
              data.admissionNo
            ).trim(),

          tenantId:
            Number(tenantId),

          isDeleted: false,

          NOT: {
            id: studentId,
          },
        },
      });

    if (duplicate) {
      throw new Error(
        "Student with this admission number already exists"
      );
    }
  }

  // ===================================================
  // UPDATE DATA
  // ===================================================

  const updateData = {};

  const stringFields = [
    "admissionNo",
    "feeNo",
    "siblingAdmNo",
    "studentName",
    "childLivingWith",
    "photoUrl",
    "signatureUrl",
    "fatherTitle",
    "fatherName",
    "motherTitle",
    "motherName",
    "stream",
    "feeGroup",
    "feePaymentStartFrom",
    "rollNo",
    "classAdmitted",
    "emergencyPhoneNo",
    "house",
    "boardingCategory",
    "board",
    "medium",
    "boardRegistrationNo",
    "studentEmail",
    "countryCode",
    "communicationMobile",
    "communicationEmail",
    "aadharNo",
    "remark",
    "feeRemark",
    "uniqueNo",
    "grNo",
    "rfidNo",
    "eNach",
    "bankName",
    "accountNo",
    "ifsc",
    "virtualAccountNo",
    "apaarId",
    "srnNo",
    "bloodGroup",
    "religion",
    "category",
    "motherTongue",
    "nationality",
    "maritalStatus",
  ];

  stringFields.forEach(
    (field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        updateData[field] =
          cleanString(
            data[field]
          );
      }
    }
  );

  // ===================================================
  // DATE FIELDS
  // ===================================================

  const dateFields = [
    "dateOfBirth",
    "dateOfAdmission",
    "dateOfJoin",
  ];

  dateFields.forEach(
    (field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        updateData[field] =
          parseDateOrNull(
            data[field]
          );
      }
    }
  );

  // ===================================================
  // ADMISSION TYPE
  // ===================================================

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "admissionType"
    )
  ) {
    const admissionType =
      cleanString(
        data.admissionType
      );

    if (
      admissionType &&
      [
        "new",
        "transfer",
        "readmission",
      ].includes(
        admissionType
      )
    ) {
      updateData.admissionType =
        admissionType;
    }
  }

  // ===================================================
  // CLASS
  // ===================================================

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "classId"
    )
  ) {
    const newClassId =
      parseIntegerOrNull(
        data.classId
      );

    if (!newClassId) {
      throw new Error(
        "Class is required"
      );
    }

    const classRecord =
      await prisma.class.findFirst({
        where: {
          id: newClassId,

          tenantId:
            Number(tenantId),

          isDeleted: false,
        },
      });

    if (!classRecord) {
      throw new Error(
        "Class not found"
      );
    }

    updateData.class = {
      connect: {
        id: newClassId,
      },
    };
  }

  // ===================================================
  // SECTION
  // ===================================================

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "sectionId"
    )
  ) {
    const newSectionId =
      parseIntegerOrNull(
        data.sectionId
      );

    if (newSectionId) {
      const classForSection =
        data.classId
          ? parseIntegerOrNull(
              data.classId
            )
          : existingStudent.classId;

      const section =
        await prisma.section.findFirst({
          where: {
            id: newSectionId,

            classId:
              classForSection,

            tenantId:
              Number(tenantId),

            isDeleted: false,
          },
        });

      if (!section) {
        throw new Error(
          "Section not found for the selected class"
        );
      }

      updateData.section = {
        connect: {
          id: newSectionId,
        },
      };
    } else {
      updateData.section = {
        disconnect: true,
      };
    }
  }

  // ===================================================
  // UPDATE STUDENT
  // ===================================================

  await prisma.student.update({
    where: {
      id: studentId,
    },

    data: updateData,
  });

  // ===================================================
  // RETURN UPDATED
  // ===================================================

  return getStudentById(
    studentId,
    tenantId
  );
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (
  id,
  tenantId
) => {
  const studentId =
    parseInt(id, 10);

  if (Number.isNaN(studentId)) {
    throw new Error(
      "Invalid student ID"
    );
  }

  const student =
    await prisma.student.findFirst({
      where: {
        id: studentId,

        tenantId: Number(tenantId),

        isDeleted: false,
      },
    });

  if (!student) {
    throw new Error(
      "Student not found"
    );
  }

  await prisma.student.update({
    where: {
      id: studentId,
    },

    data: {
      isDeleted: true,
    },
  });

  return {
    success: true,

    message:
      "Student deleted successfully",
  };
};

// =====================================================
// RESET STUDENT PASSWORD
// =====================================================

const resetStudentPassword = async (
  id,
  tenantId
) => {
  const studentId =
    parseInt(id, 10);

  if (Number.isNaN(studentId)) {
    throw new Error(
      "Invalid student ID"
    );
  }

  // ===================================================
  // FIND STUDENT
  // ===================================================

  const student =
    await prisma.student.findFirst({
      where: {
        id: studentId,

        tenantId: Number(tenantId),

        isDeleted: false,
      },

      include: {
        user: true,
      },
    });

  if (!student) {
    throw new Error(
      "Student not found"
    );
  }

  // ===================================================
  // DEFAULT PASSWORD
  // ===================================================

  let rawPassword =
    `${student.admissionNo}@123`;

  if (student.dateOfBirth) {
    const dob =
      new Date(
        student.dateOfBirth
      );

    if (!Number.isNaN(dob.getTime())) {
      const day =
        String(
          dob.getDate()
        ).padStart(2, "0");

      const month =
        String(
          dob.getMonth() + 1
        ).padStart(2, "0");

      const year =
        dob.getFullYear();

      rawPassword =
        `${day}${month}${year}`;
    }
  }

  const hashedPassword =
    await bcrypt.hash(
      rawPassword,
      10
    );

  // ===================================================
  // UPDATE EXISTING USER
  // ===================================================

  if (student.user) {
    await prisma.user.update({
      where: {
        id: student.user.id,
      },

      data: {
        password:
          hashedPassword,

        mustChangePassword:
          true,
      },
    });

    return {
      email:
        student.user.email,

      password:
        rawPassword,
    };
  }

  // ===================================================
  // CREATE USER
  // ===================================================

  const tenant =
    await prisma.tenant.findUnique({
      where: {
        id: Number(tenantId),
      },

      select: {
        subdomain: true,
      },
    });

  const subdomain =
    tenant?.subdomain ||
    `tenant${tenantId}`;

  const email =
    `${student.admissionNo}@${subdomain}.student`
      .toLowerCase();

  const existingEmailUser =
    await prisma.user.findFirst({
      where: {
        email,

        tenantId:
          Number(tenantId),
      },
    });

  if (existingEmailUser) {
    throw new Error(
      "Student login email already exists"
    );
  }

  const user =
    await prisma.user.create({
      data: {
        name:
          student.studentName,

        email,

        password:
          hashedPassword,

        tenantId:
          Number(tenantId),

        identity:
          "student",

        studentId:
          student.id,

        mustChangePassword:
          true,
      },
    });

  return {
    email: user.email,

    password:
      rawPassword,
  };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createStudent,

  getAllStudents,

  getStudentById,

  updateStudent,

  deleteStudent,

  resetStudentPassword,

  getStudentIdsForParent,

  getStudentIdsForTeacher,
};