import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axios';

const emptyForm = {
  admissionNo: '', studentName: '', classId: '', sectionId: '',
  rollNo: '', gender: '', dateOfBirth: '',
  fatherName: '', fatherMobile: '', fatherEmail: '',
  motherName: '', motherMobile: '', motherEmail: '',
};

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null); // parentCredentials from API, shown in modal after create

  useEffect(() => {
    axiosClient.get('/classes').then((res) => {
      setClasses(res.data.data?.classes || res.data.data || []);
    }).catch(() => {});

    if (isEdit) {
      axiosClient.get(`/students/${id}`).then((res) => {
        const s = res.data.data;
        const father = (s.parents || []).find((p) => p.relation === 'father');
        const mother = (s.parents || []).find((p) => p.relation === 'mother');
        setForm({
          admissionNo: s.admissionNo || '',
          studentName: s.studentName || '',
          classId: s.classId || '',
          sectionId: s.sectionId || '',
          rollNo: s.rollNo || '',
          gender: s.gender || '',
          dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
          fatherName: father?.name || s.fatherName || '',
          fatherMobile: father?.mobile || '',
          fatherEmail: father?.email || '',
          motherName: mother?.name || s.motherName || '',
          motherMobile: mother?.mobile || '',
          motherEmail: mother?.email || '',
        });
      }).catch((err) => setError(err.response?.data?.error || 'Failed to load student'));
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const {
        fatherName, fatherMobile, fatherEmail,
        motherName, motherMobile, motherEmail,
        ...rest
      } = form;

      const payload = {
        ...rest,
        classId: Number(form.classId),
        sectionId: form.sectionId ? Number(form.sectionId) : undefined,
      };

      // Only send father/mother if a name was entered — avoids creating
      // empty StudentParent rows when the admin leaves these blank.
      if (fatherName) {
        payload.father = { name: fatherName, mobile: fatherMobile || undefined, email: fatherEmail || undefined };
      }
      if (motherName) {
        payload.mother = { name: motherName, mobile: motherMobile || undefined, email: motherEmail || undefined };
      }

      if (isEdit) {
        await axiosClient.put(`/students/${id}`, payload);
        navigate('/students');
      } else {
        const res = await axiosClient.post('/students', payload);
        const parentCredentials = res.data.data?.parentCredentials || [];
        if (parentCredentials.length > 0) {
          // Show the generated logins once, instead of navigating away
          // immediately — the admin needs to note these down.
          setCredentials(parentCredentials);
        } else {
          navigate('/students');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">{isEdit ? 'Edit Student' : 'Add Student'}</h1>

      {credentials && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="form-card" style={{ maxWidth: 480, width: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Student Registered</h2>
            <p>Parent login credentials were created. Please share these with the parents — they won't be shown again.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 8px' }}>Relation</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 8px' }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 8px' }}>Password</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={c.email}>
                    <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{c.relation}</td>
                    <td style={{ padding: '6px 8px' }}>{c.email}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setCredentials(null); navigate('/students'); }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="form-grid">
          <div>
            <label>Admission No</label>
            <input name="admissionNo" value={form.admissionNo} onChange={handleChange} required />
          </div>
          <div>
            <label>Student Name</label>
            <input name="studentName" value={form.studentName} onChange={handleChange} required />
          </div>
          <div>
            <label>Class</label>
            <select name="classId" value={form.classId} onChange={handleChange} required>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Roll No</label>
            <input name="rollNo" value={form.rollNo} onChange={handleChange} />
          </div>
          <div>
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label>Date of Birth</label>
            <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
          </div>
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>Father's Details</h3>
        <div className="form-grid">
          <div>
            <label>Father's Name</label>
            <input name="fatherName" value={form.fatherName} onChange={handleChange} />
          </div>
          <div>
            <label>Father's Mobile</label>
            <input name="fatherMobile" value={form.fatherMobile} onChange={handleChange} placeholder="10-digit mobile number" />
          </div>
          <div>
            <label>Father's Email</label>
            <input type="email" name="fatherEmail" value={form.fatherEmail} onChange={handleChange} placeholder="Used for parent login" />
          </div>
        </div>
        {form.fatherEmail && form.fatherMobile && (
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem' }}>
            A parent login will be created for this email (password: last 6 digits of mobile).
          </p>
        )}

        <h3 style={{ marginTop: '1.5rem' }}>Mother's Details</h3>
        <div className="form-grid">
          <div>
            <label>Mother's Name</label>
            <input name="motherName" value={form.motherName} onChange={handleChange} />
          </div>
          <div>
            <label>Mother's Mobile</label>
            <input name="motherMobile" value={form.motherMobile} onChange={handleChange} placeholder="10-digit mobile number" />
          </div>
          <div>
            <label>Mother's Email</label>
            <input type="email" name="motherEmail" value={form.motherEmail} onChange={handleChange} placeholder="Used for parent login" />
          </div>
        </div>
        {form.motherEmail && form.motherMobile && (
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.5rem' }}>
            A parent login will be created for this email (password: last 6 digits of mobile).
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/students')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
