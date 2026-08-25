import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { STUDENTS_DATA } from '../../data/students.js';

export default function Student() {
  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={row.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.admissionNo}</p>
          </div>
        </div>
      ),
    },
    { header: 'Class', accessor: 'class' },
    { header: 'Section', accessor: 'section' },
    { header: 'Parent Name', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Status',
      render: (row) => <StatusBadge variant={row.status === 'active' ? 'green' : 'gray'}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">View</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Student</h1>
          <p className="text-gray-600 mt-1">View and manage student enrolments, classes, and status.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search student..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={STUDENTS_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
