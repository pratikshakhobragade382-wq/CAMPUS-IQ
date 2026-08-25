import React, { useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { ACADEMIC_YEAR_DATA } from '../../data/academicYear.js';

export default function AcademicYear() {
  const totals = useMemo(() => {
    const current = ACADEMIC_YEAR_DATA.filter((item) => item.isCurrent).length;
    const active = ACADEMIC_YEAR_DATA.filter((item) => item.status === 'active').length;
    const completed = ACADEMIC_YEAR_DATA.filter((item) => item.status === 'completed').length;
    return { current, active, completed };
  }, []);

  const columns = [
    { header: 'Year', accessor: 'year' },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'End Date', accessor: 'endDate' },
    {
      header: 'Current Year',
      render: (row) => (row.isCurrent ? <StatusBadge variant="green">Yes</StatusBadge> : <StatusBadge variant="gray">No</StatusBadge>),
    },
    {
      header: 'Status',
      render: (row) => {
        const variant = row.status === 'active' ? 'green' : row.status === 'completed' ? 'blue' : 'yellow';
        return <StatusBadge variant={variant}>{row.status}</StatusBadge>;
      },
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
          <h1 className="text-3xl font-semibold text-gray-900">Academic Year</h1>
          <p className="text-gray-600 mt-1">Manage all academic year records and status.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search academic year..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Academic Year
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Years</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{ACADEMIC_YEAR_DATA.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totals.current}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totals.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Year List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={ACADEMIC_YEAR_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
