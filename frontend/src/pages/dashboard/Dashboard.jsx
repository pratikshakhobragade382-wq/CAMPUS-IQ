/**
 * Dashboard Page
 * Fully dynamic — pulls live data from /dashboard/summary
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  DollarSign,
  Activity,
  AlertCircle,
  Calendar,
  PartyPopper,
  RefreshCw,
} from 'lucide-react';

import { StatCard } from '../../components/cards/StatCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/Card';

import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { getDashboardSummary } from '../../api/dashboard.api';
import { ROUTES } from '../../utils/constants';

/*
 * ============================================================
 * ACTIVITY ICONS
 * ============================================================
 */

const ACTIVITY_ICON = {
  student: {
    icon: Users,
    color: 'blue',
  },

  fee: {
    icon: DollarSign,
    color: 'green',
  },

  staff: {
    icon: UserCheck,
    color: 'purple',
  },
};

/*
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

function timeAgo(dateStr) {
  const diffMs =
    Date.now() - new Date(dateStr).getTime();

  const mins = Math.floor(
    diffMs / 60000
  );

  if (mins < 1) {
    return 'just now';
  }

  if (mins < 60) {
    return `${mins} min ago`;
  }

  const hrs = Math.floor(
    mins / 60
  );

  if (hrs < 24) {
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(
    hrs / 24
  );

  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatEventDate(dateStr) {
  return new Date(
    dateStr
  ).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/*
 * Calculate how many complete calendar days
 * remain until the holiday.
 *
 * Using date-only values avoids timezone-related
 * "one day off" issues.
 */
function getDaysRemaining(dateStr) {
  const target = new Date(dateStr);

  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const today = new Date();

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.max(
    0,
    Math.round(
      (targetDate - todayDate) /
        86400000
    )
  );
}

/*
 * ============================================================
 * LOADING SKELETON
 * ============================================================
 */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[120px] animate-pulse" />
  );
}

