import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { EXAM_DATA } from '../../data/exam.js';

export default function Exam() {
  const columns = [
    { header: 'Exam Name', accessor: 'name' },
    { header: 'Class', accessor: 'class' },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'End Date', accessor: 'endDate' },
    { header: 'Total Marks', accessor: 'totalMarks' },
    {
      header: 'Status',
      render: (row) => <StatusBadge variant={row.status === 'scheduled' ? 'blue' : row.status === 'completed' ? 'green' : 'yellow'}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Manage</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Exam</h1>
          <p className="text-gray-600 mt-1">Manage exam schedules, class assignments, and status.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search exam..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Exam
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={EXAM_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
