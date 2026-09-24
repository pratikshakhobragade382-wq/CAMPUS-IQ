import { useEffect, useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/tables/DataTable';
import { Tabs } from '../../components/ui/Tabs';

import {
  Modal,
  ModalBody,
  ModalFooter,
} from '../../components/modal/Modal';

import {
  getCategories,
  createCategory,
  deleteCategory,
  getStructures,
  createStructure,
  collectFee,
  getStudentFeeStatus,
  getCollectionsByDateRange,
} from '../../api/fee.api';

import { getStudents } from '../../api/student.api';

/* =========================================================
   STUDENT RESPONSE NORMALIZER
========================================================= */

function extractStudents(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.students)) {
    return response.students;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.students)) {
    return response.data.students;
  }

  if (
    Array.isArray(
      response?.data?.data?.students
    )
  ) {
    return response.data.data.students;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  return [];
}

/* =========================================================
   STUDENT OPTION BUILDER
========================================================= */

function buildStudentOptions(students) {
  return students.map((student) => ({
    value: String(student.id),

    label: `${student.studentName || student.name || 'Student'} — Admission No: ${
      student.admissionNo || 'N/A'
    }${student.grNo ? ` — GR No: ${student.grNo}` : ''}`,

    student,
  }));
}

/* =========================================================
   MAIN FEE COMPONENT
========================================================= */

