import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { SECTIONS_DATA } from '../../data/section.js';

export default function Section() {
  const columns = [
    { header: 'Section Name', accessor: 'name' },
    { header: 'Class', accessor: 'className' },
    { header: 'Class Teacher', accessor: 'classTeacher' },
    { header: 'Students', accessor: 'totalStudents' },
    { header: 'Room No.', accessor: 'roomNo' },
    {
      header: 'Status',
      render: (row) => <StatusBadge variant={row.status === 'active' ? 'green' : 'gray'}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Edit</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Section</h1>
          <p className="text-gray-600 mt-1">Manage sections and classroom assignments.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search section..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={SECTIONS_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
