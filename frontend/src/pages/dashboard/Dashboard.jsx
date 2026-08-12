/**
 * Dashboard Page
 * Fully dynamic — pulls live data from /dashboard/summary
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, DollarSign, Activity, AlertCircle,
  Calendar, PartyPopper, RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../components/cards/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import {
  LineChart, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { getDashboardSummary } from '../../api/dashboard.api';
import { ROUTES } from '../../utils/constants';

const DEPT_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const ACTIVITY_ICON = {
  student: { icon: Users, color: 'blue' },
  fee: { icon: DollarSign, color: 'green' },
  staff: { icon: UserCheck, color: 'purple' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SkeletonCard() {
  return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[120px] animate-pulse" />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardSummary();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-gray-700">{error}</p>
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
  const trend = (v) => (v >= 0 ? 'up' : 'down');
  const trendLabel = (v) => `${v >= 0 ? '+' : ''}${v}%`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at your school today.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading || !stats ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Students"
              value={stats.totalStudents.toString()}
              icon={Users}
              trend={trend(stats.studentsTrend)}
              trendValue={trendLabel(stats.studentsTrend)}
              color="blue"
            />
            <StatCard
              title="Total Teachers"
              value={stats.totalTeachers.toString()}
              icon={UserCheck}
              trend={trend(stats.teachersTrend)}
              trendValue={trendLabel(stats.teachersTrend)}
              color="green"
            />
            <StatCard
              title="Today's Attendance"
              value={`${stats.todayAttendancePercentage}%`}
              icon={Activity}
              trend={trend(stats.attendanceTrend)}
              trendValue={trendLabel(stats.attendanceTrend)}
              color="purple"
            />
            <StatCard
              title="Fees Collected (This Month)"
              value={`₹${Math.round(stats.feesCollectedThisMonth / 1000)}K`}
              icon={DollarSign}
              trend={trend(stats.feesTrend)}
              trendValue={trendLabel(stats.feesTrend)}
              color="yellow"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.weeklyAttendance || []}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="#ef444420" name="Absent" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#f59e0b20" name="Late" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.departmentDistribution?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.departmentDistribution}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={2} dataKey="value"
                  >
                    {data.departmentDistribution.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                No students assigned to departments yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection & Fee Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fee Collection (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.feeCollectionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                />
                <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.feeSummary || []}
                  cx="50%" cy="50%"
                  outerRadius={80} paddingAngle={1}
                  dataKey="value" label
                >
                  {(data?.feeSummary || []).map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentActivities?.length ? (
                data.recentActivities.map((activity, idx) => {
                  const meta = ACTIVITY_ICON[activity.type] || ACTIVITY_ICON.student;
                  const Icon = meta.icon;
                  return (
                    <div key={idx} className="flex gap-4 pb-3 border-b border-gray-100 last:border-b-0">
                      <div className={`p-2 rounded-lg bg-${meta.color}-100 text-${meta.color}-600`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.desc}</p>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(activity.time)}</div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">No recent activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate(ROUTES.STUDENT)}
                className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
              >
                + Add Student
              </button>
              <button
                onClick={() => navigate(ROUTES.STAFF)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                + Add Staff
              </button>
              <button
                onClick={() => navigate(ROUTES.ATTENDANCE)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => navigate(ROUTES.FEE)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Collect Fees
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.upcomingEvents?.length ? (
                data.upcomingEvents.map((event, idx) => {
                  const Icon = event.kind === 'holiday' ? PartyPopper : Calendar;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatEventDate(event.date)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}