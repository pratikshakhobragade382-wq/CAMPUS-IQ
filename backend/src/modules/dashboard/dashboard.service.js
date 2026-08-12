const prisma = require('../../prisma/prismaClient');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
const toNum = (d) => (d == null ? 0 : Number(d));

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function getSummary(tenantId) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -6);
  const monthStart = startOfMonth(now);
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const thirtyDaysAgo = addDays(todayStart, -30);
  const sixMonthsAgo = addDays(todayStart, -180);

  const [
    totalStudents,
    newStudents30,
    totalTeachers,
    newTeachers30,
    presentToday,
    weekAttendanceRows,
    feesThisMonthAgg,
    feesLastMonthAgg,
    feeCollectionRows,
    feeStructures,
    studentsWithDept,
    recentStudents,
    recentFees,
    recentStaff,
    upcomingHolidays,
    upcomingExams,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId, isDeleted: false } }),
    prisma.student.count({ where: { tenantId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.staff.count({ where: { tenantId, isDeleted: false, role: 'teacher' } }),
    prisma.staff.count({ where: { tenantId, isDeleted: false, role: 'teacher', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.studentAttendance.count({ where: { tenantId, date: { gte: todayStart, lt: tomorrowStart }, status: 'present' } }),
    prisma.studentAttendance.findMany({
      where: { tenantId, date: { gte: weekStart, lt: tomorrowStart } },
      select: { date: true, status: true },
    }),
    prisma.feeCollection.aggregate({ where: { tenantId, paymentDate: { gte: monthStart } }, _sum: { netAmount: true } }),
    prisma.feeCollection.aggregate({ where: { tenantId, paymentDate: { gte: lastMonthStart, lt: monthStart } }, _sum: { netAmount: true } }),
    prisma.feeCollection.findMany({
      where: { tenantId, paymentDate: { gte: sixMonthsAgo } },
      select: { paymentDate: true, netAmount: true },
    }),
    prisma.feeStructure.findMany({
      where: { tenantId, isActive: true },
      select: { amount: true, classId: true, class: { select: { _count: { select: { students: { where: { isDeleted: false } } } } } } },
    }),
    prisma.student.findMany({
      where: { tenantId, isDeleted: false },
      select: { class: { select: { department: { select: { name: true } } } } },
    }),
    prisma.student.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { studentName: true, createdAt: true, class: { select: { name: true } } },
    }),
    prisma.feeCollection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { netAmount: true, createdAt: true, student: { select: { studentName: true } } },
    }),
    prisma.staff.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { name: true, role: true, createdAt: true },
    }),
    prisma.holiday.findMany({
      where: { tenantId, date: { gte: todayStart } },
      orderBy: { date: 'asc' },
      take: 4,
      select: { name: true, date: true },
    }),
    prisma.exam.findMany({
      where: { tenantId, startDate: { gte: todayStart } },
      orderBy: { startDate: 'asc' },
      take: 3,
      select: { name: true, startDate: true },
    }),
  ]);

  // ---- Growth trends ----
  const baselineStudents = totalStudents - newStudents30;
  const studentsTrend = percentChange(totalStudents, baselineStudents);
  const baselineTeachers = totalTeachers - newTeachers30;
  const teachersTrend = percentChange(totalTeachers, baselineTeachers);

  // ---- Weekly attendance chart (Mon-Sun, last 7 days) ----
  const byDate = {};
  for (const row of weekAttendanceRows) {
    const key = row.date.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { present: 0, absent: 0, late: 0 };
    if (row.status === 'present') byDate[key].present++;
    else if (row.status === 'absent') byDate[key].absent++;
    else if (row.status === 'late') byDate[key].late++;
  }
  const weeklyAttendance = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(todayStart, -i);
    const key = d.toISOString().slice(0, 10);
    const bucket = byDate[key] || { present: 0, absent: 0, late: 0 };
    weeklyAttendance.push({ name: DAY_LABELS[d.getDay()], ...bucket });
  }

  const todayPct = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;
  const otherDaysPct = weeklyAttendance.slice(0, -1).map((d) =>
    totalStudents > 0 ? ((d.present) / totalStudents) * 100 : 0
  );
  const avgPrevPct = otherDaysPct.length
    ? otherDaysPct.reduce((a, b) => a + b, 0) / otherDaysPct.length
    : 0;
  const attendanceTrend = percentChange(todayPct, Math.round(avgPrevPct));

  // ---- Fees this month vs last month ----
  const feesThisMonth = toNum(feesThisMonthAgg._sum.netAmount);
  const feesLastMonth = toNum(feesLastMonthAgg._sum.netAmount);
  const feesTrend = percentChange(feesThisMonth, feesLastMonth);

  // ---- Fee collection trend, last 6 months ----
  const monthBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({ year: d.getFullYear(), month: d.getMonth(), name: MONTH_LABELS[d.getMonth()], collected: 0 });
  }
  for (const row of feeCollectionRows) {
    const d = new Date(row.paymentDate);
    const bucket = monthBuckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) bucket.collected += toNum(row.netAmount);
  }
  const feeCollectionTrend = monthBuckets.map(({ name, collected }) => ({ name, collected: Math.round(collected) }));

  // ---- Fee summary: paid (all-time collected) vs pending (expected - collected) ----
  const totalExpected = feeStructures.reduce(
    (sum, fs) => sum + toNum(fs.amount) * (fs.class?._count?.students || 0),
    0
  );
  const totalCollectedAllTime = feeCollectionRows.reduce((s, r) => s + toNum(r.netAmount), 0)
    + 0; // feeCollectionRows only covers last 6 months; get true all-time separately below
  const totalCollectedAggAll = await prisma.feeCollection.aggregate({ where: { tenantId }, _sum: { netAmount: true } });
  const collectedAllTime = toNum(totalCollectedAggAll._sum.netAmount);
  const pending = Math.max(totalExpected - collectedAllTime, 0);
  const feeSummary = [
    { name: 'Paid', value: Math.round(collectedAllTime), fill: '#10b981' },
    { name: 'Pending', value: Math.round(pending), fill: '#f59e0b' },
  ];

  // ---- Department distribution ----
  const deptMap = {};
  for (const s of studentsWithDept) {
    const name = s.class?.department?.name || 'Unassigned';
    deptMap[name] = (deptMap[name] || 0) + 1;
  }
  const departmentDistribution = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // ---- Recent activities (merged, sorted) ----
  const activities = [
    ...recentStudents.map((s) => ({
      type: 'student',
      title: 'New student admission',
      desc: `${s.studentName} added to ${s.class?.name || 'a class'}`,
      time: s.createdAt,
    })),
    ...recentFees.map((f) => ({
      type: 'fee',
      title: 'Fee payment received',
      desc: `${f.student?.studentName || 'A student'} paid ₹${toNum(f.netAmount).toLocaleString('en-IN')}`,
      time: f.createdAt,
    })),
    ...recentStaff.map((s) => ({
      type: 'staff',
      title: 'Staff appointment',
      desc: `${s.name} joined${s.role ? ` as ${s.role}` : ''}`,
      time: s.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);

  // ---- Upcoming events (holidays + exams) ----
  const upcomingEvents = [
    ...upcomingHolidays.map((h) => ({ title: h.name, date: h.date, kind: 'holiday' })),
    ...upcomingExams.map((e) => ({ title: e.name, date: e.startDate, kind: 'exam' })),
  ]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  return {
    stats: {
      totalStudents,
      studentsTrend,
      totalTeachers,
      teachersTrend,
      todayAttendancePercentage: todayPct,
      attendanceTrend,
      feesCollectedThisMonth: Math.round(feesThisMonth),
      feesTrend,
    },
    weeklyAttendance,
    feeCollectionTrend,
    feeSummary,
    departmentDistribution,
    recentActivities: activities,
    upcomingEvents,
  };
}

module.exports = { getSummary };