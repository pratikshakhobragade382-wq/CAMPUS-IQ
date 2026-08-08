/**
 * Dashboard Page
 * Main dashboard with statistics and widgets
 */

import React, { useState } from 'react';
import { Users, UserCheck, TrendingUp, DollarSign, FolderOpen, Users2, Activity, AlertCircle, Calendar, Clock } from 'lucide-react';
import { StatCard } from '../../components/cards/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { STUDENTS_DATA } from '../../data/students.js';
import { STAFF_DATA } from '../../data/staff.js';
import { ATTENDANCE_DATA } from '../../data/attendance.js';
import { FEE_DATA } from '../../data/fee.js';

export default function Dashboard() {
  // Calculate statistics
  const totalStudents = STUDENTS_DATA.length;
  const totalStaff = STAFF_DATA.length;
  const presentToday = ATTENDANCE_DATA.filter(a => a.date === '2024-08-08' && a.status === 'present').length;
  const attendancePercentage = Math.round((presentToday / STUDENTS_DATA.length) * 100);
  const feesCollected = FEE_DATA.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = FEE_DATA.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);

  // Chart data
  const attendanceData = [
    { name: 'Mon', present: 35, absent: 3, late: 2 },
    { name: 'Tue', present: 38, absent: 0, late: 2 },
    { name: 'Wed', present: 37, absent: 1, late: 2 },
    { name: 'Thu', present: 39, absent: 0, late: 1 },
    { name: 'Fri', present: 36, absent: 2, late: 2 },
    { name: 'Sat', present: 38, absent: 0, late: 2 },
  ];

  const feeData = [
    { name: 'Paid', value: 150000, fill: '#10b981' },
    { name: 'Pending', value: 75000, fill: '#f59e0b' },
    { name: 'Overdue', value: 50000, fill: '#ef4444' },
  ];

  const feeCollectionData = [
    { name: 'Jun', collected: 120000, pending: 30000 },
    { name: 'Jul', collected: 140000, pending: 35000 },
    { name: 'Aug', collected: 150000, pending: 75000 },
  ];

  const departmentData = [
    { name: 'Science', value: 45 },
    { name: 'Math', value: 42 },
    { name: 'English', value: 38 },
    { name: 'History', value: 35 },
    { name: 'Sports', value: 28 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at your school today.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={totalStudents.toString()}
          icon={Users}
          trend="up"
          trendValue="+5.2%"
          color="blue"
        />
        <StatCard
          title="Total Teachers"
          value={totalStaff.toString()}
          icon={UserCheck}
          trend="up"
          trendValue="+2.1%"
          color="green"
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendancePercentage}%`}
          icon={Activity}
          trend="up"
          trendValue="+1.5%"
          color="purple"
        />
        <StatCard
          title="Fees Collected"
          value={`${Math.round(feesCollected / 1000)}K`}
          icon={DollarSign}
          trend="down"
          trendValue="-2.3%"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceData}>
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
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                  name="Present"
                />
                <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="#ef444420" name="Absent" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#f59e0b20" name="Late" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection & Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fee Collection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  label
                >
                  {feeData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: <Users className="w-4 h-4" />, title: 'New student admission', desc: 'Rahul Sharma was added to class 10-A', time: '10 min ago', color: 'blue' },
                { icon: <FolderOpen className="w-4 h-4" />, title: 'Fee payment received', desc: 'Priya Patel paid ₹5,000 for August', time: '30 min ago', color: 'green' },
                { icon: <AlertCircle className="w-4 h-4" />, title: 'Exam scheduled', desc: 'Mid-term exam scheduled for class 10', time: '1 hour ago', color: 'yellow' },
                { icon: <UserCheck className="w-4 h-4" />, title: 'Staff appointment', desc: 'Mrs. Anjali Desai joined as English teacher', time: '2 hours ago', color: 'purple' },
              ].map((activity, idx) => (
                <div key={idx} className="flex gap-4 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className={`p-2 rounded-lg ${
                    activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    activity.color === 'green' ? 'bg-green-100 text-green-600' :
                    activity.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.desc}</p>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Events */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200">
                + Add Student
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                + Add Staff
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                Mark Attendance
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                Collect Fees
              </button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Mid-Term Exam', date: 'Sep 1, 2024', icon: Calendar },
                { title: 'Parent Meeting', date: 'Aug 15, 2024', icon: Users2 },
                { title: 'Annual Function', date: 'Oct 25, 2024', icon: Activity },
              ].map((event, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <event.icon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
