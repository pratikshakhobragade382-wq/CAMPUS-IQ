const prisma = require("../../prisma/prismaClient");
const { HttpError } = require("../../utils/httpError");
const {
  getStudentIdsForParent,
} = require("../student/student.service");
const {
  createNotification,
} = require("../notification/notification.service");

const {
  analyzeComplaint,
  fallbackAnalysis,
  generateReply,
} = require("./complaint.ai");

const C = require("./complaint.constants");

// =====================================================
// HELPERS
// =====================================================

const clean = (value) =>
  typeof value === "string" ? value.trim() : "";

const capitalize = (text) =>
  text
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : text;

const ticketNo = (id) =>
  `CMP-${String(id).padStart(5, "0")}`;

const parseId = (value, label = "id") => {
  const id = parseInt(value, 10);

  if (Number.isNaN(id)) {
    throw new HttpError(
      400,
      `Invalid ${label}`
    );
  }

  return id;
};

const requireEnum = (
  value,
  allowed,
  label
) => {
  const key = C.normalizeEnum(
    value,
    allowed,
    null
  );

  if (!key) {
    throw new HttpError(
      400,
      `Invalid ${label}`
    );
  }

  return key;
};

const STATUS_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// =====================================================
// RESPONSE SHAPING
// =====================================================

async function loadContext(
  tenantId,
  complaints
) {
  const studentIds = [
    ...new Set(
      complaints
        .map((c) => c.studentId)
        .filter(Boolean)
    ),
  ];

  const userIds = [
  ...new Set(
    complaints
      .map((c) => c.parentUserId)
      .filter(Boolean)
  ),
];

  const [students, users] =
    await Promise.all([
      studentIds.length
        ? prisma.student.findMany({
            where: {
              id: {
                in: studentIds,
              },
              tenantId,
            },
            select: {
              id: true,
              studentName: true,
              admissionNo: true,

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
                select: {
                  relation: true,
                  name: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          })
        : [],

      userIds.length
        ? prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              email: true,
            },
          })
        : [],
    ]);

  return {
    students: new Map(
      students.map((s) => [
        s.id,
        s,
      ])
    ),

    users: new Map(
      users.map((u) => [
        u.id,
        u,
      ])
    ),
  };
}

function pickParent(
  student,
  userEmail
) {
  const parents =
    student?.parents || [];

  const email =
    (userEmail || "").toLowerCase();

  const match =
    parents.find(
      (p) =>
        p.email &&
        p.email.toLowerCase() ===
          email
    ) ||
    (parents.length === 1
      ? parents[0]
      : null);

  return {
    name: match?.name || null,
    relation:
      match?.relation || null,
    mobile:
      match?.mobile || null,
    email:
      match?.email ||
      userEmail ||
      null,
  };
}

function shapeStudent(
  student,
  withAdmissionNo
) {
  if (!student) {
    return null;
  }

  return {
    id: student.id,
    name: student.studentName,

    ...(withAdmissionNo
      ? {
          admissionNo:
            student.admissionNo,
        }
      : {}),

    className:
      student.class?.name || null,

    sectionName:
      student.section?.name ||
      null,
  };
}

function shapeForAdmin(
  complaint,
  context
) {
  const student =
    context.students.get(
      complaint.studentId
    ) || null;

  const userEmail =
    context.users.get(
      complaint.parentUserId
    )?.email || null;

  return {
    id: complaint.id,

    ticketNo: ticketNo(
      complaint.id
    ),

    subject: complaint.subject,

    description:
      complaint.description,

    category:
      complaint.category,

    priority:
      complaint.priority,

    priorityReason:
      complaint.priorityReason,

    sentiment:
      complaint.sentiment,

    emotion:
      complaint.emotion,

    issueTag:
      capitalize(
        complaint.issueTag
      ),

    aiSummary:
      complaint.aiSummary,

    aiSuggestedResolution:
      complaint.aiSuggestedResolution,

    aiStatus:
      complaint.aiStatus,

    aiAnalyzedAt:
      complaint.aiAnalyzedAt,

    department:
      complaint.department,

    status:
      complaint.status,

    suggestionStatus:
      complaint.suggestionStatus,

    finalResolution:
      complaint.finalResolution,

    adminReply:
      complaint.adminReply,

    repliedAt:
      complaint.repliedAt,

    resolvedAt:
      complaint.resolvedAt,

    createdAt:
      complaint.createdAt,

    updatedAt:
      complaint.updatedAt,

    student:
      shapeStudent(
        student,
        true
      ),

    parent:
      pickParent(
        student,
        userEmail
      ),
  };
}

