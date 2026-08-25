import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { FEE_DATA } from '../../data/fee.js';

export default function Fee() {
  const columns = [
    { header: 'Student', accessor: 'studentName' },
    { header: 'Admission No.', accessor: 'admissionNo' },
    { header: 'Month', accessor: 'month' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Due Date', accessor: 'dueDate' },
    {
      header: 'Status',
      render: (row) => {
        const variant = row.status === 'paid' ? 'green' : row.status === 'pending' ? 'yellow' : 'red';
        return <StatusBadge variant={variant}>{row.status}</StatusBadge>;
      },
    },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Collect</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Fee</h1>
          <p className="text-gray-600 mt-1">Track fee status, due dates, and collection details.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search fee..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Payment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={FEE_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
