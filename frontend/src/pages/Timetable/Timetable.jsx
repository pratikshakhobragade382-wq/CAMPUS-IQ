import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, RefreshCw, Pencil, Trash2, Clock3, CalendarDays,
  Users, BookOpen, Settings2, X, Save, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const TIMETABLE_API = `${API_BASE}/timetable`;

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SLOT_TYPES = [
  "period",
  "recess",
  "lunch",
  "sports",
];

function getToken() {
  const keys = [
    "token",
    "accessToken",
    "authToken",
    "jwt",
    "campusIQToken",
  ];
  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value.startsWith('Bearer ')
        ? value.substring(7)
        : value;
    }
  }

  return '';
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Authentication token not found. Please login again.');
  }

  const response = await fetch(`${TIMETABLE_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let body = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text };
  }

  if (!response.ok) {
    throw new Error(
      body.error ||
      body.message ||
      `Request failed (${response.status})`
    );
  }

  return body;
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function flattenGrouped(grouped) {
  return Object.entries(grouped || {}).flatMap(([day, entries]) =>
    (entries || []).map((entry) => ({ ...entry, dayName: day }))
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

export default function Timetable() {
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [mode, setMode] = useState('class');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [search, setSearch] = useState('');
  const [activeDay, setActiveDay] = useState('All');
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  const [entryForm, setEntryForm] = useState({
    academicYearId: '', classId: '', sectionId: '', subjectId: '',
    staffId: '', periodSlotId: '', dayOfWeek: '1',
  });

  const [slotForm, setSlotForm] = useState({
    slotNo: '', label: '', slotType: 'period', startTime: '', endTime: '',
  });

  const loadSlots = async () => {
    setSlotLoading(true);
    try {
      setError('');
      const result = await apiRequest('/period-slots');
      setSlots(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSlotLoading(false);
    }
  };

  const loadTimetable = async () => {
    setLoading(true);
    try {
      setError('');
      let result;
      if (mode === 'teacher') {
        if (!staffId) {
          setEntries([]);
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ staffId });
        if (academicYearId) params.set('academicYearId', academicYearId);
        result = await apiRequest(`/teacher?${params.toString()}`);
      } else {
        if (!classId) {
          setEntries([]);
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ classId });
        if (sectionId) params.set('sectionId', sectionId);
        if (academicYearId) params.set('academicYearId', academicYearId);
        result = await apiRequest(`/class?${params.toString()}`);
      }
      setEntries(flattenGrouped(result.data));
    } catch (err) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesDay = activeDay === 'All' || entry.dayName === activeDay;
      if (!matchesDay) return false;
      if (!query) return true;
      return [
        entry.subject?.name, entry.staff?.name, entry.class?.name,
        entry.section?.name, entry.dayName, entry.periodSlot?.label,
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [entries, search, activeDay]);

  const openCreateEntry = () => {
    setEditingEntry(null);
    setEntryForm({
      academicYearId: academicYearId || '',
      classId: classId || '',
      sectionId: sectionId || '',
      subjectId: '',
      staffId: staffId || '',
      periodSlotId: slots.find((s) => s.slotType === 'period')?.id?.toString() || '',
      dayOfWeek: '1',
    });
    setShowEntryForm(true);
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        academicYearId: Number(entryForm.academicYearId),
        classId: Number(entryForm.classId),
        ...(entryForm.sectionId ? { sectionId: Number(entryForm.sectionId) } : {}),
        subjectId: Number(entryForm.subjectId),
        staffId: Number(entryForm.staffId),
        periodSlotId: Number(entryForm.periodSlotId),
        dayOfWeek: Number(entryForm.dayOfWeek),
      };

      if (editingEntry) {
        await apiRequest(`/${editingEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            subjectId: payload.subjectId,
            staffId: payload.staffId,
          }),
        });
        setNotice('Timetable entry updated successfully.');
      } else {
        await apiRequest('', { method: 'POST', body: JSON.stringify(payload) });
        setNotice('Timetable entry created successfully.');
      }

      setShowEntryForm(false);
      setEditingEntry(null);
      await loadTimetable();
    } catch (err) {
      setError(err.message);
    }
  };

  const editEntry = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      academicYearId: entry.academicYearId?.toString() || academicYearId || '',
      classId: entry.classId?.toString() || classId || '',
      sectionId: entry.sectionId?.toString() || '',
      subjectId: entry.subjectId?.toString() || entry.subject?.id?.toString() || '',
      staffId: entry.staffId?.toString() || entry.staff?.id?.toString() || '',
      periodSlotId: entry.periodSlotId?.toString() || entry.periodSlot?.id?.toString() || '',
      dayOfWeek: entry.dayOfWeek?.toString() || '1',
    });
    setShowEntryForm(true);
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      setError('');
      await apiRequest(`/${entry.id}`, { method: 'DELETE' });
      setNotice('Timetable entry deleted.');
      await loadTimetable();
    } catch (err) {
      setError(err.message);
    }
  };

  const seedSlots = async () => {
    try {
      setError('');
      await apiRequest('/period-slots/seed', { method: 'POST' });
      setNotice('Default period slots created.');
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      slotNo: String((slots.at(-1)?.slotNo || 0) + 1),
      label: '',
      slotType: 'period',
      startTime: '',
      endTime: '',
    });
    setShowSlotForm(true);
  };

  const editSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      slotNo: String(slot.slotNo),
      label: slot.label || '',
      slotType: slot.slotType || 'period',
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
    });
    setShowSlotForm(true);
  };

  const saveSlot = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        slotNo: Number(slotForm.slotNo),
        label: slotForm.label,
        slotType: slotForm.slotType,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
      };

      if (editingSlot) {
        await apiRequest(`/period-slots/${editingSlot.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            label: payload.label,
            slotType: payload.slotType,
            startTime: payload.startTime,
            endTime: payload.endTime,
          }),
        });
        setNotice('Period slot updated.');
      } else {
        await apiRequest('/period-slots', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotice('Period slot created.');
      }

      setShowSlotForm(false);
      setEditingSlot(null);
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSlot = async (slot) => {
    if (!window.confirm(`Delete "${slot.label}"?`)) return;
    try {
      setError('');
      await apiRequest(`/period-slots/${slot.id}`, { method: 'DELETE' });
      setNotice('Period slot deleted.');
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setEntries([]);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <CalendarDays className="h-4 w-4" /> Academic Management
          </div>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">Timetable</h1>
          <p className="mt-1 text-gray-600">
            Create, view, update and manage class and teacher weekly schedules.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={loadSlots} disabled={slotLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${slotLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="md" onClick={openCreateSlot}>
            <Clock3 className="mr-2 h-4 w-4" /> Add Slot
          </Button>
          <Button variant="primary" size="md" onClick={openCreateEntry}>
            <Plus className="mr-2 h-4 w-4" /> Add Entry
          </Button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error || notice}</span>
          <button
            className="ml-auto"
            onClick={() => { setError(''); setNotice(''); }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Timetable View</CardTitle>
            <div className="flex rounded-lg border bg-gray-50 p-1">
              <button
                onClick={() => switchMode('class')}
                className={`rounded-md px-4 py-2 text-sm font-medium ${mode === 'class' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <Users className="mr-2 inline h-4 w-4" /> Class
              </button>
              <button
                onClick={() => switchMode('teacher')}
                className={`rounded-md px-4 py-2 text-sm font-medium ${mode === 'teacher' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <BookOpen className="mr-2 inline h-4 w-4" /> Teacher
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label={mode === 'class' ? 'Class ID *' : 'Teacher / Staff ID *'}>
              <Input
                type="number"
                min="1"
                value={mode === 'class' ? classId : staffId}
                onChange={(e) => mode === 'class' ? setClassId(e.target.value) : setStaffId(e.target.value)}
                placeholder="e.g. 1"
              />
            </Field>

            {mode === 'class' && (
              <Field label="Section ID">
                <Input type="number" min="1" value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="Optional" />
              </Field>
            )}

            <Field label="Academic Year ID">
              <Input type="number" min="1" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} placeholder="Optional" />
            </Field>

            <Field label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Subject, teacher..." />
              </div>
            </Field>

            <div className="flex items-end">
              <Button variant="primary" size="md" className="w-full" onClick={loadTimetable} disabled={loading}>
                {loading ? 'Loading...' : 'Load Timetable'}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['All', ...DAYS.map((day) => day.label)].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeDay === day ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{entry.dayName || '—'}</td>
                    <td className="px-4 py-3">{entry.periodSlot?.label || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTime(entry.periodSlot?.startTime)} - {formatTime(entry.periodSlot?.endTime)}
                    </td>
                    <td className="px-4 py-3">{entry.class?.name || entry.classId || '—'}</td>
                    <td className="px-4 py-3">{entry.section?.name || entry.sectionId || '—'}</td>
                    <td className="px-4 py-3 font-medium">{entry.subject?.name || entry.subjectId || '—'}</td>
                    <td className="px-4 py-3">{entry.staff?.name || entry.staffId || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => editEntry(entry)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteEntry(entry)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && visibleEntries.length === 0 && (
              <div className="p-8">
                <EmptyState message={classId || staffId ? 'No timetable entries found for the selected filters.' : 'Enter a Class ID or Teacher ID, then click Load Timetable.'} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Period Slots</CardTitle>
              <p className="mt-1 text-sm text-gray-500">Manage the school day periods, recess, lunch and sports slots.</p>
            </div>
            {slots.length === 0 && (
              <Button variant="primary" size="sm" onClick={seedSlots}>
                <Settings2 className="mr-2 h-4 w-4" /> Seed Default Slots
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{slot.slotNo}</td>
                    <td className="px-4 py-3">{slot.label}</td>
                    <td className="px-4 py-3 capitalize">{slot.slotType}</td>
                    <td className="px-4 py-3">{formatTime(slot.startTime)}</td>
                    <td className="px-4 py-3">{formatTime(slot.endTime)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => editSlot(slot)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteSlot(slot)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {slots.length === 0 && <div className="p-6"><EmptyState message="No period slots found. Use Seed Default Slots or Add Slot." /></div>}
          </div>
        </CardContent>
      </Card>

      {showEntryForm && (
        <Modal title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'} onClose={() => setShowEntryForm(false)}>
          <form onSubmit={saveEntry} className="grid gap-4 md:grid-cols-2">
            <Field label="Academic Year ID *"><Input required type="number" min="1" value={entryForm.academicYearId} onChange={(e) => setEntryForm({ ...entryForm, academicYearId: e.target.value })} /></Field>
            <Field label="Class ID *"><Input required type="number" min="1" value={entryForm.classId} onChange={(e) => setEntryForm({ ...entryForm, classId: e.target.value })} /></Field>
            <Field label="Section ID"><Input type="number" min="1" value={entryForm.sectionId} onChange={(e) => setEntryForm({ ...entryForm, sectionId: e.target.value })} /></Field>
            <Field label="Subject ID *"><Input required type="number" min="1" value={entryForm.subjectId} onChange={(e) => setEntryForm({ ...entryForm, subjectId: e.target.value })} /></Field>
            <Field label="Teacher / Staff ID *"><Input required type="number" min="1" value={entryForm.staffId} onChange={(e) => setEntryForm({ ...entryForm, staffId: e.target.value })} /></Field>
            <Field label="Period Slot *">
              <select required className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={entryForm.periodSlotId} onChange={(e) => setEntryForm({ ...entryForm, periodSlotId: e.target.value })}>
                <option value="">Select slot</option>
                {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label} ({formatTime(slot.startTime)}–{formatTime(slot.endTime)})</option>)}
              </select>
            </Field>
            <Field label="Day *">
              <select required className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={entryForm.dayOfWeek} onChange={(e) => setEntryForm({ ...entryForm, dayOfWeek: e.target.value })}>
                {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
            </Field>

            <div className="md:col-span-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              The backend prevents teacher/class double-booking and does not allow subjects on recess or lunch slots.
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEntryForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary"><Save className="mr-2 h-4 w-4" /> Save Entry</Button>
            </div>
          </form>
        </Modal>
      )}

      {showSlotForm && (
        <Modal title={editingSlot ? 'Edit Period Slot' : 'Add Period Slot'} onClose={() => setShowSlotForm(false)}>
          <form onSubmit={saveSlot} className="grid gap-4 md:grid-cols-2">
            <Field label="Slot Number *"><Input required type="number" min="1" value={slotForm.slotNo} onChange={(e) => setSlotForm({ ...slotForm, slotNo: e.target.value })} disabled={!!editingSlot} /></Field>
            <Field label="Label *"><Input required value={slotForm.label} onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })} placeholder="Period 1" /></Field>
            <Field label="Slot Type *">
              <select required className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={slotForm.slotType} onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}>
                {SLOT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
            <div />
            <Field label="Start Time *"><Input required type="time" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} /></Field>
            <Field label="End Time *"><Input required type="time" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} /></Field>

            <div className="md:col-span-2 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSlotForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary"><Save className="mr-2 h-4 w-4" /> Save Slot</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
