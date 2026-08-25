import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure CampusIQ preferences and school settings.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="School Name" placeholder="CampusIQ Academy" />
            <Input label="School Email" placeholder="info@campusiq.com" type="email" />
            <Input label="School Phone" placeholder="9876543210" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Default Academic Year" placeholder="2024-2025" />
            <Input label="Default Class" placeholder="10-A" />
            <Input label="Default Section" placeholder="A" />
            <Button variant="primary" size="md">Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