/*
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /*
   * ============================================================
   * FETCH DASHBOARD DATA
   * ============================================================
   */

  const fetchSummary =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const res =
          await getDashboardSummary();

        setData(res.data);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /*
   * ============================================================
   * ERROR STATE
   * ============================================================
   */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />

        <p className="text-gray-700">
          {error}
        </p>

        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.stats;

  const trend = (value) =>
    value >= 0 ? 'up' : 'down';

  const trendLabel = (value) =>
    `${value >= 0 ? '+' : ''}${value}%`;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening
            at your school today.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />
        </button>
      </div>

      {/* ======================================================
          STATISTICS CARDS
          ====================================================== */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading || !stats ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Students"
              value={stats.totalStudents.toString()}
              icon={Users}
              trend={trend(
                stats.studentsTrend
              )}
              trendValue={trendLabel(
                stats.studentsTrend
              )}
              color="blue"
            />

            <StatCard
              title="Total Teachers"
              value={stats.totalTeachers.toString()}
              icon={UserCheck}
              trend={trend(
                stats.teachersTrend
              )}
              trendValue={trendLabel(
                stats.teachersTrend
              )}
              color="green"
            />

            <StatCard
  title="Total Complaints"
  value={stats.totalComplaints.toString()}
  icon={AlertCircle}
  trend={trend(
    stats.complaintsTrend
  )}
  trendValue={trendLabel(
    stats.complaintsTrend
  )}
  color="purple"
/>

            <StatCard
              title="Fees Collected (This Month)"
              value={`₹${Math.round(
                stats.feesCollectedThisMonth /
                  1000
              )}K`}
              icon={DollarSign}
              trend={trend(
                stats.feesTrend
              )}
              trendValue={trendLabel(
                stats.feesTrend
              )}
              color="yellow"
            />
          </>
        )}
      </div>

      {/* ======================================================
          NEXT HOLIDAY + STUDENT DISTRIBUTION
          ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ====================================================
            NEXT HOLIDAY
            ==================================================== */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Next Holiday
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="h-[300px] rounded-xl bg-sky-50 animate-pulse" />
            ) : data?.nextHoliday ? (
              <div className="h-[300px] flex items-center">
                <div className="w-full rounded-2xl border border-sky-100 bg-sky-50 p-8">

                  <div className="flex items-center gap-5">

                    {/* Holiday Icon */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-100">
                      <PartyPopper className="h-8 w-8 text-sky-600" />
                    </div>

                    {/* Holiday Details */}
                    <div>
                      <p className="text-sm font-medium text-sky-600">
                        Upcoming Holiday
                      </p>

                      <h3 className="mt-1 text-2xl font-bold text-gray-900">
                        {data.nextHoliday.name}
                      </h3>

                      <p className="mt-2 text-sm text-gray-600">
                        {formatEventDate(
                          data.nextHoliday.date
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Days Remaining */}
                  <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-700 border border-sky-100">
                    {getDaysRemaining(
                      data.nextHoliday.date
                    ) === 0
                      ? 'Today'
                      : `In ${getDaysRemaining(
                          data.nextHoliday.date
                        )} day${
                          getDaysRemaining(
                            data.nextHoliday.date
                          ) === 1
                            ? ''
                            : 's'
                        }`}
                  </div>

                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <PartyPopper className="w-10 h-10 text-gray-300 mb-3" />

                <p className="text-sm text-gray-400">
                  No upcoming holidays
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ====================================================
            STUDENT DISTRIBUTION
            ==================================================== */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Student Distribution
            </CardTitle>
          </CardHeader>

          <CardContent>

            {/* Total Students */}
            <div className="mb-5 flex items-center justify-between rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">
                Total Students
              </span>

              <span className="text-xl font-bold text-sky-600">
                {stats?.totalStudents ?? 0}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="animate-pulse"
                    >
                      <div className="flex justify-between mb-2">
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                        <div className="h-4 w-6 bg-gray-100 rounded" />
                      </div>

                      <div className="h-2 bg-sky-50 rounded-full" />
                    </div>
                  )
                )}
              </div>
            ) : data?.studentDistribution
                ?.length ? (
              <div className="max-h-[230px] space-y-4 overflow-y-auto pr-1">

                {data.studentDistribution.map(
                  (item) => {
                    const total =
                      stats?.totalStudents ||
                      0;

                    const percentage =
                      total > 0
                        ? Math.round(
                            (item.value /
                              total) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={item.name}
                      >
                        {/* Class name + count */}
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium text-gray-700">
                            {item.name}
                          </span>

                          <span className="text-sm font-semibold text-gray-900">
                            {item.value}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        {/* Percentage */}
                        <div className="mt-1 text-right">
                          <span className="text-[11px] text-gray-400">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}

              </div>
            ) : (
              <div className="h-[230px] flex items-center justify-center text-sm text-gray-400 text-center">
                No student distribution available
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* ======================================================
          FEE COLLECTION & FEE SUMMARY
          ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Fee Collection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Fee Collection (Last 6 Months)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={
                  data?.feeCollectionTrend ||
                  []
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{
                    fontSize: '12px',
                  }}
                />

                <YAxis
                  stroke="#6b7280"
                  style={{
                    fontSize: '12px',
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) =>
                    `₹${value.toLocaleString(
                      'en-IN'
                    )}`
                  }
                />

                <Bar
                  dataKey="collected"
                  fill="#10b981"
                  name="Collected"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fee Summary
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>
                <Pie
                  data={
                    data?.feeSummary ||
                    []
                  }
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  label
                >
                  {(
                    data?.feeSummary ||
                    []
                  ).map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    `₹${value.toLocaleString(
                      'en-IN'
                    )}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================
          RECENT ACTIVITIES & QUICK ACTIONS
          ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Recent Activities
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">

              {data?.recentActivities
                ?.length ? (
                data.recentActivities.map(
                  (
                    activity,
                    idx
                  ) => {
                    const meta =
                      ACTIVITY_ICON[
                        activity.type
                      ] ||
                      ACTIVITY_ICON.student;

                    const Icon =
                      meta.icon;

                    return (
                      <div
                        key={idx}
                        className="flex gap-4 pb-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div
                          className={`p-2 rounded-lg bg-${meta.color}-100 text-${meta.color}-600`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            {activity.desc}
                          </p>
                        </div>

                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {timeAgo(
                            activity.time
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <p className="text-sm text-gray-400">
                  No recent activity yet
                </p>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Quick Actions + Upcoming Events */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">

              <button
                onClick={() =>
                  navigate(
                    ROUTES.STUDENT
                  )
                }
                className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
              >
                + Add Student
              </button>

              <button
                onClick={() =>
                  navigate(
                    ROUTES.STAFF
                  )
                }
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                + Add Staff
              </button>

              <button
                onClick={() =>
                  navigate(
                    ROUTES.ATTENDANCE
                  )
                }
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Mark Attendance
              </button>

              <button
                onClick={() =>
                  navigate(
                    ROUTES.FEE
                  )
                }
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Collect Fees
              </button>

            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Upcoming Events
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              {data?.upcomingEvents
                ?.length ? (
                data.upcomingEvents.map(
                  (
                    event,
                    idx
                  ) => {
                    const Icon =
                      event.kind ===
                      'holiday'
                        ? PartyPopper
                        : Calendar;

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3"
                      >
                        <Icon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatEventDate(
                              event.date
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <p className="text-sm text-gray-400">
                  No upcoming events
                </p>
              )}

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}