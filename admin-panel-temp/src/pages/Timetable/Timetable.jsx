import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/tables/DataTable';
import { TIMETABLE_DATA } from '../../data/timetable.js';

export default function Timetable() {
  const columns = [
    { header: 'Class', accessor: 'className' },
    { header: 'Section', accessor: 'sectionName' },
    { header: 'Day', accessor: 'day' },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Time', render: (row) => `${row.startTime} - ${row.endTime}` },
    { header: 'Room', accessor: 'room' },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Edit</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Timetable</h1>
          <p className="text-gray-600 mt-1">Manage weekly timetable entries for classes and sections.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search timetable..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timetable Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={TIMETABLE_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
