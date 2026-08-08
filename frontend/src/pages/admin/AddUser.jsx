import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function AddUser() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', tenantId: 1, identity: 'student',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axiosClient.post('/auth/register', form);
      setSuccess(`${form.name} added successfully as ${form.identity}.`);
      setForm({ name: '', email: '', password: '', tenantId: 1, identity: 'student' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Add User</h1>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Temporary Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />

        <label>Tenant ID</label>
        <input type="number" name="tenantId" value={form.tenantId} onChange={handleChange} required />

        <label>Identity</label>
        <select name="identity" value={form.identity} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}