export default function Fee() {
  const [categories, setCategories] =
    useState([]);

  const [structures, setStructures] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [academicYears, setAcademicYears] =
    useState([]);

  /* =========================================================
     STUDENT SEARCH FOR COLLECTION
  ========================================================= */

  const [studentOptions, setStudentOptions] =
    useState([]);

  const [studentQuery, setStudentQuery] =
    useState('');

  const [studentLoading, setStudentLoading] =
    useState(false);

  const [studentSearchError, setStudentSearchError] =
    useState('');

  /* =========================================================
     CATEGORY MODAL
  ========================================================= */

  const [
    isCatModalOpen,
    setCatModalOpen,
  ] = useState(false);

  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
  });

  /* =========================================================
     COLLECT MODAL
  ========================================================= */

  const [
    isCollectModalOpen,
    setCollectModalOpen,
  ] = useState(false);

  const [collectForm, setCollectForm] =
    useState({
      studentId: '',
      feeStructureId: '',
      academicYearId: '',
      amount: '',
      discount: '',
      fine: '',
      paymentMode: 'cash',
      paymentDate: '',
      chequeNo: '',
      bankName: '',
      transactionId: '',
      remark: '',
    });

  /* =========================================================
     STRUCTURE FORM
  ========================================================= */

  const [structureForm, setStructureForm] =
    useState({
      academicYearId: '',
      classId: '',
      feeCategoryId: '',
      amount: '',
      frequency: 'annual',
      dueDay: '',
    });

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  const loadCategories = async () => {
    try {
      const data =
        await getCategories();

      setCategories(
        data || []
      );
    } catch (err) {
      console.error(
        'Failed to load fee categories:',
        err
      );
    }
  };

  /* =========================================================
     LOAD STRUCTURES
  ========================================================= */

  const loadStructures = async () => {
    try {
      const data =
        await getStructures();

      setStructures(
        data || []
      );
    } catch (err) {
      console.error(
        'Failed to load fee structures:',
        err
      );
    }
  };

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {
    const loadInitialData =
      async () => {
        try {
          const [
            categoriesData,
            structuresData,
            classesResponse,
            academicYearsResponse,
          ] = await Promise.all([
            getCategories(),
            getStructures(),

            (async () => {
              const api =
                await import(
                  '../../api/class.api'
                );

              return api.getClasses();
            })(),

            (async () => {
              const api =
                await import(
                  '../../api/academicYear.api'
                );

              return api.getAcademicYears();
            })(),
          ]);

          setCategories(
            categoriesData || []
          );

          setStructures(
            structuresData || []
          );

          setClasses(
            classesResponse?.data || []
          );

          setAcademicYears(
            academicYearsResponse?.data || []
          );
        } catch (err) {
          console.error(
            'Failed to load fee module data:',
            err
          );
        }
      };

    loadInitialData();
  }, []);

  /* =========================================================
     SEARCH STUDENTS
  ========================================================= */

  const searchForStudents =
    async (query) => {
      const search =
        query?.trim() || '';

      setStudentSearchError('');

      if (!search) {
        setStudentOptions([]);
        return;
      }

      try {
        setStudentLoading(true);

        console.log(
          'Searching students:',
          search
        );

        const response =
          await getStudents({
            page: 1,
            limit: 50,
            search,
          });

        console.log(
          'Student search response:',
          response
        );

        const students =
          extractStudents(
            response
          );

        console.log(
          'Students found:',
          students
        );

        const options =
          buildStudentOptions(
            students
          );

        setStudentOptions(
          options
        );

        if (
          options.length === 0
        ) {
          setStudentSearchError(
            `No student found for "${search}"`
          );
        }
      } catch (err) {
        console.error(
          'Student search failed:',
          err
        );

        const status =
          err?.response?.status;

        const message =
          err?.response?.data
            ?.message ||
          err?.response?.data
            ?.error ||
          err?.message ||
          'Unable to search students';

        if (status === 403) {
          setStudentSearchError(
            'You are not authorized to access the student list. Please login again as Admin.'
          );
        } else {
          setStudentSearchError(
            message
          );
        }

        setStudentOptions([]);
      } finally {
        setStudentLoading(false);
      }
    };

  /* =========================================================
     LOAD INITIAL STUDENTS
  ========================================================= */

  const loadInitialStudents =
    async () => {
      try {
        setStudentLoading(true);
        setStudentSearchError('');

        const response =
          await getStudents({
            page: 1,
            limit: 50,
          });

        console.log(
          'Initial students response:',
          response
        );

        const students =
          extractStudents(
            response
          );

        const options =
          buildStudentOptions(
            students
          );

        setStudentOptions(
          options
        );

        if (
          options.length === 0
        ) {
          setStudentSearchError(
            'No students are available.'
          );
        }
      } catch (err) {
        console.error(
          'Failed to load students:',
          err
        );

        const status =
          err?.response?.status;

        if (status === 403) {
          setStudentSearchError(
            'You are not authorized to access students. Please login again as Admin.'
          );
        } else {
          setStudentSearchError(
            err?.response?.data
              ?.message ||
              err?.message ||
              'Failed to load students'
          );
        }

        setStudentOptions([]);
      } finally {
        setStudentLoading(false);
      }
    };

  /* =========================================================
     OPEN COLLECT MODAL
  ========================================================= */

  const openCollectModal =
    () => {
      setCollectForm({
        studentId: '',
        feeStructureId: '',
        academicYearId: '',
        amount: '',
        discount: '',
        fine: '',
        paymentMode: 'cash',
        paymentDate:
          new Date()
            .toISOString()
            .split('T')[0],
        chequeNo: '',
        bankName: '',
        transactionId: '',
        remark: '',
      });

      setStudentQuery('');
      setStudentOptions([]);
      setStudentSearchError('');

      setCollectModalOpen(
        true
      );

      loadInitialStudents();
    };

  /* =========================================================
     CREATE CATEGORY
  ========================================================= */

  const handleCreateCategory =
    async () => {
      if (
        !catForm.name.trim()
      ) {
        alert(
          'Please enter fee category name'
        );

        return;
      }

      try {
        await createCategory(
          catForm
        );

        setCatForm({
          name: '',
          description: '',
        });

        setCatModalOpen(
          false
        );

        await loadCategories();
      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            err.message ||
            'Failed to save category'
        );
      }
    };

  /* =========================================================
     DELETE CATEGORY
  ========================================================= */

  const handleDeleteCategory =
    async (id) => {
      if (
        !confirm(
          'Deactivate this category?'
        )
      ) {
        return;
      }

      try {
        await deleteCategory(
          id
        );

        await loadCategories();
      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            err.message ||
            'Failed to deactivate category'
        );
      }
    };

  /* =========================================================
     CREATE FEE STRUCTURE
  ========================================================= */

  const handleCreateStructure =
    async (e) => {
      e.preventDefault();

      const payload = {
        ...structureForm,
      };

      if (
        !payload.academicYearId ||
        !payload.classId ||
        !payload.feeCategoryId ||
        !payload.amount
      ) {
        alert(
          'Please fill Academic Year, Class, Fee Category and Amount'
        );

        return;
      }

      payload.academicYearId =
        parseInt(
          payload.academicYearId,
          10
        );

      payload.classId =
        parseInt(
          payload.classId,
          10
        );

      payload.feeCategoryId =
        parseInt(
          payload.feeCategoryId,
          10
        );

      payload.amount =
        parseFloat(
          payload.amount
        );

      if (
        Number.isNaN(
          payload.amount
        ) ||
        payload.amount <= 0
      ) {
        alert(
          'Amount must be a number greater than 0'
        );

        return;
      }

      if (payload.dueDay) {
        payload.dueDay =
          parseInt(
            payload.dueDay,
            10
          );
      }

      try {
        await createStructure(
          payload
        );

        setStructureForm({
          academicYearId: '',
          classId: '',
          feeCategoryId: '',
          amount: '',
          frequency: 'annual',
          dueDay: '',
        });

        await loadStructures();

        alert(
          'Fee structure created successfully'
        );
      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            err.message ||
            'Failed to create fee structure'
        );
      }
    };

  /* =========================================================
     SELECT FEE STRUCTURE
  ========================================================= */

  const handleFeeStructureChange =
    (e) => {
      const feeStructureId =
        e.target.value;

      const selectedStructure =
        structures.find(
          (structure) =>
            String(
              structure.id
            ) ===
            String(
              feeStructureId
            )
        );

      setCollectForm(
        (previous) => ({
          ...previous,

          feeStructureId,

          amount:
            selectedStructure?.amount !==
              undefined &&
            selectedStructure?.amount !==
              null
              ? String(
                  selectedStructure.amount
                )
              : previous.amount,
        })
      );
    };

  /* =========================================================
     COLLECT FEE
  ========================================================= */

  const handleCollect =
    async () => {
      if (
        !collectForm.studentId ||
        !collectForm.feeStructureId ||
        !collectForm.academicYearId ||
        !collectForm.amount ||
        !collectForm.paymentMode ||
        !collectForm.paymentDate
      ) {
        alert(
          'Please fill student, fee structure, academic year, amount, payment mode and payment date'
        );

        return;
      }

      const amount =
        parseFloat(
          collectForm.amount
        );

      const discount =
        collectForm.discount
          ? parseFloat(
              collectForm.discount
            )
          : 0;

      const fine =
        collectForm.fine
          ? parseFloat(
              collectForm.fine
            )
          : 0;

      if (
        Number.isNaN(amount) ||
        amount <= 0
      ) {
        alert(
          'Amount must be a number greater than 0'
        );

        return;
      }

      if (
        Number.isNaN(discount) ||
        discount < 0
      ) {
        alert(
          'Discount cannot be negative'
        );

        return;
      }

      if (
        Number.isNaN(fine) ||
        fine < 0
      ) {
        alert(
          'Fine cannot be negative'
        );

        return;
      }

      const netAmount =
        amount -
        discount +
        fine;

      if (netAmount <= 0) {
        alert(
          'Net amount must be greater than 0. Please check amount, discount and fine.'
        );

        return;
      }

      const payload = {
        studentId:
          parseInt(
            collectForm.studentId,
            10
          ),

        feeStructureId:
          parseInt(
            collectForm.feeStructureId,
            10
          ),

        academicYearId:
          parseInt(
            collectForm.academicYearId,
            10
          ),

        amount,
        discount,
        fine,

        paymentMode:
          collectForm.paymentMode,

        paymentDate:
          collectForm.paymentDate,

        chequeNo:
          collectForm.chequeNo?.trim() ||
          undefined,

        bankName:
          collectForm.bankName?.trim() ||
          undefined,

        transactionId:
          collectForm.transactionId?.trim() ||
          undefined,

        remark:
          collectForm.remark?.trim() ||
          undefined,
      };

      try {
        await collectFee(
          payload
        );

        setCollectForm({
          studentId: '',
          feeStructureId: '',
          academicYearId: '',
          amount: '',
          discount: '',
          fine: '',
          paymentMode: 'cash',
          paymentDate: '',
          chequeNo: '',
          bankName: '',
          transactionId: '',
          remark: '',
        });

        setStudentQuery('');
        setStudentOptions([]);
        setStudentSearchError('');

        setCollectModalOpen(
          false
        );

        alert(
          'Payment recorded successfully.'
        );
      } catch (err) {
        console.error(
          'Fee collection failed:',
          err
        );

        alert(
          err.response?.data
            ?.message ||
            err.message ||
            'Failed to record payment'
        );
      }
    };

  /* =========================================================
     CATEGORY COLUMNS
  ========================================================= */

  const categoriesColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },

    {
      header: 'Description',
      accessor: 'description',
    },

    {
      header: 'Active',

      render: (row) =>
        row.isActive
          ? 'Yes'
          : 'No',
    },

    {
      header: 'Actions',

      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCatForm({
                name:
                  row.name,

                description:
                  row.description ||
                  '',
              });

              setCatModalOpen(
                true
              );
            }}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() =>
              handleDeleteCategory(
                row.id
              )
            }
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  /* =========================================================
     STRUCTURE COLUMNS
  ========================================================= */

  const structuresColumns = [
    {
      header: 'Class',

      accessor: (row) =>
        row.class?.name ||
        '—',

      render: (row) =>
        row.class?.name ||
        '—',
    },

    {
      header: 'Category',

      accessor: (row) =>
        row.feeCategory
          ?.name || '—',

      render: (row) =>
        row.feeCategory
          ?.name || '—',
    },

    {
      header: 'Academic Year',

      accessor:
        'academicYearId',
    },

    {
      header: 'Amount',

      accessor:
        'amount',
    },

    {
      header: 'Frequency',

      accessor:
        'frequency',
    },

    {
      header: 'Actions',

      render: () => null,
    },
  ];

  /* =========================================================
     TABS
  ========================================================= */

  const tabs = [
    /* =======================================================
       CATEGORIES
    ======================================================= */

    {
      label: 'Categories',

      content: (
        <Card>
          <CardHeader>
            <CardTitle>
              Fee Categories
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setCatForm({
                    name: '',
                    description:
                      '',
                  });

                  setCatModalOpen(
                    true
                  );
                }}
              >
                <Plus className="w-4 h-4 mr-2" />

                New Category
              </Button>
            </div>

            <DataTable
              columns={
                categoriesColumns
              }
              data={
                categories
              }
            />
          </CardContent>
        </Card>
      ),
    },

    /* =======================================================
       STRUCTURES
    ======================================================= */

    {
      label: 'Structures',

      content: (
        <Card>
          <CardHeader>
            <CardTitle>
              Fee Structures
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={
                handleCreateStructure
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4"
            >
              <Select
                name="academicYearId"
                required
                value={
                  structureForm.academicYearId
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      academicYearId:
                        e.target
                          .value,
                    }
                  )
                }
                options={academicYears.map(
                  (year) => ({
                    value:
                      String(
                        year.id
                      ),

                    label:
                      year.name ||
                      `${new Date(
                        year.startDate
                      ).getFullYear()}-${new Date(
                        year.endDate
                      ).getFullYear()}`,
                  })
                )}
              />

              <Select
                name="classId"
                required
                value={
                  structureForm.classId
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      classId:
                        e.target
                          .value,
                    }
                  )
                }
                options={classes.map(
                  (
                    classItem
                  ) => ({
                    value:
                      String(
                        classItem.id
                      ),

                    label:
                      classItem.name,
                  })
                )}
              />

              <Select
                name="feeCategoryId"
                required
                value={
                  structureForm.feeCategoryId
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      feeCategoryId:
                        e.target
                          .value,
                    }
                  )
                }
                options={categories.map(
                  (
                    category
                  ) => ({
                    value:
                      String(
                        category.id
                      ),

                    label:
                      category.name,
                  })
                )}
              />

              <Input
                name="amount"
                value={
                  structureForm.amount
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      amount:
                        e.target
                          .value,
                    }
                  )
                }
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Amount"
              />

              <Input
                name="frequency"
                value={
                  structureForm.frequency
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      frequency:
                        e.target
                          .value,
                    }
                  )
                }
                placeholder="Frequency (annual/monthly)"
              />

              <Input
                name="dueDay"
                value={
                  structureForm.dueDay
                }
                onChange={(e) =>
                  setStructureForm(
                    {
                      ...structureForm,

                      dueDay:
                        e.target
                          .value,
                    }
                  )
                }
                type="number"
                min="1"
                max="31"
                placeholder="Due Day"
              />

              <div className="md:col-span-3 flex gap-2">
                <Button type="submit">
                  Create Structure
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={
                    loadStructures
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-2" />

                  Refresh
                </Button>
              </div>
            </form>

            <DataTable
              columns={
                structuresColumns
              }
              data={
                structures
              }
            />
          </CardContent>
        </Card>
      ),
    },

    /* =======================================================
       COLLECT
    ======================================================= */

    {
      label: 'Collect',

      content: (
        <Card>
          <CardHeader>
            <CardTitle>
              Collect Fee
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={
                  openCollectModal
                }
              >
                Record Payment
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              Search a student using
              their name, admission
              number or GR number and
              record the fee payment.
            </p>
          </CardContent>
        </Card>
      ),
    },

    /* =======================================================
       STUDENT STATUS
    ======================================================= */

    {
      label: 'Student Status',

      content: (
        <Card>
          <CardHeader>
            <CardTitle>
              Student Fee Status
            </CardTitle>
          </CardHeader>

          <CardContent>
            <StudentStatus />
          </CardContent>
        </Card>
      ),
    },

    /* =======================================================
       COLLECTIONS
    ======================================================= */

    {
      label: 'Collections',

      content: (
        <Card>
          <CardHeader>
            <CardTitle>
              Collections Report
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CollectionsReport />
          </CardContent>
        </Card>
      ),
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Fee
          </h1>

          <p className="text-gray-600 mt-1">
            Manage fee categories,
            structures, and
            collections.
          </p>
        </div>

      </div>

      <Tabs tabs={tabs} />

      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      <Modal
        isOpen={
          isCatModalOpen
        }
        onClose={() =>
          setCatModalOpen(
            false
          )
        }
        title="Create / Edit Fee Category"
      >
        <ModalBody>

          <div className="space-y-3">

            <Input
              placeholder="Name"
              value={
                catForm.name
              }
              onChange={(e) =>
                setCatForm({
                  ...catForm,

                  name:
                    e.target
                      .value,
                })
              }
            />

            <Input
              placeholder="Description"
              value={
                catForm.description
              }
              onChange={(e) =>
                setCatForm({
                  ...catForm,

                  description:
                    e.target
                      .value,
                })
              }
            />

          </div>

        </ModalBody>

        <ModalFooter>

          <Button
            onClick={() =>
              setCatModalOpen(
                false
              )
            }
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            onClick={
              handleCreateCategory
            }
          >
            Save
          </Button>

        </ModalFooter>
      </Modal>

      {/* =====================================================
          COLLECT PAYMENT MODAL
      ===================================================== */}

      <Modal
        isOpen={
          isCollectModalOpen
        }
        onClose={() =>
          setCollectModalOpen(
            false
          )
        }
        title="Record Fee Payment"
      >
        <ModalBody>

          <div className="space-y-4">

            {/* STUDENT SEARCH */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student
              </label>

              <div className="relative">

                <Input
                  placeholder="Enter student name or admission number"
                  value={
                    studentQuery
                  }
                  onChange={(e) => {
                    const value =
                      e.target
                        .value;

                    setStudentQuery(
                      value
                    );

                    searchForStudents(
                      value
                    );
                  }}
                />

                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

              </div>

              <p className="text-xs text-gray-500 mt-1">
                Search using
                Admission No,
                Student Name or
                GR No.
              </p>

            </div>

            {/* SEARCH ERROR */}

            {studentSearchError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">

                <p className="text-xs text-red-700">
                  {
                    studentSearchError
                  }
                </p>

              </div>
            )}

            {/* STUDENT SELECT */}

            <div>

              <Select
                label="Select Student"
                required
                value={
                  collectForm.studentId
                }
                onChange={(e) =>
                  setCollectForm(
                    {
                      ...collectForm,

                      studentId:
                        e.target
                          .value,
                    }
                  )
                }
                options={
                  studentOptions
                }
                placeholder={
                  studentLoading
                    ? 'Searching students...'
                    : studentOptions.length
                      ? 'Select student'
                      : 'No students found'
                }
                disabled={
                  studentLoading
                }
              />

              {!studentLoading &&
                !studentSearchError &&
                studentQuery.trim() &&
                studentOptions.length ===
                  0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No matching
                    student found.
                  </p>
                )}

            </div>

            {/* FEE STRUCTURE */}

            <Select
              label="Fee Structure"
              required
              value={
                collectForm.feeStructureId
              }
              onChange={
                handleFeeStructureChange
              }
              options={structures.map(
                (structure) => ({
                  value:
                    String(
                      structure.id
                    ),

                  label: `${
                    structure
                      .class
                      ?.name ||
                    'Class'
                  } — ${
                    structure
                      .feeCategory
                      ?.name ||
                    'Category'
                  } — ₹${
                    structure.amount
                  }`,
                })
              )}
              placeholder="Select fee structure"
            />

            {/* ACADEMIC YEAR */}

            <Select
              label="Academic Year"
              required
              value={
                collectForm.academicYearId
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  academicYearId:
                    e.target
                      .value,
                })
              }
              options={academicYears.map(
                (year) => ({
                  value:
                    String(
                      year.id
                    ),

                  label:
                    year.name ||
                    `${new Date(
                      year.startDate
                    ).getFullYear()}-${new Date(
                      year.endDate
                    ).getFullYear()}`,
                })
              )}
              placeholder="Select academic year"
            />

            {/* AMOUNT */}

            <Input
              label="Amount"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={
                collectForm.amount
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  amount:
                    e.target
                      .value,
                })
              }
            />

            {/* DISCOUNT */}

            <Input
              label="Discount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Discount"
              value={
                collectForm.discount
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  discount:
                    e.target
                      .value,
                })
              }
            />

            {/* FINE */}

            <Input
              label="Fine"
              type="number"
              min="0"
              step="0.01"
              placeholder="Fine"
              value={
                collectForm.fine
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  fine:
                    e.target
                      .value,
                })
              }
            />

            {/* NET AMOUNT */}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">

              <div className="flex justify-between items-center">

                <span className="text-sm font-medium text-gray-600">
                  Net Amount
                </span>

                <span className="text-lg font-semibold text-gray-900">

                  ₹
                  {(
                    (parseFloat(
                      collectForm.amount
                    ) || 0) -
                    (parseFloat(
                      collectForm.discount
                    ) || 0) +
                    (parseFloat(
                      collectForm.fine
                    ) || 0)
                  ).toFixed(2)}

                </span>

              </div>

            </div>

            {/* PAYMENT MODE */}

            <Select
              label="Payment Mode"
              required
              value={
                collectForm.paymentMode
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  paymentMode:
                    e.target
                      .value,
                })
              }
              options={[
                {
                  value: 'cash',
                  label: 'Cash',
                },

                {
                  value: 'cheque',
                  label: 'Cheque',
                },

                {
                  value: 'online',
                  label: 'Online',
                },

                {
                  value: 'card',
                  label: 'Card',
                },

                {
                  value:
                    'bank_transfer',
                  label:
                    'Bank Transfer',
                },

                {
                  value: 'upi',
                  label: 'UPI',
                },
              ]}
              placeholder="Select payment mode"
            />

            {/* CHEQUE */}

            {collectForm.paymentMode ===
              'cheque' && (
              <>

                <Input
                  label="Cheque Number"
                  value={
                    collectForm.chequeNo
                  }
                  onChange={(e) =>
                    setCollectForm({
                      ...collectForm,

                      chequeNo:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Enter cheque number"
                />

                <Input
                  label="Bank Name"
                  value={
                    collectForm.bankName
                  }
                  onChange={(e) =>
                    setCollectForm({
                      ...collectForm,

                      bankName:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Enter bank name"
                />

              </>
            )}

            {/* BANK TRANSFER */}

            {collectForm.paymentMode ===
              'bank_transfer' && (
              <>

                <Input
                  label="Bank Name"
                  value={
                    collectForm.bankName
                  }
                  onChange={(e) =>
                    setCollectForm({
                      ...collectForm,

                      bankName:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Enter bank name"
                />

                <Input
                  label="Transaction ID"
                  value={
                    collectForm.transactionId
                  }
                  onChange={(e) =>
                    setCollectForm({
                      ...collectForm,

                      transactionId:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Enter transaction ID"
                />

              </>
            )}

            {/* ONLINE / UPI / CARD */}

            {[
              'online',
              'upi',
              'card',
            ].includes(
              collectForm.paymentMode
            ) && (
              <Input
                label="Transaction ID"
                value={
                  collectForm.transactionId
                }
                onChange={(e) =>
                  setCollectForm({
                    ...collectForm,

                    transactionId:
                      e.target
                        .value,
                  })
                }
                placeholder="Enter transaction ID"
              />
            )}

            {/* PAYMENT DATE */}

            <Input
              label="Payment Date"
              required
              type="date"
              value={
                collectForm.paymentDate
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  paymentDate:
                    e.target
                      .value,
                })
              }
            />

            {/* REMARK */}

            <Input
              label="Remark"
              placeholder="Optional remark"
              value={
                collectForm.remark
              }
              onChange={(e) =>
                setCollectForm({
                  ...collectForm,

                  remark:
                    e.target
                      .value,
                })
              }
            />

          </div>

        </ModalBody>

        <ModalFooter>

          <Button
            onClick={() =>
              setCollectModalOpen(
                false
              )
            }
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            onClick={
              handleCollect
            }
            disabled={
              studentLoading ||
              !collectForm.studentId
            }
          >
            Submit Payment
          </Button>

        </ModalFooter>
      </Modal>
    </div>
  );
}

/* =========================================================
   STUDENT STATUS
========================================================= */

function StudentStatus() {
  const [studentOptions, setStudentOptions] =
    useState([]);

  const [studentQuery, setStudentQuery] =
    useState('');

  const [selectedStudentId, setSelectedStudentId] =
    useState('');

  const [academicYearId, setAcademicYearId] =
    useState('');

  const [academicYears, setAcademicYears] =
    useState([]);

  const [status, setStatus] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =========================================================
     LOAD ACADEMIC YEARS
  ========================================================= */

  useEffect(() => {
    const loadAcademicYears =
      async () => {
        try {
          const api =
            await import(
              '../../api/academicYear.api'
            );

          const response =
            await api.getAcademicYears();

          setAcademicYears(
            response?.data || []
          );
        } catch (err) {
          console.error(
            'Failed to load academic years:',
            err
          );
        }
      };

    loadAcademicYears();
  }, []);

  /* =========================================================
     SEARCH STUDENTS
  ========================================================= */

  const searchStudents =
    async (value) => {
      const search =
        value?.trim() || '';

      setStudentQuery(
        value
      );

      setSelectedStudentId(
        ''
      );

      setStatus(null);
      setError('');

      if (!search) {
        setStudentOptions([]);
        return;
      }

      try {
        setSearching(true);

        const response =
          await getStudents({
            page: 1,
            limit: 50,
            search,
          });

        console.log(
          'Student Status search response:',
          response
        );

        const students =
          extractStudents(
            response
          );

        const options =
          buildStudentOptions(
            students
          );

        setStudentOptions(
          options
        );

        if (
          options.length === 0
        ) {
          setError(
            `No student found for "${search}"`
          );
        }
      } catch (err) {
        console.error(
          'Student Status search failed:',
          err
        );

        setStudentOptions([]);

        setError(
          err?.response?.data
            ?.message ||
            err?.response?.data
              ?.error ||
            err?.message ||
            'Failed to search students'
        );
      } finally {
        setSearching(false);
      }
    };

  /* =========================================================
     FETCH FEE STATUS
  ========================================================= */

  const fetchStatus =
    async () => {
      if (!selectedStudentId) {
        alert(
          'Please search and select a student first.'
        );

        return;
      }

      try {
        setLoading(true);
        setError('');

        console.log(
          'Fetching fee status for student:',
          selectedStudentId
        );

        const data =
          await getStudentFeeStatus(
            selectedStudentId,
            academicYearId ||
              undefined
          );

        console.log(
          'Student fee status:',
          data
        );

        setStatus(data);
      } catch (err) {
        console.error(
          'Failed to fetch student fee status:',
          err
        );

        setStatus(null);

        setError(
          err?.response?.data
            ?.message ||
            err?.response?.data
              ?.error ||
            err?.message ||
            'Failed to fetch student fee status'
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     SELECTED STUDENT
  ========================================================= */

  const selectedStudent =
    studentOptions.find(
      (option) =>
        String(option.value) ===
        String(
          selectedStudentId
        )
    )?.student;

  return (
    <div className="space-y-5">

      {/* =====================================================
          SEARCH CARD
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">

        <div className="mb-4">

          <h3 className="text-base font-semibold text-gray-900">
            Search Student
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Search using student name,
            admission number or GR
            number.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* STUDENT SEARCH */}

          <div className="md:col-span-2">

            <Input
              label="Student"
              placeholder="Enter name, admission number or GR number"
              value={
                studentQuery
              }
              onChange={(e) =>
                searchStudents(
                  e.target.value
                )
              }
            />

            {searching && (
              <p className="text-xs text-gray-500 mt-2">
                Searching students...
              </p>
            )}

            {!searching &&
              studentQuery.trim() &&
              studentOptions.length ===
                0 &&
              error && (
                <p className="text-xs text-red-600 mt-2">
                  {error}
                </p>
              )}

          </div>

          {/* ACADEMIC YEAR */}

          <Select
            label="Academic Year"
            value={
              academicYearId
            }
            onChange={(e) =>
              setAcademicYearId(
                e.target.value
              )
            }
            options={academicYears.map(
              (year) => ({
                value:
                  String(
                    year.id
                  ),

                label:
                  year.name ||
                  `${new Date(
                    year.startDate
                  ).getFullYear()}-${new Date(
                    year.endDate
                  ).getFullYear()}`,
              })
            )}
            placeholder="All Academic Years"
          />

        </div>

        {/* ===================================================
            STUDENT RESULT
        =================================================== */}

        {studentOptions.length >
          0 && (
          <div className="mt-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>

            <select
              value={
                selectedStudentId
              }
              onChange={(e) => {
                setSelectedStudentId(
                  e.target.value
                );

                setStatus(null);
                setError('');
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="">
                Select a student
              </option>

              {studentOptions.map(
                (student) => (
                  <option
                    key={
                      student.value
                    }
                    value={
                      student.value
                    }
                  >
                    {
                      student.label
                    }
                  </option>
                )
              )}

            </select>

          </div>
        )}

        {/* ===================================================
            SELECTED STUDENT PREVIEW
        =================================================== */}

        {selectedStudent && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div>
                <p className="text-xs text-gray-500">
                  Student Name
                </p>

                <p className="font-semibold text-gray-900">
                  {selectedStudent.studentName ||
                    selectedStudent.name ||
                    '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Admission Number
                </p>

                <p className="font-semibold text-gray-900">
                  {selectedStudent.admissionNo ||
                    '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  GR Number
                </p>

                <p className="font-semibold text-gray-900">
                  {selectedStudent.grNo ||
                    '—'}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {error &&
          selectedStudentId && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>
          )}

        {/* ===================================================
            FETCH BUTTON
        =================================================== */}

        <div className="mt-5 flex justify-end">

          <Button
            onClick={
              fetchStatus
            }
            disabled={
              loading ||
              !selectedStudentId
            }
          >
            {loading
              ? 'Fetching...'
              : 'Fetch Fee Status'}
          </Button>

        </div>

      </div>

      {/* =====================================================
          STATUS RESULT
      ===================================================== */}

      {status && (
        <div className="space-y-4">

          {/* STUDENT HEADER */}

          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Student Fee Status
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-1">
                  {status.student?.name ||
                    status.student?.studentName ||
                    selectedStudent?.studentName ||
                    selectedStudent?.name ||
                    'Student'}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Admission No:{' '}
                  <span className="font-medium text-gray-700">
                    {status.student
                      ?.admissionNo ||
                      selectedStudent
                        ?.admissionNo ||
                      '—'}
                  </span>
                </p>

              </div>

              {status.student?.class && (
                <div className="text-left md:text-right">

                  <p className="text-xs text-gray-500">
                    Class
                  </p>

                  <p className="font-semibold text-gray-900">
                    {status.student.class}
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-sm text-gray-500">
                Total Owed
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ₹
                {Number(
                  status.totals?.owed ||
                    0
                ).toFixed(2)}
              </p>

            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-sm text-gray-500">
                Total Paid
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ₹
                {Number(
                  status.totals?.paid ||
                    0
                ).toFixed(2)}
              </p>

            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-sm text-gray-500">
                Total Balance
              </p>

              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ₹
                {Number(
                  status.totals?.balance ||
                    0
                ).toFixed(2)}
              </p>

            </div>

          </div>

          {/* BREAKDOWN */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="p-5 border-b border-gray-200">

              <h3 className="font-semibold text-gray-900">
                Fee Breakdown
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Category-wise fee payment
                status.
              </p>

            </div>

            <div className="p-5">

              <DataTable
                columns={[
                  {
                    header:
                      'Category',

                    accessor:
                      'feeCategory',

                    render:
                      (row) =>
                        row.feeCategory ||
                        row.category ||
                        '—',
                  },

                  {
                    header:
                      'Owed',

                    accessor:
                      'owed',

                    render:
                      (row) =>
                        `₹${Number(
                          row.owed ||
                            0
                        ).toFixed(2)}`,
                  },

                  {
                    header:
                      'Paid',

                    accessor:
                      'paid',

                    render:
                      (row) =>
                        `₹${Number(
                          row.paid ||
                            0
                        ).toFixed(2)}`,
                  },

                  {
                    header:
                      'Balance',

                    accessor:
                      'balance',

                    render:
                      (row) =>
                        `₹${Number(
                          row.balance ||
                            0
                        ).toFixed(2)}`,
                  },

                  {
                    header:
                      'Status',

                    accessor:
                      'status',

                    render:
                      (row) => (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            String(
                              row.status ||
                                ''
                            ).toLowerCase() ===
                            'paid'
                              ? 'bg-green-100 text-green-700'
                              : String(
                                    row.status ||
                                      ''
                                  ).toLowerCase() ===
                                  'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.status ||
                            'Pending'}
                        </span>
                      ),
                  },
                ]}
                data={
                  status.breakdown ||
                  []
                }
              />

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   COLLECTIONS REPORT
========================================================= */

function CollectionsReport() {
  const [fromDate, setFromDate] =
    useState('');

  const [toDate, setToDate] =
    useState('');

  const [report, setReport] =
    useState(null);

  const fetchReport =
    async () => {
      try {
        const data =
          await getCollectionsByDateRange(
            fromDate ||
              undefined,

            toDate ||
              undefined
          );

        setReport(data);
      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            err.message ||
            'Failed to fetch collections'
        );
      }
    };

  return (
    <div>

      <div className="flex gap-2 mb-4">

        <Input
          type="date"
          value={
            fromDate
          }
          onChange={(e) =>
            setFromDate(
              e.target.value
            )
          }
        />

        <Input
          type="date"
          value={
            toDate
          }
          onChange={(e) =>
            setToDate(
              e.target.value
            )
          }
        />

        <Button
          onClick={
            fetchReport
          }
        >
          Fetch
        </Button>

      </div>

      {report && (
        <div>

          <div className="mb-3">

            From:{' '}

            {new Date(
              report.fromDate
            ).toLocaleDateString()}

            {' '}To:{' '}

            {new Date(
              report.toDate
            ).toLocaleDateString()}

            {' '}Total:{' '}

            {
              report.totalCollected
            }

            {' '}Count:{' '}

            {
              report.count
            }

          </div>

          <DataTable
            columns={[
              {
                header:
                  'Receipt',

                accessor:
                  'receiptNo',
              },

              {
                header:
                  'Student',

                accessor:
                  (row) =>
                    row.student
                      ?.studentName ||
                    '—',

                render:
                  (row) =>
                    row.student
                      ?.studentName ||
                    '—',
              },

              {
                header:
                  'Amount',

                accessor:
                  'netAmount',
              },

              {
                header:
                  'Date',

                accessor:
                  (row) =>
                    new Date(
                      row.paymentDate
                    ).toLocaleDateString(),

                render:
                  (row) =>
                    new Date(
                      row.paymentDate
                    ).toLocaleDateString(),
              },
            ]}
            data={
              report.collections ||
              []
            }
          />

        </div>
      )}

    </div>
  );
}