// Parents should not see AI analysis details.
function shapeForParent(
  complaint,
  context
) {
  return {
    id: complaint.id,

    ticketNo: ticketNo(
      complaint.id
    ),

    subject:
      complaint.subject,

    description:
      complaint.description,

    category:
      complaint.category,

    status:
      complaint.status,

    adminReply:
      complaint.adminReply,

    repliedAt:
      complaint.repliedAt,

    resolvedAt:
      complaint.resolvedAt,

    createdAt:
      complaint.createdAt,

    student:
      shapeStudent(
        context.students.get(
          complaint.studentId
        ),
        false
      ),
  };
}

async function adminView(
  tenantId,
  complaint
) {
  const context =
    await loadContext(
      tenantId,
      [complaint]
    );

  return shapeForAdmin(
    complaint,
    context
  );
}

async function findOrThrow(
  tenantId,
  id
) {
  const complaint =
    await prisma.complaint.findFirst({
      where: {
        id: parseId(id),
        tenantId,
      },
    });

  if (!complaint) {
    throw new HttpError(
      404,
      "Complaint not found"
    );
  }

  return complaint;
}

// =====================================================
// NOTIFICATIONS
// =====================================================

async function safeNotify(
  payload
) {
  try {
    await createNotification(
      payload
    );
  } catch (error) {
    console.error(
      "[complaint] notification failed:",
      error.message
    );
  }
}

const notifyAdmins = (
  complaint
) =>
  safeNotify({
    tenantId:
      complaint.tenantId,

    title: `New complaint ${ticketNo(
      complaint.id
    )}`,

    message: `${complaint.subject} (${capitalize(
      complaint.category.toLowerCase()
    )}, ${capitalize(
      complaint.priority.toLowerCase()
    )} priority)`,

    audience: "admin",
  });

const notifyParent = (
  complaint,
  title,
  message
) =>
  safeNotify({
    tenantId:
      complaint.tenantId,

    title,

    message,

    audience: "individual",

    userId:
      complaint.parentUserId,
  });

  async function notifyComplaintOwner(
  complaint,
  title,
  message
) {
  // ===================================================
  // PARENT COMPLAINT
  // ===================================================

  if (complaint.parentUserId) {
    console.log(
      `[complaint] Sending reply notification to parent userId=${complaint.parentUserId}`
    );

    await safeNotify({
      tenantId: complaint.tenantId,
      title,
      message,
      audience: "individual",
      userId: complaint.parentUserId,
    });

    return;
  }

  // ===================================================
  // STUDENT COMPLAINT
  // ===================================================

  if (complaint.studentId) {
    const studentUser =
      await prisma.user.findFirst({
        where: {
          tenantId: complaint.tenantId,
          studentId: complaint.studentId,
          identity: "student",
          isDeleted: false,
        },
        select: {
          id: true,
          email: true,
          studentId: true,
        },
      });

    if (!studentUser) {
      console.error(
        `[complaint] Student user NOT FOUND for studentId=${complaint.studentId}`
      );

      return;
    }

    console.log(
      `[complaint] Sending reply notification to student userId=${studentUser.id}, studentId=${studentUser.studentId}`
    );

    await safeNotify({
      tenantId: complaint.tenantId,
      title,
      message,
      audience: "individual",
      userId: studentUser.id,
    });
  }
}

// =====================================================
// AI ANALYSIS
// =====================================================

