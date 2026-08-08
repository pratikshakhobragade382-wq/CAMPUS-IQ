import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CLASSES_DATA } from '../../data/class.js';

export default function ClassPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Class</h1>
          <p className="text-gray-600 mt-1">Overview of classes with strength and class teacher details.</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {CLASSES_DATA.map((classItem) => (
          <Card key={classItem.id} className="group hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <p><span className="font-medium">Teacher:</span> {classItem.classTeacher}</p>
                <p><span className="font-medium">Students:</span> {classItem.totalStudents}</p>
                <p><span className="font-medium">Capacity:</span> {classItem.totalCapacity}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
