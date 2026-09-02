const prisma = require("../../prisma/prismaClient");

const getBotReply = async (message, user = {}) => {
  const text = message.toLowerCase().trim();

  // =====================================================
  // SMART NATURAL LANGUAGE NORMALIZER
  // =====================================================

  let normalizedText = text;

  if (
    text.includes("meri attendance") ||
    text.includes("attendance percentage") ||
    text.includes("attendance kitni")
  ) {
    normalizedText = "attendance";
  }

  if (
    text.includes("aaj ka timetable") ||
    text.includes("today classes") ||
    text.includes("today's classes")
  ) {
    normalizedText = "today timetable";
  }

  if (
    text.includes("next class") ||
    text.includes("meri next class")
  ) {
    normalizedText = "next period";
  }

  if (
    text.includes("fee kitni") ||
    text.includes("fees paid") ||
    text.includes("payment details")
  ) {
    normalizedText = "fees";
  }

  if (
    text.includes("exam kab") ||
    text.includes("next exam")
  ) {
    normalizedText = "exam";
  }

  if (
    text.includes("holiday kab") ||
    text.includes("upcoming holiday")
  ) {
    normalizedText = "holiday";
  }

  const { userId, tenantId } = user;

  try {
    // =====================================================
    // GREETING
    // =====================================================

    if (["hi", "hello", "hey"].includes(text)) {
      return "👋 Hello! I'm CampusIQ Assistant. You can ask me about attendance, fees, timetable, holidays or exams.";
    }

    // =====================================================
    // ATTENDANCE
    // =====================================================

    if (normalizedText.includes("attendance")) {
      if (!userId || !tenantId) {
        return "Please login to view your attendance.";
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

      if (!student) {
        return "Student profile not found.";
      }

      const total = await prisma.studentAttendance.count({
        where: {
          studentId: student.id,
          tenantId,
        },
      });

      const present = await prisma.studentAttendance.count({
        where: {
          studentId: student.id,
          tenantId,
          status: "present",
        },
      });

      if (total === 0) {
        return "No attendance records found.";
      }

      const percentage = ((present / total) * 100).toFixed(1);

      return `Your attendance is ${percentage}% (${present}/${total} days present).`;
    }

    // =====================================================
    // FEES
    // =====================================================

    if (
      normalizedText.includes("fee") ||
      normalizedText.includes("fees") ||
      normalizedText.includes("payment")
    ) {
      if (!userId || !tenantId) {
        return "Please login to view your fee details.";
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          id: true,
          studentName: true,
        },
      });

      if (!student) {
        return "Student profile not found.";
      }

      const collections = await prisma.feeCollection.findMany({
        where: {
          tenantId,
          studentId: student.id,
        },
        select: {
          netAmount: true,
          paymentDate: true,
          receiptNo: true,
        },
        orderBy: {
          paymentDate: "desc",
        },
      });

      if (!collections.length) {
        return "No fee payment records found.";
      }

      const paid = collections.reduce(
        (sum, item) => sum + Number(item.netAmount || 0),
        0
      );

      const latest = collections[0];

      return `Fee summary for ${student.studentName}

Total Paid: ₹${paid}

Last Payment:
Receipt: ${latest.receiptNo}
Amount: ₹${latest.netAmount}
Date: ${new Date(latest.paymentDate).toLocaleDateString("en-IN")}`;
    }

    // =====================================================
    // TODAY'S TIMETABLE
    // =====================================================

    if (
      normalizedText.includes("today timetable") ||
      normalizedText.includes("today's timetable") ||
      normalizedText.includes("today schedule")
    ) {
      if (!userId || !tenantId) {
        return "Please login to view today's timetable.";
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          classId: true,
          sectionId: true,
        },
      });

      if (!student) {
        return "Student profile not found.";
      }

      const today = new Date().getDay();

      const dayMap = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
      };

      if (!dayMap[today]) {
        return "Today is Sunday. No classes today.";
      }

      const timetable = await prisma.timetable.findMany({
        where: {
          tenantId,
          classId: student.classId,
          ...(student.sectionId ? { sectionId: student.sectionId } : {}),
          dayOfWeek: today,
          isActive: true,
        },
        include: {
          subject: true,
          periodSlot: true,
        },
        orderBy: {
          periodSlot: {
            slotNo: "asc",
          },
        },
      });

      if (!timetable.length) {
        return `No classes scheduled for ${dayMap[today]}.`;
      }

      const formatted = timetable
        .map(
          (t) =>
            `Period ${t.periodSlot.slotNo} • ${t.subject.name} (${t.periodSlot.startTime}-${t.periodSlot.endTime})`
        )
        .join("\n");

      return `Today's Timetable (${dayMap[today]})

${formatted}`;
    }

    // =====================================================
    // NEXT PERIOD
    // =====================================================

    if (
      normalizedText.includes("next period") ||
      normalizedText.includes("next class")
    ) {
      if (!userId || !tenantId) {
        return "Please login to view your next class.";
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          classId: true,
          sectionId: true,
        },
      });

      if (!student) {
        return "Student profile not found.";
      }

      const now = new Date();
      const today = now.getDay();

      if (today === 0) {
        return "Today is Sunday. No classes today.";
      }

      const currentTime = now.toTimeString().slice(0, 5);

      const periods = await prisma.timetable.findMany({
        where: {
          tenantId,
          classId: student.classId,
          ...(student.sectionId ? { sectionId: student.sectionId } : {}),
          dayOfWeek: today,
          isActive: true,
        },
        include: {
          subject: true,
          periodSlot: true,
        },
        orderBy: {
          periodSlot: {
            slotNo: "asc",
          },
        },
      });

      const next = periods.find(
        (p) => p.periodSlot.startTime > currentTime
      );

      if (!next) {
        return "No more classes left for today.";
      }

      return `Your next class is ${next.subject.name} (Period ${next.periodSlot.slotNo}) from ${next.periodSlot.startTime} to ${next.periodSlot.endTime}.`;
    }

    // =====================================================
    // FULL TIMETABLE
    // =====================================================

    if (
      normalizedText.includes("timetable") ||
      normalizedText.includes("time table") ||
      normalizedText.includes("schedule")
    ) {
      if (!userId || !tenantId) {
        return "Please login to view your timetable.";
      }

      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          isDeleted: false,
        },
        select: {
          classId: true,
          sectionId: true,
        },
      });

      if (!student) {
        return "Student profile not found.";
      }

      const timetable = await prisma.timetable.findMany({
        where: {
          tenantId,
          classId: student.classId,
          isActive: true,
          ...(student.sectionId ? { sectionId: student.sectionId } : {}),
        },
        include: {
          subject: {
            select: {
              name: true,
            },
          },
          periodSlot: {
            select: {
              label: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: [
          {
            dayOfWeek: "asc",
          },
          {
            periodSlotId: "asc",
          },
        ],
      });

      if (!timetable.length) {
        return "No timetable found for your class.";
      }

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const formatted = timetable
        .slice(0, 8)
        .map((t) => {
          const subjectName = t.subject?.name || "Subject";

          return `${days[t.dayOfWeek]} • ${t.periodSlot.label} • ${subjectName} (${t.periodSlot.startTime}-${t.periodSlot.endTime})`;
        })
        .join("\n");

      return `Your timetable:

${formatted}`;
    }

    // =====================================================
    // HOLIDAYS
    // =====================================================

    if (
      normalizedText.includes("holiday") ||
      normalizedText.includes("holidays") ||
      normalizedText.includes("vacation")
    ) {
      const holidays = await prisma.holiday.findMany({
        where: {
          tenantId,
          date: {
            gte: new Date(),
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 5,
      });

      if (!holidays.length) {
        return "No upcoming holidays.";
      }

      return (
        "Upcoming holidays:\n\n" +
        holidays
          .map(
            (h) =>
              `${new Date(h.date).toLocaleDateString("en-IN")} - ${h.name}`
          )
          .join("\n")
      );
    }

    // =====================================================
    // EXAMS
    // =====================================================

    if (normalizedText.includes("exam")) {
      const exams = await prisma.exam.findMany({
        where: {
          tenantId,
          startDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: 5,
      });

      if (!exams.length) {
        return "No upcoming exams.";
      }

      return (
        "Upcoming exams:\n\n" +
        exams
          .map(
            (e) =>
              `${new Date(e.startDate).toLocaleDateString("en-IN")} - ${e.name}`
          )
          .join("\n")
      );
    }

    // =====================================================
    // QA DATABASE
    // =====================================================

    const qaList = await prisma.chatbotQA.findMany();

    for (const qa of qaList) {
      if (!qa.keywords) continue;

      const keywords = qa.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase());

      if (keywords.some((key) => normalizedText.includes(key))) {
        return qa.answer;
      }
    }

    // =====================================================
    // FALLBACK
    // =====================================================

    return "Sorry, I couldn't find that information. Try asking about attendance, fees, timetable, holidays or exams.";
  } catch (error) {
    console.error("Chatbot Service Error:", error);
    return "Sorry, something went wrong while fetching your data.";
  }
};

module.exports = {
  getBotReply,
};