async function runAnalysis(
  complaintId,
  tenantId,
  { allowFallback }
) {
  const complaint =
    await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        tenantId,
      },
    });

  if (!complaint) {
    return null;
  }

  let analysis;
  let aiStatus = "COMPLETED";

  try {
    analysis =
      await analyzeComplaint(
        complaint
      );
  } catch (error) {
    console.error(
      `[complaint] AI analysis failed for #${complaintId}:`,
      error.message
    );

    if (!allowFallback) {
      throw new HttpError(
        502,
        "The AI service could not analyse this complaint right now. Please try again."
      );
    }

    analysis =
      fallbackAnalysis(
        complaint
      );

    aiStatus = "FALLBACK";
  }

  return prisma.complaint.update({
    where: {
      id: complaint.id,
    },

    data: {
      category:
        analysis.category,

      priority:
        analysis.priority,

      priorityReason:
        analysis.priorityReason,

      sentiment:
        analysis.sentiment,

      emotion:
        analysis.emotion,

      issueTag:
        analysis.issueTag,

      aiSummary:
        analysis.summary,

      aiSuggestedResolution:
        analysis.suggestedResolution,

      department:
        C.CATEGORY_DEPARTMENT[
          analysis.category
        ],

      aiStatus,

      aiAnalyzedAt:
        new Date(),
    },
  });
}

function analyzeInBackground(
  complaintId,
  tenantId
) {
  setImmediate(
    async () => {
      try {
        const updated =
          await runAnalysis(
            complaintId,
            tenantId,
            {
              allowFallback: true,
            }
          );

        if (updated) {
          await notifyAdmins(
            updated
          );
        }
      } catch (error) {
        console.error(
          "[complaint] background analysis crashed:",
          error
        );
      }
    }
  );
}

// =====================================================
// PARENT: CREATE
// =====================================================

async function createComplaint(user, body = {}) {
  const {
    userId,
    tenantId,
    identity,
    studentId: authenticatedStudentId,
  } = user;

  const subject = clean(body.subject);
  const description = clean(body.description);

  if (!subject) {
    throw new HttpError(400, "Subject is required");
  }

  if (!description) {
    throw new HttpError(400, "Description is required");
  }

  let studentId = null;
  let parentUserId = null;

  // ===================================================
  // STUDENT
  // ===================================================

  if (identity === "student") {
    if (!authenticatedStudentId) {
      throw new HttpError(
        400,
        "Student account is not linked to a student record"
      );
    }

    // IMPORTANT:
    // Student can ONLY create complaint for themselves.
    // Do not trust body.studentId.
    studentId = authenticatedStudentId;

    parentUserId = null;
  }

  // ===================================================
  // PARENT
  // ===================================================

  else if (identity === "parent") {
    parentUserId = userId;

    if (
      body.studentId !== undefined &&
      body.studentId !== null &&
      body.studentId !== ""
    ) {
      const requested = parseId(
        body.studentId,
        "student"
      );

      const allowed =
        await getStudentIdsForParent(
          userId,
          tenantId
        );

      if (!allowed.includes(requested)) {
        throw new HttpError(
          404,
          "Student not found"
        );
      }

      studentId = requested;
    }
  }

  // ===================================================
  // INVALID USER
  // ===================================================

  else {
    throw new HttpError(
      403,
      "Only parents and students can create complaints"
    );
  }

  // ===================================================
  // RATE LIMIT
  // ===================================================

  const recentWhere = {
    tenantId,

    createdAt: {
      gte: new Date(
        Date.now() - 60 * 60 * 1000
      ),
    },
  };

  if (identity === "parent") {
    recentWhere.parentUserId = userId;
  } else {
    recentWhere.studentId = studentId;
  }

  const recent =
    await prisma.complaint.count({
      where: recentWhere,
    });

  if (
    recent >= C.LIMITS.perParentPerHour
  ) {
    throw new HttpError(
      429,
      "Too many complaints submitted. Please try again later."
    );
  }

  // ===================================================
  // CREATE COMPLAINT
  // ===================================================

  const complaint =
    await prisma.complaint.create({
      data: {
        tenantId,
        parentUserId,
        studentId,
        subject,
        description,
      },
    });

  // ===================================================
  // AI ANALYSIS
  // ===================================================

  analyzeInBackground(
    complaint.id,
    tenantId
  );

  // ===================================================
  // NOTIFY ADMINS
  // ===================================================

  await notifyAdmins(
    complaint,
    "New complaint received",
    `A new complaint "${subject}" has been submitted.`
  );

  // ===================================================
  // RESPONSE
  // ===================================================

  const context =
    await loadContext(
      tenantId,
      [complaint]
    );

  return shapeForParent(
    complaint,
    context
  );
}

