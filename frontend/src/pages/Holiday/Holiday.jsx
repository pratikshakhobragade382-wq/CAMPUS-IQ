import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/tables/DataTable';
import { Modal, ModalBody, ModalFooter } from '../../components/modal/Modal';
import { getAcademicYears } from '../../api/academicYear.api';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../api/holiday.api';

const holidayTypeOptions = [
  { value: 'public', label: 'Public' },
  { value: 'school', label: 'School' },
  { value: 'regional', label: 'Regional' },
  { value: 'religious', label: 'Religious' },
];

const holidayTypeLabel = (type) => {
  return holidayTypeOptions.find((option) => option.value === type)?.label || type;
};

const formatIndianDate = (date) => {
  if (!date) return '—';
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return '—';
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getSundaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!startDate || !endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dates = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getDay() !== 0) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor > end) return [];
  }

  while (cursor <= end) {
    dates.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 7);
  }

  return dates;
};

export default function Holiday() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    academicYearId: '',
    name: '',
    date: '',
    holidayType: 'public',
    description: '',
  });

  const selectedYear = useMemo(
    () => academicYears.find((year) => String(year.id) === String(selectedAcademicYear)),
    [academicYears, selectedAcademicYear]
  );

  const sundayDates = useMemo(() => {
    if (!selectedYear) return [];
    return getSundaysBetween(selectedYear.startDate, selectedYear.endDate);
  }, [selectedYear]);

  const filteredHolidays = useMemo(() => {
    if (!searchQuery.trim()) return holidays;
    const query = searchQuery.trim().toLowerCase();
    return holidays.filter((holiday) => {
      return [holiday.name, holiday.holidayType, holiday.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [holidays, searchQuery]);

  const loadHolidays = useCallback(async (academicYearId) => {
    try {
      setLoading(true);
      const response = await getHolidays(academicYearId);
      setHolidays(response?.data || []);
    } catch (error) {
      console.error('Failed to load holidays', error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await getAcademicYears();
        const yearData = response?.data || [];
        setAcademicYears(yearData);
        setSelectedAcademicYear((prev) => prev || (yearData.length > 0 ? String(yearData[0].id) : ''));
      } catch (error) {
        console.error('Failed to load academic years', error);
      }
    };

    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (!selectedAcademicYear) return;

    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const response = await getHolidays(selectedAcademicYear);
        setHolidays(response?.data || []);
      } catch (error) {
        console.error('Failed to load holidays', error);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [selectedAcademicYear]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({
      id: null,
      academicYearId: selectedAcademicYear || (academicYears[0]?.id ? String(academicYears[0].id) : ''),
      name: '',
      date: '',
      holidayType: 'public',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (holiday) => {
    setIsEditing(true);
    setForm({
      id: holiday.id,
      academicYearId: String(holiday.academicYearId),
      name: holiday.name,
      date: holiday.date ? holiday.date.split('T')[0] : '',
      holidayType: holiday.holidayType || 'public',
      description: holiday.description || '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      id: null,
      academicYearId: selectedAcademicYear || '',
      name: '',
      date: '',
      holidayType: 'public',
      description: '',
    });
  };

  const handleSaveHoliday = async (event) => {
    event.preventDefault();

    if (!form.academicYearId || !form.name || !form.date || !form.holidayType) {
      alert('Please fill all required fields.');
      return;
    }

    const payload = {
      academicYearId: parseInt(form.academicYearId, 10),
      name: form.name.trim(),
      date: form.date,
      holidayType: form.holidayType,
      description: form.description.trim() || undefined,
    };

    try {
      setSaving(true);
      if (isEditing) {
        await updateHoliday(form.id, payload);
      } else {
        await createHoliday(payload);
      }
      setModalOpen(false);
      resetForm();
      loadHolidays(form.academicYearId || selectedAcademicYear);
    } catch (error) {
      console.error('Holiday save failed', error);
      alert(error.response?.data?.message || error.message || 'Failed to save holiday.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await deleteHoliday(id);
      loadHolidays(selectedAcademicYear);
    } catch (error) {
      console.error('Holiday delete failed', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete holiday.');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Date', accessor: (row) => formatIndianDate(row.date), render: (row) => formatIndianDate(row.date) },
    { header: 'Type', accessor: (row) => holidayTypeLabel(row.holidayType), render: (row) => holidayTypeLabel(row.holidayType) },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteHoliday(row.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-600 mt-1">Create and manage holiday dates, and view weekly Sunday holidays for the selected academic year.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search holidays..."
            className="min-w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="primary" size="md" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Holiday
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holiday Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <Select
              label="Academic Year"
              required
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              options={academicYears.map((year) => ({
                value: String(year.id),
                label: year.name || `${new Date(year.startDate).getFullYear()}-${new Date(year.endDate).getFullYear()}`,
              }))}
            />
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Weekly holidays are automatically calculated as Sundays within the selected academic year.</p>
              <p className="text-lg font-semibold mt-4">{sundayDates.length} Sundays</p>
              <div className="mt-3 text-sm text-gray-700 space-y-1 max-h-40 overflow-y-auto">
                {sundayDates.length > 0 ? (
                  sundayDates.map((date) => (
                    <div key={date} className="rounded-md bg-slate-50 px-3 py-2 text-slate-700">
                      {formatIndianDate(date)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No Sundays available for the selected year.</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Holiday count</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-gray-900">{holidays.length}</p>
                <p className="text-gray-500">School holidays defined for this academic year</p>
              </div>
              <div className="rounded-full bg-blue-100 px-4 py-3 text-blue-700">Only holidays</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holiday List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredHolidays} className={loading ? 'opacity-80' : ''} />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Holiday' : 'Add Holiday'} size="lg">
        <ModalBody>
          <form className="grid gap-4">
            <Select
              label="Academic Year"
              required
              value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              options={academicYears.map((year) => ({
                value: String(year.id),
                label: year.name || `${new Date(year.startDate).getFullYear()}-${new Date(year.endDate).getFullYear()}`,
              }))}
            />
            <Input
              label="Holiday Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter holiday name"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Holiday Date"
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <Select
                label="Holiday Type"
                required
                value={form.holidayType}
                onChange={(e) => setForm({ ...form, holidayType: e.target.value })}
                options={holidayTypeOptions}
              />
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveHoliday} disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Holiday' : 'Create Holiday'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
