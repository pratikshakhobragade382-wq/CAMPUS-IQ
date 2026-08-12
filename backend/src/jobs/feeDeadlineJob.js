// This job runs once a day (see the cron schedule at the bottom) and checks
// whether any fee structure's due day has arrived today. If it has, and
// some students in that class still haven't paid in full, it fires a
// single "Fee Payment Deadline Reached" notification for that fee structure,
// including the names of the students who still owe.

const cron = require('node-cron');
const prisma = require('../prisma/prismaClient');
const { createNotification } = require('../modules/notification/notification.service');

// How many student names to list by name before switching to "+N more".
const MAX_NAMES_IN_MESSAGE = 5;

// Checks fee deadlines for ONE tenant.
async function checkFeeDeadlinesForTenant(tenantId, today) {
  const todayDayOfMonth = today.getDate();

  // Find every active fee structure for this tenant whose due day is today.
  const dueStructures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      isActive: true,
      dueDay: todayDayOfMonth,
    },
    include: {
      feeCategory: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  for (const structure of dueStructures) {
    // Find students belonging to this class (and matching stream/category
    // if the fee structure is restricted to a specific stream/category).
    // NOTE: now also selecting studentName so we can list who still owes.
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        classId: structure.classId,
        isDeleted: false,
        ...(structure.stream && { stream: structure.stream }),
        ...(structure.studentCategory && { category: structure.studentCategory }),
      },
      select: { id: true, studentName: true },
    });

    if (students.length === 0) continue;

    const studentIds = students.map((s) => s.id);

    // Sum up how much each student has already paid toward this fee structure.
    const collections = await prisma.feeCollection.groupBy({
      by: ['studentId'],
      where: {
        tenantId,
        feeStructureId: structure.id,
        studentId: { in: studentIds },
      },
      _sum: { netAmount: true },
    });

    const paidMap = {};
    collections.forEach((c) => {
      paidMap[c.studentId] = parseFloat(c._sum.netAmount || 0);
    });

    const structureAmount = parseFloat(structure.amount);

    // A student "still owes" if they've paid less than the full amount.
    // NEW: keep the actual student objects (not just a count) so we can
    // list their names in the notification message.
    const unpaidStudents = students.filter((student) => {
      const paid = paidMap[student.id] || 0;
      return paid < structureAmount;
    });

    if (unpaidStudents.length === 0) continue; // everyone has paid — nothing to notify about

    // Avoid sending the same notification twice if the job somehow runs
    // more than once on the same day (e.g. server restarted).
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const alreadySentToday = await prisma.notification.findFirst({
      where: {
        tenantId,
        type: 'fee_deadline',
        createdAt: { gte: startOfToday },
        message: { contains: `(Fee Structure #${structure.id})` },
      },
    });

    if (alreadySentToday) continue;

    // NEW: Build a readable list of names, capped so the message doesn't
    // get too long if a whole class hasn't paid.
    const namesToShow = unpaidStudents.slice(0, MAX_NAMES_IN_MESSAGE).map((s) => s.studentName);
    const remainingCount = unpaidStudents.length - namesToShow.length;

    let namesText = namesToShow.join(', ');
    if (remainingCount > 0) {
      namesText += `, and ${remainingCount} more`;
    }

    try {
      await createNotification({
        tenantId,
        title: 'Fee Payment Deadline Reached',
        message: `The due date for "${structure.feeCategory.name}" (${structure.class.name}) has arrived. ${unpaidStudents.length} student(s) have not completed payment yet: ${namesText}. (Fee Structure #${structure.id})`,
        type: 'fee_deadline',
        priority: 'high',
        audience: 'all',
      });
    } catch (notifyErr) {
      console.error('Fee deadline notification failed (non-fatal):', notifyErr);
    }
  }
}

// Runs the deadline check across every tenant that has at least one
// active fee structure.
async function runFeeDeadlineCheck() {
  const today = new Date();

  const tenants = await prisma.feeStructure.findMany({
    where: { isActive: true },
    distinct: ['tenantId'],
    select: { tenantId: true },
  });

  for (const { tenantId } of tenants) {
    try {
      await checkFeeDeadlinesForTenant(tenantId, today);
    } catch (err) {
      console.error(`Fee deadline check failed for tenant ${tenantId}:`, err);
    }
  }
}

// Schedules the job to run once a day at 8:00 AM server time.
// Cron format: minute hour day-of-month month day-of-week
function startFeeDeadlineJob() {
  cron.schedule('* * * * *', () => {
    console.log('Running daily fee deadline check...');
    runFeeDeadlineCheck();
  });

  console.log('Fee deadline job scheduled (runs daily at 8:00 AM).');
}

module.exports = { startFeeDeadlineJob, runFeeDeadlineCheck };