// =====================================================
// PARENT: LIST
// =====================================================

async function listMyComplaints(
  user,
  query = {}
) {
  const {
    userId,
    tenantId,
    identity,
    studentId,
  } = user;

  let where = {
    tenantId,
  };

  // Parent → complaints submitted by parent
  if (identity === "parent") {
    where.parentUserId = userId;
  }

  // Student → complaints belonging to logged-in student
  else if (identity === "student") {
    if (!studentId) {
      throw new HttpError(
        400,
        "Student account is not linked to a student record"
      );
    }

    where.studentId = studentId;
  }

  else {
    throw new HttpError(
      403,
      "Only parents and students can view their complaints"
    );
  }

  const status = C.normalizeEnum(
    query.status,
    C.STATUSES,
    null
  );

  if (status) {
    where.status = status;
  }

  const complaints =
    await prisma.complaint.findMany({
      where,

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    });

  const context =
    await loadContext(
      tenantId,
      complaints
    );

  return complaints.map(
    (complaint) =>
      shapeForParent(
        complaint,
        context
      )
  );
}

// =====================================================
// PARENT: DETAIL
// =====================================================

async function getMyComplaint(
  user,
  id
) {
  const where = {
    id: parseId(id),
    tenantId: user.tenantId,
  };

  // Parent → only their complaints
  if (user.identity === "parent") {
    where.parentUserId = user.userId;
  }

  // Student → only their own complaints
  else if (user.identity === "student") {
    if (!user.studentId) {
      throw new HttpError(
        400,
        "Student account is not linked to a student record"
      );
    }

    where.studentId = user.studentId;
  }

  else {
    throw new HttpError(
      403,
      "Only parents and students can view their complaints"
    );
  }

  const complaint =
    await prisma.complaint.findFirst({
      where,
    });

  if (!complaint) {
    throw new HttpError(
      404,
      "Complaint not found"
    );
  }

  const context =
    await loadContext(
      user.tenantId,
      [complaint]
    );

  return shapeForParent(
    complaint,
    context
  );
}
// =====================================================
// ADMIN: LIST
// =====================================================

async function listComplaints(
  user,
  query = {}
) {
  const {
    tenantId,
  } = user;

  const page = Math.max(
    parseInt(query.page, 10) ||
      1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(query.limit, 10) ||
        10,
      1
    ),
    50
  );

  const where = {
    tenantId,
  };

  const filters = [
    [
      "status",
      C.STATUSES,
    ],
    [
      "category",
      C.CATEGORIES,
    ],
    [
      "priority",
      C.PRIORITIES,
    ],
    [
      "sentiment",
      C.SENTIMENTS,
    ],
    [
      "emotion",
      C.EMOTIONS,
    ],
  ];

  for (const [
    field,
    allowed,
  ] of filters) {
    const value =
      C.normalizeEnum(
        query[field],
        allowed,
        null
      );

    if (value) {
      where[field] = value;
    }
  }

  if (
    C.DEPARTMENTS.includes(
      query.department
    )
  ) {
    where.department =
      query.department;
  }

  const term = clean(
    query.search
  ).slice(0, 100);

  if (term) {
    where.OR = [
      {
        subject: {
          contains: term,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: term,
          mode: "insensitive",
        },
      },
      {
        issueTag: {
          contains: term,
          mode: "insensitive",
        },
      },
    ];

    const ticketMatch =
      term.match(
        /^(?:cmp-?)?0*(\d{1,9})$/i
      );

    if (ticketMatch) {
      where.OR.push({
        id: parseInt(
          ticketMatch[1],
          10
        ),
      });
    }
  }

  const orderBy =
    query.sort === "priority"
      ? [
          {
            priority: "desc",
          },
          {
            createdAt: "desc",
          },
        ]
      : [
          {
            createdAt: "desc",
          },
        ];

  const [
    total,
    rows,
  ] = await Promise.all([
    prisma.complaint.count({
      where,
    }),

    prisma.complaint.findMany({
      where,
      orderBy,

      skip:
        (page - 1) * limit,

      take: limit,
    }),
  ]);

  const context =
    await loadContext(
      tenantId,
      rows
    );

  return {
    items: rows.map(
      (complaint) =>
        shapeForAdmin(
          complaint,
          context
        )
    ),

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.max(
        Math.ceil(
          total / limit
        ),
        1
      ),
    },
  };
}

