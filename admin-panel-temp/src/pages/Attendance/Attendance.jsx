import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { ATTENDANCE_DATA } from '../../data/attendance.js';

export default function Attendance() {
  const columns = [
    { header: 'Student', accessor: 'studentName' },
    { header: 'Admission No.', accessor: 'admissionNo' },
    { header: 'Date', accessor: 'date' },
    {
      header: 'Status',
      render: (row) => <StatusBadge variant={row.status === 'present' ? 'green' : row.status === 'absent' ? 'red' : 'yellow'}>{row.status}</StatusBadge>,
    },
    { header: 'Remarks', accessor: 'remarks' },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Update</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track today's attendance and past attendance entries.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search attendance..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Mark Attendance
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={ATTENDANCE_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
