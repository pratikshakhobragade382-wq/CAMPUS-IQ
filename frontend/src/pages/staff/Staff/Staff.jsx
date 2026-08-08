import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { STAFF_DATA } from '../../data/staff.js';

export default function Staff() {
  const columns = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={row.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Joining Date', accessor: 'joiningDate' },
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
          <h1 className="text-3xl font-semibold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage school staff and department assignments.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search staff..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={STAFF_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