// =====================================================
// ADMIN: DETAIL
// =====================================================

async function getComplaint(
  user,
  id
) {
  const complaint =
    await findOrThrow(
      user.tenantId,
      id
    );

  return adminView(
    user.tenantId,
    complaint
  );
}

// =====================================================
// ADMIN: UPDATE
// =====================================================

async function updateComplaint(
  user,
  id,
  body = {}
) {
  const {
    tenantId,
    userId,
  } = user;

  const current =
    await findOrThrow(
      tenantId,
      id
    );

  const data = {};

  if (
    body.category !==
    undefined
  ) {
    data.category =
      requireEnum(
        body.category,
        C.CATEGORIES,
        "category"
      );

    if (
      body.department ===
      undefined
    ) {
      data.department =
        C.CATEGORY_DEPARTMENT[
          data.category
        ];
    }
  }

  if (
    body.priority !==
    undefined
  ) {
    data.priority =
      requireEnum(
        body.priority,
        C.PRIORITIES,
        "priority"
      );
  }

  if (
    body.department !==
    undefined
  ) {
    if (
      !C.DEPARTMENTS.includes(
        body.department
      )
    ) {
      throw new HttpError(
        400,
        "Invalid department"
      );
    }

    data.department =
      body.department;
  }

  let becameResolved =
    false;

  if (
    body.status !==
    undefined
  ) {
    const status =
      requireEnum(
        body.status,
        C.STATUSES,
        "status"
      );

    data.status = status;

    data.resolvedAt =
      status === "RESOLVED"
        ? current.resolvedAt ||
          new Date()
        : null;

    becameResolved =
      status === "RESOLVED" &&
      current.status !==
        "RESOLVED";
  }

  if (
    !Object.keys(data).length
  ) {
    throw new HttpError(
      400,
      "Nothing to update"
    );
  }

  data.handledById =
    userId;

  const updated =
    await prisma.complaint.update({
      where: {
        id: current.id,
      },

      data,
    });

  if (becameResolved) {
     await notifyComplaintOwner(
      updated,
      `Complaint ${ticketNo(
        updated.id
      )} resolved`,
      `Your complaint "${updated.subject}" has been marked as resolved.`
    );
  }

  return adminView(
    tenantId,
    updated
  );
}

// =====================================================
// ADMIN: REANALYZE
// =====================================================

async function reanalyzeComplaint(
  user,
  id
) {
  const current =
    await findOrThrow(
      user.tenantId,
      id
    );

  const updated =
    await runAnalysis(
      current.id,
      user.tenantId,
      {
        allowFallback: false,
      }
    );

  return adminView(
    user.tenantId,
    updated
  );
}

// =====================================================
// ADMIN: AI SUGGESTION
// =====================================================

async function decideSuggestion(
  user,
  id,
  body = {}
) {
  const {
    tenantId,
    userId,
  } = user;

  const current =
    await findOrThrow(
      tenantId,
      id
    );

  const decision =
    requireEnum(
      body.decision,
      C.SUGGESTION_DECISIONS,
      "decision"
    );

  const text =
    clean(body.resolution);

  if (
    text.length >
    C.LIMITS.resolutionMax
  ) {
    throw new HttpError(
      400,
      `Resolution must be ${C.LIMITS.resolutionMax} characters or fewer`
    );
  }

  const data = {
    handledById: userId,
  };

  if (decision === "ACCEPT") {
    if (
      !current.aiSuggestedResolution
    ) {
      throw new HttpError(
        400,
        "There is no AI suggestion to accept"
      );
    }

    data.suggestionStatus =
      "ACCEPTED";

    data.finalResolution =
      current.aiSuggestedResolution;
  } else if (
    decision === "MODIFY"
  ) {
    if (text.length < 5) {
      throw new HttpError(
        400,
        "Please enter the modified resolution"
      );
    }

    data.suggestionStatus =
      "MODIFIED";

    data.finalResolution =
      text;
  } else {
    data.suggestionStatus =
      "REJECTED";

    data.finalResolution =
      text || null;
  }

  if (
    decision !== "REJECT" &&
    current.status === "PENDING"
  ) {
    data.status =
      "IN_PROGRESS";
  }

  const updated =
    await prisma.complaint.update({
      where: {
        id: current.id,
      },

      data,
    });

  return adminView(
    tenantId,
    updated
  );
}

