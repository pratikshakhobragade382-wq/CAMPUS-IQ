import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/tables/DataTable';

const FIELD_DATA = [
  { id: '1', field: 'House', type: 'Select', module: 'Students', status: 'active' },
  { id: '2', field: 'Transport Route', type: 'Select', module: 'Students', status: 'active' },
  { id: '3', field: 'Sibling Name', type: 'Text', module: 'Students', status: 'active' },
  { id: '4', field: 'Blood Group', type: 'Select', module: 'Staff', status: 'active' },
];

export default function CustomFields() {
  const columns = [
    { header: 'Field Name', accessor: 'field' },
    { header: 'Type', accessor: 'type' },
    { header: 'Module', accessor: 'module' },
    { header: 'Status', accessor: 'status' },
    {
      header: 'Actions',
      render: () => <Button variant="outline" size="sm">Edit</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Custom Fields</h1>
          <p className="text-gray-600 mt-1">Manage custom fields for students, staff, and other modules.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input placeholder="Search custom field..." className="min-w-[260px]" />
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Field
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={FIELD_DATA} />
        </CardContent>
      </Card>
    </div>
  );
}
