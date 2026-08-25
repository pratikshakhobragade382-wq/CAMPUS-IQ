import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { HOLIDAY_DATA } from '../../data/holiday.js';

export default function Holiday() {
  const columns = [
    { header: 'Holiday Name', accessor: 'name' },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'End Date', accessor: 'endDate' },
    { header: 'Type', accessor: 'type' },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Edit</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Holiday</h1>
          <p className="text-gray-600 mt-1">Manage school holidays and special events.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search holiday..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Holiday
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holiday Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={HOLIDAY_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