// =====================================================
// ADMIN: GENERATE REPLY
// =====================================================

async function generateReplyDraft(
  user,
  id,
  body = {}
) {
  const {
    tenantId,
  } = user;

  const complaint =
    await findOrThrow(
      tenantId,
      id
    );

  const context =
    await loadContext(
      tenantId,
      [complaint]
    );

  const student =
    context.students.get(
      complaint.studentId
    );

  // Only admin-approved resolution
  // is used for generated replies.
  const resolution =
    clean(body.resolution)
      .slice(
        0,
        C.LIMITS.resolutionMax
      ) ||
    complaint.finalResolution ||
    "";

  try {
    const reply =
      await generateReply({
        subject:
          complaint.subject,

        description:
          complaint.description,

        statusLabel:
          STATUS_LABEL[
            complaint.status
          ],

        resolution,

        studentName:
          student?.studentName,

        tone: body.tone,

        language:
          body.language,
      });

    return {
      reply,
    };
  } catch (error) {
    console.error(
      `[complaint] reply generation failed for #${complaint.id}:`,
      error.message
    );

    throw new HttpError(
      502,
      "The AI service could not write a reply right now. Please try again."
    );
  }
}

// =====================================================
// ADMIN: SEND REPLY
// =====================================================

async function sendReply(
  user,
  id,
  body = {}
) {
  const {
    tenantId,
    userId,
  } = user;

  const current =
    await findOrThrow(
      tenantId,
      id
    );

  const reply =
    clean(body.reply);

  if (
    reply.length <
    C.LIMITS.replyMin
  ) {
    throw new HttpError(
      400,
      "Please write a reply before sending"
    );
  }

  if (
    reply.length >
    C.LIMITS.replyMax
  ) {
    throw new HttpError(
      400,
      `Reply must be ${C.LIMITS.replyMax} characters or fewer`
    );
  }

  const data = {
    adminReply: reply,
    repliedAt: new Date(),
    handledById: userId,
  };

  const markResolved =
    body.markResolved === true;

  if (markResolved) {
    data.status =
      "RESOLVED";

    data.resolvedAt =
      current.resolvedAt ||
      new Date();
  } else if (
    current.status ===
    "PENDING"
  ) {
    data.status =
      "IN_PROGRESS";
  }

  const updated =
    await prisma.complaint.update({
      where: {
        id: current.id,
      },

      data,
    });

  await notifyComplaintOwner(
    updated,
    `Reply to complaint ${ticketNo(
      updated.id
    )}`,
    `The school has replied to your complaint "${updated.subject}". Open My complaints to read it.`
  );

  return adminView(
    tenantId,
    updated
  );
}

// =====================================================
// ANALYTICS
// =====================================================

const average = (
  values
) =>
  values.length
    ? Math.round(
        (values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
          values.length) *
          10
      ) / 10
    : null;

