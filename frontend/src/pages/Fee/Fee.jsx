import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/tables/DataTable';
import { Tabs } from '../../components/ui/Tabs';
import { Modal, ModalBody, ModalFooter } from '../../components/modal/Modal';
import {
  getCategories, createCategory, deleteCategory,
  getStructures, createStructure,
  collectFee, getStudentFeeStatus, getCollectionsByDateRange,
} from '../../api/fee.api';

export default function Fee() {
  const [categories, setCategories] = useState([]);
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');

  const [isCatModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const [isCollectModalOpen, setCollectModalOpen] = useState(false);
  const [collectForm, setCollectForm] = useState({ studentId: '', feeStructureId: '', academicYearId: '', amount: '', paymentMode: 'cash', paymentDate: '' });
  const [structureForm, setStructureForm] = useState({ academicYearId: '', classId: '', feeCategoryId: '', amount: '', frequency: 'annual', dueDay: '' });

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStructures = async () => {
    try {
      const data = await getStructures();
      setStructures(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getCategories().then((data) => setCategories(data || [])),
          getStructures().then((data) => setStructures(data || [])),
          (async () => {
            const res = await (await import('../../api/class.api')).getClasses();
            setClasses(res.data || []);
          })(),
          (async () => {
            const res = await (await import('../../api/academicYear.api')).getAcademicYears();
            setAcademicYears(res.data || []);
          })(),
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    void Promise.resolve().then(loadInitialData);
  }, []);

  const searchForStudents = async (q) => {
    try {
      const results = await (await import('../../api/student.api')).searchStudents(q);
      const opts = (results || []).map((s) => ({ value: String(s.id), label: `${s.studentName || s.name || s.admissionNo} (${s.admissionNo || s.id})` }));
      setStudentOptions(opts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory(catForm);
      setCatForm({ name: '', description: '' });
      setCatModalOpen(false);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Deactivate this category?')) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    const payload = { ...structureForm };

    // Basic client-side validation
    if (!payload.academicYearId || !payload.classId || !payload.feeCategoryId || !payload.amount) {
      alert('Please fill Academic Year, Class, Fee Category and Amount');
      return;
    }

    payload.academicYearId = parseInt(payload.academicYearId);
    payload.classId = parseInt(payload.classId);
    payload.feeCategoryId = parseInt(payload.feeCategoryId);
    payload.amount = parseFloat(payload.amount);
    if (isNaN(payload.amount) || payload.amount <= 0) {
      alert('Amount must be a number greater than 0');
      return;
    }

    if (payload.dueDay) payload.dueDay = parseInt(payload.dueDay);

    try {
      await createStructure(payload);
      setStructureForm({ academicYearId: '', classId: '', feeCategoryId: '', amount: '', frequency: 'annual', dueDay: '' });
      loadStructures();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCollect = async () => {
    // Basic client-side validation
    if (!collectForm.studentId || !collectForm.feeStructureId || !collectForm.academicYearId || !collectForm.amount || !collectForm.paymentMode || !collectForm.paymentDate) {
      alert('Please fill student, fee structure, academic year, amount, payment mode and payment date');
      return;
    }

    const payload = {
      studentId: parseInt(collectForm.studentId),
      feeStructureId: parseInt(collectForm.feeStructureId),
      academicYearId: parseInt(collectForm.academicYearId),
      amount: parseFloat(collectForm.amount),
      discount: collectForm.discount ? parseFloat(collectForm.discount) : 0,
      fine: collectForm.fine ? parseFloat(collectForm.fine) : 0,
      paymentMode: collectForm.paymentMode,
      paymentDate: collectForm.paymentDate,
      chequeNo: collectForm.chequeNo || undefined,
      bankName: collectForm.bankName || undefined,
      transactionId: collectForm.transactionId || undefined,
      remark: collectForm.remark || undefined,
    };

    if (isNaN(payload.amount) || payload.amount <= 0) {
      alert('Amount must be a number greater than 0');
      return;
    }

    try {
      await collectFee(payload);
      setCollectForm({ studentId: '', feeStructureId: '', academicYearId: '', amount: '', paymentMode: 'cash', paymentDate: '' });
      setCollectModalOpen(false);
      alert('Payment recorded');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const categoriesColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
    { header: 'Actions', render: (r) => <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setCatForm({ name: r.name, description: r.description }); setCatModalOpen(true); }}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDeleteCategory(r.id)}>Deactivate</Button></div> },
  ];

  const structuresColumns = [
    { header: 'Class', accessor: row => row.class?.name || '—' , render: (r) => r.class?.name || '—' },
    { header: 'Category', accessor: row => row.feeCategory?.name || '—', render: (r) => r.feeCategory?.name || '—' },
    { header: 'Academic Year', accessor: 'academicYearId' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Frequency', accessor: 'frequency' },
    { header: 'Actions', render: () => null },
  ];

  const tabs = [
    {
      label: 'Categories',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Fee Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setCatForm({ name: '', description: '' }); setCatModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> New Category</Button>
            </div>
            <DataTable columns={categoriesColumns} data={categories} />
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Structures',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Fee Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStructure} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Select name="academicYearId" required value={structureForm.academicYearId} onChange={(e) => setStructureForm({ ...structureForm, academicYearId: e.target.value })} options={academicYears.map(y => ({ value: String(y.id), label: y.name || `${new Date(y.startDate).getFullYear()}-${new Date(y.endDate).getFullYear()}` }))} />
              <Select name="classId" required value={structureForm.classId} onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })} options={classes.map(c => ({ value: String(c.id), label: c.name }))} />
              <Select name="feeCategoryId" required value={structureForm.feeCategoryId} onChange={(e) => setStructureForm({ ...structureForm, feeCategoryId: e.target.value })} options={categories.map(c => ({ value: String(c.id), label: c.name }))} />
              <Input name="amount" value={structureForm.amount} onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })} type="number" step="0.01" required placeholder="Amount" />
              <Input name="frequency" value={structureForm.frequency} onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })} placeholder="Frequency (annual/monthly)" />
              <Input name="dueDay" value={structureForm.dueDay} onChange={(e) => setStructureForm({ ...structureForm, dueDay: e.target.value })} type="number" placeholder="Due Day" />
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit">Create Structure</Button>
                <Button variant="outline" type="button" onClick={() => loadStructures()}>Refresh</Button>
              </div>
            </form>

            <DataTable columns={structuresColumns} data={structures} />
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Collect',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Collect Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setCollectModalOpen(true)}>Record Payment</Button>
            </div>
            <p className="text-sm text-gray-600">Use the Record Payment button to open the collection form.</p>
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Student Status',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Student Fee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentStatus />
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Collections',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Collections Report</CardTitle>
          </CardHeader>
          <CardContent>
            <CollectionsReport />
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Fee</h1>
          <p className="text-gray-600 mt-1">Manage fee categories, structures, and collections.</p>
        </div>
      </div>

      <Tabs tabs={tabs} />

      <Modal isOpen={isCatModalOpen} onClose={() => setCatModalOpen(false)} title="Create / Edit Fee Category">
        <ModalBody>
          <div className="space-y-3">
            <Input placeholder="Name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            <Input placeholder="Description" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setCatModalOpen(false)} variant="outline">Cancel</Button>
          <Button onClick={handleCreateCategory}>Save</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isCollectModalOpen} onClose={() => setCollectModalOpen(false)} title="Record Payment">
        <ModalBody>
            <div className="space-y-3">
            <div>
              <Input placeholder="Search student by name/admission no" value={studentQuery} onChange={(e) => { setStudentQuery(e.target.value); searchForStudents(e.target.value); }} />
              <Select value={collectForm.studentId} onChange={(e) => setCollectForm({ ...collectForm, studentId: e.target.value })} options={studentOptions} />
            </div>
            <Select value={collectForm.feeStructureId} onChange={(e) => setCollectForm({ ...collectForm, feeStructureId: e.target.value })} options={structures.map(s => ({ value: String(s.id), label: `${s.class?.name || 'Class'} — ${s.feeCategory?.name || 'Category'} — ${s.amount}` }))} />
            <Select value={collectForm.academicYearId} onChange={(e) => setCollectForm({ ...collectForm, academicYearId: e.target.value })} options={academicYears.map(y => ({ value: String(y.id), label: y.name || `${new Date(y.startDate).getFullYear()}-${new Date(y.endDate).getFullYear()}` }))} />
            <Input required type="number" step="0.01" placeholder="Amount" value={collectForm.amount} onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })} />
            <Input required placeholder="Payment Mode" value={collectForm.paymentMode} onChange={(e) => setCollectForm({ ...collectForm, paymentMode: e.target.value })} />
            <Input required type="date" placeholder="Payment Date" value={collectForm.paymentDate} onChange={(e) => setCollectForm({ ...collectForm, paymentDate: e.target.value })} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setCollectModalOpen(false)} variant="outline">Cancel</Button>
          <Button onClick={handleCollect}>Submit</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function StudentStatus() {
  const [studentId, setStudentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [status, setStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await getStudentFeeStatus(studentId, academicYearId || undefined);
      setStatus(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        <Input placeholder="Academic Year ID (optional)" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} />
        <Button onClick={fetchStatus}>Fetch</Button>
      </div>
      {status ? (
        <div>
          <h3 className="font-semibold">{status.student.name} — {status.student.admissionNo}</h3>
          <div className="mt-3">
            <DataTable columns={[{ header: 'Category', accessor: 'feeCategory' }, { header: 'Owed', accessor: 'owed' }, { header: 'Paid', accessor: 'paid' }, { header: 'Balance', accessor: 'balance' }, { header: 'Status', accessor: 'status' }]} data={status.breakdown} />
            <div className="mt-4">Totals — Owed: {status.totals.owed} Paid: {status.totals.paid} Balance: {status.totals.balance}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CollectionsReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState(null);

  const fetchReport = async () => {
    try {
      const data = await getCollectionsByDateRange(fromDate || undefined, toDate || undefined);
      setReport(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <Button onClick={fetchReport}>Fetch</Button>
      </div>
      {report ? (
        <div>
          <div className="mb-3">From: {new Date(report.fromDate).toLocaleDateString()} To: {new Date(report.toDate).toLocaleDateString()} Total: {report.totalCollected} Count: {report.count}</div>
          <DataTable columns={[{ header: 'Receipt', accessor: 'receiptNo' }, { header: 'Student', accessor: row => row.student?.studentName || '—', render: (r) => r.student?.studentName || '—' }, { header: 'Amount', accessor: 'netAmount' }, { header: 'Date', accessor: row => new Date(row.paymentDate).toLocaleDateString(), render: (r) => new Date(r.paymentDate).toLocaleDateString() }]} data={report.collections} />
        </div>
      ) : null}
    </div>
  );
}
