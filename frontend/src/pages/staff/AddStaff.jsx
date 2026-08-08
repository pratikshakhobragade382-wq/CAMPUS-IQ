import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ROLES = ['teacher', 'accountant', 'librarian', 'clerk', 'receptionist', 'nurse', 'counselor', 'coordinator', 'lab_assistant', 'peon', 'driver', 'security', 'other'];

export default function AddStaff() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    employeeId: '', name: '', email: '', password: '',
    phone: '', gender: '', dateOfJoining: '', role: 'teacher',
    departmentId: '', salary: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosClient.get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        identity: 'staff',
        departmentId: form.departmentId || undefined,
        salary: form.salary || undefined,
        dateOfJoining: form.dateOfJoining || undefined,
      };
      await axiosClient.post('/staff', payload);
      setSuccess(`${form.name} added successfully as ${form.role}.`);
      setTimeout(() => navigate('/staff'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Add Staff</h1>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <label>Employee ID</label>
        <input name="employeeId" value={form.employeeId} onChange={handleChange} required />

        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Login Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />

        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} />

        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label>Date of Joining</label>
        <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} />

        <label>Role</label>
        <select name="role" value={form.role} onChange={handleChange}>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>

        <label>Department</label>
        <select name="departmentId" value={form.departmentId} onChange={handleChange}>
          <option value="">None</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <label>Salary</label>
        <input type="number" name="salary" value={form.salary} onChange={handleChange} />

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Staff'}
        </button>
      </form>
    </div>
  );
}