async function getAnalytics(
  user,
  query = {}
) {
  const {
    tenantId,
  } = user;

  const rangeDays = [
    "7",
    "30",
    "90",
    "365",
  ].includes(
    String(query.range)
  )
    ? parseInt(
        query.range,
        10
      )
    : query.range === "all"
    ? null
    : 30;

  const where = rangeDays
    ? {
        tenantId,

        createdAt: {
          gte: new Date(
            Date.now() -
              rangeDays *
                86400000
          ),
        },
      }
    : {
        tenantId,
      };

  const group = (by) =>
    prisma.complaint.groupBy({
      by: [by],
      where,
      _count: {
        _all: true,
      },
    });

  const [
    byStatus,
    byCategory,
    byPriority,
    bySentiment,
    topIssues,
    rows,
    criticalOpen,
  ] = await Promise.all([
    group("status"),

    group("category"),

    group("priority"),

    group("sentiment"),

    prisma.complaint.groupBy({
      by: ["issueTag"],

      where: {
        ...where,

        issueTag: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          issueTag: "desc",
        },
      },

      take: 8,
    }),

    prisma.complaint.findMany({
      where,

      select: {
        department: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),

    // Always current, not limited
    // by the selected range.
    prisma.complaint.count({
      where: {
        tenantId,
        priority: "CRITICAL",
        status: {
          in: C.OPEN_STATUSES,
        },
      },
    }),
  ]);

  const toMap = (
    groups,
    key
  ) =>
    new Map(
      groups.map(
        (group) => [
          group[key],
          group._count._all,
        ]
      )
    );

  const fill = (
    keys,
    groups,
    key
  ) => {
    const counts =
      toMap(groups, key);

    return keys.map(
      (item) => ({
        key: item,
        count:
          counts.get(item) ||
          0,
      })
    );
  };

  const statusCounts =
    toMap(
      byStatus,
      "status"
    );

  const total =
    [
      ...statusCounts.values(),
    ].reduce(
      (sum, number) =>
        sum + number,
      0
    );

  const resolved =
    statusCounts.get(
      "RESOLVED"
    ) || 0;

  const hoursToResolve =
    (row) =>
      (
        new Date(
          row.resolvedAt
        ) -
        new Date(
          row.createdAt
        )
      ) /
      3600000;

  const resolvedRows =
    rows.filter(
      (row) =>
        row.status ===
          "RESOLVED" &&
        row.resolvedAt
    );

  // ===================================================
  // DEPARTMENT PERFORMANCE
  // ===================================================

  const departments =
    new Map();

  for (const row of rows) {
    if (
      !departments.has(
        row.department
      )
    ) {
      departments.set(
        row.department,
        {
          department:
            row.department,

          total: 0,
          open: 0,
          resolved: 0,
          hours: [],
        }
      );
    }

    const entry =
      departments.get(
        row.department
      );

    entry.total += 1;

    if (
      C.OPEN_STATUSES.includes(
        row.status
      )
    ) {
      entry.open += 1;
    }

    if (
      row.status ===
      "RESOLVED"
    ) {
      entry.resolved += 1;

      if (row.resolvedAt) {
        entry.hours.push(
          hoursToResolve(row)
        );
      }
    }
  }

  return {
    range: rangeDays
      ? String(rangeDays)
      : "all",

    totals: {
      total,

      pending:
        statusCounts.get(
          "PENDING"
        ) || 0,

      inProgress:
        statusCounts.get(
          "IN_PROGRESS"
        ) || 0,

      resolved,

      closed:
        statusCounts.get(
          "CLOSED"
        ) || 0,

      criticalOpen,

      resolutionRate: total
        ? Math.round(
            (resolved / total) *
              100
          )
        : 0,
    },

    avgResolutionHours:
      average(
        resolvedRows.map(
          hoursToResolve
        )
      ),

    byCategory: fill(
      C.CATEGORIES,
      byCategory,
      "category"
    ),

    byPriority: fill(
      C.PRIORITIES,
      byPriority,
      "priority"
    ),

    bySentiment: fill(
      C.SENTIMENTS,
      bySentiment,
      "sentiment"
    ),

    topIssues:
      topIssues.map(
        (group) => ({
          issue: capitalize(
            group.issueTag
          ),

          count:
            group._count._all,
        })
      ),

    departments:
      [
        ...departments.values(),
      ]
        .map(
          ({
            hours,
            ...department
          }) => ({
            ...department,

            avgResolutionHours:
              average(hours),

            resolutionRate:
              department.total
                ? Math.round(
                    (department.resolved /
                      department.total) *
                      100
                  )
                : 0,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        ),
  };
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createComplaint,
  listMyComplaints,
  getMyComplaint,
  listComplaints,
  getComplaint,
  updateComplaint,
  reanalyzeComplaint,
  decideSuggestion,
  generateReplyDraft,
  sendReply,
  getAnalytics,
};