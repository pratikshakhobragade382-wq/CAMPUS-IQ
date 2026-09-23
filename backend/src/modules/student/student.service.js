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
  timeout: 15000,
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
  if (!email || !mobile) {
    return null;
  }

  const normalizedEmail =
    String(email).trim().toLowerCase();

  const existingUser =
    await tx.user.findFirst({
      where: {
        email_tenantId: {
          email: normalizedEmail,
          tenantId,
        },
      },
    });

  // ---------------------------------------------------
  // EXISTING USER
  // ---------------------------------------------------

  if (existingUser) {
    if (existingUser.identity !== "parent") {
      return null;
    }

    await tx.studentParent.update({
      where: {
        id: studentParentId,
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

  // ---------------------------------------------------
  // CREATE NEW PARENT USER
  // ---------------------------------------------------

  const rawPassword = String(mobile)
    .replace(/\D/g, "")
    .slice(-6);

  if (!rawPassword) {
    return null;
  }

  const hashedPassword =
    await bcrypt.hash(rawPassword, 10);

  const user =
    await tx.user.create({
      data: {
        name:
          name ||
          normalizedEmail.split("@")[0],

        email: normalizedEmail,

        password: hashedPassword,

        tenantId,

        identity: "parent",

        mustChangePassword: true,

        studentParent: {
          connect: {
            id: studentParentId,
          },
        },
      },
    });

  return {
    email: normalizedEmail,
    password: rawPassword,
    userId: user.id,
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

  // ---------------------------------------------------
  // CHECK EXISTING STUDENT USER
  // ---------------------------------------------------

  const existingStudentUser =
    await tx.user.findUnique({
      where: {
        studentId: student.id,
      },
    });

  if (existingStudentUser) {
    return null;
  }

  // ---------------------------------------------------
  // GET TENANT
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // STUDENT LOGIN EMAIL
  // ---------------------------------------------------

  const loginEmail =
    `${student.admissionNo}@${subdomain}.student`
      .toLowerCase();

  // ---------------------------------------------------
  // CHECK EMAIL
  // ---------------------------------------------------

  const existingEmailUser =
    await tx.user.findFirst({
      where: {
        email_tenantId: {
          email: loginEmail,
          tenantId: student.tenantId,
        },
      },
    });

  if (existingEmailUser) {
    return null;
  }

  // ---------------------------------------------------
  // DEFAULT PASSWORD
  //
  // DOB -> DDMMYYYY
  // Otherwise -> admissionNo@123
  // ---------------------------------------------------

  let rawPassword =
    `${student.admissionNo}@123`;

  if (student.dateOfBirth) {
    const dob =
      new Date(student.dateOfBirth);

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

  // ---------------------------------------------------
  // CREATE STUDENT USER
  // ---------------------------------------------------

  const user =
    await tx.user.create({
      data: {
        name:
          student.studentName ||
          "Student",

        email: loginEmail,

        password: hashedPassword,

        tenantId:
          student.tenantId,

        identity: "student",

        studentId: student.id,

        mustChangePassword: true,
      },
    });

  return {
    email: loginEmail,
    password: rawPassword,
    userId: user.id,
  };
};

// =====================================================
// GET STUDENTS FOR PARENT
// =====================================================

const getStudentIdsForParent = async (
  userId,
  tenantId
) => {
  if (!userId || !tenantId) {
    return [];
  }

  const parentUser =
    await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        identity: "parent",
        isDeleted: false,
      },
      select: {
        id: true,
        studentParent: {
          select: {
            studentId: true,
          },
        },
      },
    });

  if (!parentUser?.studentParent) {
    return [];
  }

  return [
    parentUser.studentParent.studentId,
  ];
};

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
    studentName,
    dateOfBirth,
    gender,
    bloodGroup,
    religion,
    caste,
    category,
    nationality,
    motherTongue,
    aadharNo,
    grNo,
    rollNo,
    classId,
    sectionId,
    house,
    transportRequired,
    busRouteId,
    address,
    city,
    state,
    pincode,
    previousSchool,
    previousClass,
    previousPercentage,
    admissionDate,
    medicalInfo,
    notes,
    fatherName,
    fatherEmail,
    fatherMobile,
    fatherOccupation,
    motherName,
    motherEmail,
    motherMobile,
    motherOccupation,
    guardianName,
    guardianEmail,
    guardianMobile,
    guardianOccupation,
    relation,
  } = data;

  // ---------------------------------------------------
  // REQUIRED FIELD VALIDATION
  // ---------------------------------------------------

  if (!admissionNo) {
    throw new Error(
      "Admission number is required"
    );
  }

  if (!studentName) {
    throw new Error(
      "Student name is required"
    );
  }

  if (!classId) {
    throw new Error(
      "Class is required"
    );
  }

  // ---------------------------------------------------
  // DUPLICATE ADMISSION NUMBER
  // ---------------------------------------------------

  const existingStudent =
    await prisma.student.findFirst({
      where: {
        admissionNo:
          String(admissionNo).trim(),

        tenantId,

        isDeleted: false,
      },
    });

  if (existingStudent) {
    throw new Error(
      "Student with this admission number already exists"
    );
  }

  // ---------------------------------------------------
  // VALIDATE CLASS
  // ---------------------------------------------------

  const classRecord =
    await prisma.class.findFirst({
      where: {
        id: parseInt(classId, 10),
        tenantId,
        isDeleted: false,
      },
    });

  if (!classRecord) {
    throw new Error(
      "Class not found"
    );
  }

  // ---------------------------------------------------
  // VALIDATE SECTION
  // ---------------------------------------------------

  if (sectionId) {
    const section =
      await prisma.section.findFirst({
        where: {
          id: parseInt(sectionId, 10),
          classId: parseInt(classId, 10),
          tenantId,
          isDeleted: false,
        },
      });

    if (!section) {
      throw new Error(
        "Section not found"
      );
    }
  }

  // ---------------------------------------------------
  // TRANSACTION
  // ---------------------------------------------------

  const result =
    await prisma.$transaction(
      async (tx) => {
        // ---------------------------------------------
        // CREATE STUDENT
        // ---------------------------------------------

        const student =
          await tx.student.create({
            data: {
              admissionNo:
                String(admissionNo).trim(),

              feeNo:
                feeNo ||
                null,

              studentName:
                String(studentName).trim(),

              dateOfBirth:
                dateOfBirth
                  ? new Date(dateOfBirth)
                  : null,

              gender:
                gender || null,

              bloodGroup:
                bloodGroup || null,

              religion:
                religion || null,

              caste:
                caste || null,

              category:
                category || null,

              nationality:
                nationality || null,

              motherTongue:
                motherTongue || null,

              aadharNo:
                aadharNo || null,

              grNo:
                grNo || null,

              rollNo:
                rollNo || null,

              classId:
                parseInt(classId, 10),

              sectionId:
                sectionId
                  ? parseInt(sectionId, 10)
                  : null,

              house:
                house || null,

              transportRequired:
                transportRequired === true ||
                transportRequired === "true",

              busRouteId:
                busRouteId
                  ? parseInt(busRouteId, 10)
                  : null,

              address:
                address || null,

              city:
                city || null,

              state:
                state || null,

              pincode:
                pincode || null,

              previousSchool:
                previousSchool || null,

              previousClass:
                previousClass || null,

              previousPercentage:
                previousPercentage !==
                  undefined &&
                previousPercentage !==
                  null &&
                previousPercentage !== ""
                  ? parseFloat(
                      previousPercentage
                    )
                  : null,

              admissionDate:
                admissionDate
                  ? new Date(admissionDate)
                  : null,

              medicalInfo:
                medicalInfo || null,

              notes:
                notes || null,

              tenantId,

              isDeleted: false,
            },
          });

        // ---------------------------------------------
        // CREATE PARENT RECORDS
        // ---------------------------------------------

        const parentCredentials = [];

        // ---------------------------------------------
        // FATHER
        // ---------------------------------------------

        if (
          fatherName ||
          fatherEmail ||
          fatherMobile
        ) {
          const parent =
            await tx.studentParent.create({
              data: {
                studentId:
                  student.id,

                tenantId,

                relation: "father",

                name:
                  fatherName ||
                  "Father",

                email:
                  fatherEmail ||
                  null,

                mobile:
                  fatherMobile ||
                  null,

                occupation:
                  fatherOccupation ||
                  null,
              },
            });

          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email: fatherEmail,
                mobile: fatherMobile,
                tenantId,
                studentParentId:
                  parent.id,
                name:
                  fatherName ||
                  "Father",
              }
            );

          if (credentials) {
            parentCredentials.push({
              relation: "father",
              ...credentials,
            });
          }
        }

        // ---------------------------------------------
        // MOTHER
        // ---------------------------------------------

        if (
          motherName ||
          motherEmail ||
          motherMobile
        ) {
          const parent =
            await tx.studentParent.create({
              data: {
                studentId:
                  student.id,

                tenantId,

                relation: "mother",

                name:
                  motherName ||
                  "Mother",

                email:
                  motherEmail ||
                  null,

                mobile:
                  motherMobile ||
                  null,

                occupation:
                  motherOccupation ||
                  null,
              },
            });

          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email: motherEmail,
                mobile: motherMobile,
                tenantId,
                studentParentId:
                  parent.id,
                name:
                  motherName ||
                  "Mother",
              }
            );

          if (credentials) {
            parentCredentials.push({
              relation: "mother",
              ...credentials,
            });
          }
        }

        // ---------------------------------------------
        // GUARDIAN
        // ---------------------------------------------

        if (
          guardianName ||
          guardianEmail ||
          guardianMobile
        ) {
          const parent =
            await tx.studentParent.create({
              data: {
                studentId:
                  student.id,

                tenantId,

                relation:
                  relation ||
                  "guardian",

                name:
                  guardianName ||
                  "Guardian",

                email:
                  guardianEmail ||
                  null,

                mobile:
                  guardianMobile ||
                  null,

                occupation:
                  guardianOccupation ||
                  null,
              },
            });

          const credentials =
            await maybeCreateParentUser(
              tx,
              {
                email: guardianEmail,
                mobile: guardianMobile,
                tenantId,
                studentParentId:
                  parent.id,
                name:
                  guardianName ||
                  "Guardian",
              }
            );

          if (credentials) {
            parentCredentials.push({
              relation:
                relation ||
                "guardian",
              ...credentials,
            });
          }
        }

        // ---------------------------------------------
        // CREATE STUDENT LOGIN
        // ---------------------------------------------

        const studentCredentials =
          await maybeCreateStudentUser(
            tx,
            student
          );

        return {
          student,
          parentCredentials,
          studentCredentials,
        };
      },
      TRANSACTION_OPTIONS
    );

  // ---------------------------------------------------
  // GET COMPLETE STUDENT
  // ---------------------------------------------------

  const fullStudent =
    await getStudentById(
      result.student.id,
      tenantId
    );

  // ---------------------------------------------------
  // NOTIFICATION
  // ---------------------------------------------------

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

  return {
    ...fullStudent,

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

  // ---------------------------------------------------
  // NORMALIZE SEARCH
  // ---------------------------------------------------

  const cleanSearch =
    typeof search === "string"
      ? search.trim()
      : String(search || "").trim();

  // ---------------------------------------------------
  // NORMALIZE PAGINATION
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // BASE FILTER
  // ---------------------------------------------------

  const where = {
    tenantId,

    isDeleted: false,
  };

  // ---------------------------------------------------
  // SEARCH
  //
  // Searches:
  // 1. Student Name
  // 2. Admission Number
  // 3. GR Number
  // ---------------------------------------------------

  if (cleanSearch) {
    where.OR = [
      {
        studentName: {
          contains: cleanSearch,
          mode: "insensitive",
        },
      },

      {
        admissionNo: {
          contains: cleanSearch,
          mode: "insensitive",
        },
      },

      {
        grNo: {
          contains: cleanSearch,
          mode: "insensitive",
        },
      },
    ];
  }

  // ---------------------------------------------------
  // CLASS FILTER
  // ---------------------------------------------------

  if (
    classId !== undefined &&
    classId !== null &&
    String(classId).trim() !== ""
  ) {
    const parsedClassId =
      parseInt(classId, 10);

    if (!Number.isNaN(parsedClassId)) {
      where.classId =
        parsedClassId;
    }
  }

  // ---------------------------------------------------
  // GENDER FILTER
  // ---------------------------------------------------

  if (
    gender !== undefined &&
    gender !== null &&
    String(gender).trim() !== ""
  ) {
    where.gender =
      String(gender).trim();
  }

  // ---------------------------------------------------
  // PARENT ACCESS
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // STUDENT ACCESS
  // ---------------------------------------------------

  if (
    requester &&
    requester.identity === "student"
  ) {
    where.id =
      requester.studentId || -1;
  }

  // ---------------------------------------------------
  // DEBUG LOG
  // ---------------------------------------------------

  console.log(
    "GET ALL STUDENTS FILTER:",
    JSON.stringify(
      {
        tenantId,
        page: pageNumber,
        limit: limitNumber,
        search: cleanSearch,
        classId,
        gender,
        requesterIdentity:
          requester?.identity,
      },
      null,
      2
    )
  );

  // ---------------------------------------------------
  // QUERY
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // DEBUG RESULT
  // ---------------------------------------------------

  console.log(
    `GET ALL STUDENTS RESULT: ${students.length} student(s) found`
  );

  if (cleanSearch) {
    console.log(
      "SEARCH:",
      cleanSearch
    );

    console.log(
      "MATCHED STUDENTS:",
      students.map((student) => ({
        id: student.id,
        name: student.studentName,
        admissionNo:
          student.admissionNo,
        grNo: student.grNo,
      }))
    );
  }

  // ---------------------------------------------------
  // RETURN
  // ---------------------------------------------------

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
  const studentId =
    parseInt(id, 10);

  if (Number.isNaN(studentId)) {
    throw new Error(
      "Invalid student ID"
    );
  }

  const where = {
    id: studentId,

    tenantId,

    isDeleted: false,
  };

  // ---------------------------------------------------
  // PARENT ACCESS
  // ---------------------------------------------------

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
      !allowedIds.includes(studentId)
    ) {
      throw new Error(
        "Student not found"
      );
    }
  }

  // ---------------------------------------------------
  // STUDENT ACCESS
  // ---------------------------------------------------

  if (
    requester &&
    requester.identity === "student" &&
    requester.studentId !==
      studentId
  ) {
    throw new Error(
      "Student not found"
    );
  }

  // ---------------------------------------------------
  // QUERY
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // CHECK STUDENT
  // ---------------------------------------------------

  const existingStudent =
    await prisma.student.findFirst({
      where: {
        id: studentId,

        tenantId,

        isDeleted: false,
      },
    });

  if (!existingStudent) {
    throw new Error(
      "Student not found"
    );
  }

  // ---------------------------------------------------
  // DUPLICATE ADMISSION NUMBER
  // ---------------------------------------------------

  if (data.admissionNo) {
    const duplicate =
      await prisma.student.findFirst({
        where: {
          admissionNo:
            String(
              data.admissionNo
            ).trim(),

          tenantId,

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

  // ---------------------------------------------------
  // BUILD UPDATE DATA
  // ---------------------------------------------------

  const updateData = {};

  const fields = [
    "admissionNo",
    "feeNo",
    "studentName",
    "gender",
    "bloodGroup",
    "religion",
    "caste",
    "category",
    "nationality",
    "motherTongue",
    "aadharNo",
    "grNo",
    "rollNo",
    "house",
    "address",
    "city",
    "state",
    "pincode",
    "previousSchool",
    "previousClass",
    "medicalInfo",
    "notes",
    "fatherName",
    "fatherEmail",
    "fatherMobile",
    "fatherOccupation",
    "motherName",
    "motherEmail",
    "motherMobile",
    "motherOccupation",
    "guardianName",
    "guardianEmail",
    "guardianMobile",
    "guardianOccupation",
  ];

  fields.forEach(
    (field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        updateData[field] =
          data[field] === ""
            ? null
            : data[field];
      }
    }
  );

  // ---------------------------------------------------
  // DATE OF BIRTH
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "dateOfBirth"
    )
  ) {
    updateData.dateOfBirth =
      data.dateOfBirth
        ? new Date(
            data.dateOfBirth
          )
        : null;
  }

  // ---------------------------------------------------
  // ADMISSION DATE
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "admissionDate"
    )
  ) {
    updateData.admissionDate =
      data.admissionDate
        ? new Date(
            data.admissionDate
          )
        : null;
  }

  // ---------------------------------------------------
  // CLASS
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "classId"
    )
  ) {
    updateData.classId =
      data.classId
        ? parseInt(
            data.classId,
            10
          )
        : null;
  }

  // ---------------------------------------------------
  // SECTION
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "sectionId"
    )
  ) {
    updateData.sectionId =
      data.sectionId
        ? parseInt(
            data.sectionId,
            10
          )
        : null;
  }

  // ---------------------------------------------------
  // BUS ROUTE
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "busRouteId"
    )
  ) {
    updateData.busRouteId =
      data.busRouteId
        ? parseInt(
            data.busRouteId,
            10
          )
        : null;
  }

  // ---------------------------------------------------
  // TRANSPORT
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "transportRequired"
    )
  ) {
    updateData.transportRequired =
      data.transportRequired ===
        true ||
      data.transportRequired ===
        "true";
  }

  // ---------------------------------------------------
  // PREVIOUS PERCENTAGE
  // ---------------------------------------------------

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "previousPercentage"
    )
  ) {
    updateData.previousPercentage =
      data.previousPercentage !==
        undefined &&
      data.previousPercentage !==
        null &&
      data.previousPercentage !== ""
        ? parseFloat(
            data.previousPercentage
          )
        : null;
  }

  // ---------------------------------------------------
  // UPDATE
  // ---------------------------------------------------

  await prisma.student.update({
    where: {
      id: studentId,
    },

    data: updateData,
  });

  // ---------------------------------------------------
  // RETURN UPDATED STUDENT
  // ---------------------------------------------------

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

        tenantId,

        isDeleted: false,
      },
    });

  if (!student) {
    throw new Error(
      "Student not found"
    );
  }

  // ---------------------------------------------------
  // SOFT DELETE
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // FIND STUDENT
  // ---------------------------------------------------

  const student =
    await prisma.student.findFirst({
      where: {
        id: studentId,

        tenantId,

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

  // ---------------------------------------------------
  // DEFAULT PASSWORD
  // ---------------------------------------------------

  let rawPassword =
    `${student.admissionNo}@123`;

  if (student.dateOfBirth) {
    const dob =
      new Date(
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

  // ---------------------------------------------------
  // UPDATE EXISTING USER
  // ---------------------------------------------------

  if (student.user) {
    await prisma.user.update({
      where: {
        id: student.user.id,
      },

      data: {
        password:
          hashedPassword,

        mustChangePassword: true,
      },
    });

    return {
      email:
        student.user.email,

      password:
        rawPassword,
    };
  }

  // ---------------------------------------------------
  // CREATE USER IF MISSING
  // ---------------------------------------------------

  const tenant =
    await prisma.tenant.findUnique({
      where: {
        id: tenantId,
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
        email_tenantId: {
          email,
          tenantId,
        },
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

        tenantId,

        identity:
          "student",

        studentId:
          student.id,

        mustChangePassword:
          true,
      },
    });

  return {
    email:
      user.email,

    password:
      rawPassword,
  };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  resetStudentPassword,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentIdsForParent,
};