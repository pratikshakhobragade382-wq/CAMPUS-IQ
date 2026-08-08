import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/staff')
      .then((res) => setStaff(res.data.data.staff || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load staff'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading staff...</div>;
  if (error) return <div className="page auth-error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Staff</h1>
        <Link to="/staff/new" className="btn btn-primary">+ Add Staff</Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Phone</th>
            <th>Login</th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 && (
            <tr><td colSpan={7}>No staff yet.</td></tr>
          )}
          {staff.map((s) => (
            <tr key={s.id}>
              <td>{s.employeeId}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.role || '-'}</td>
              <td>{s.department?.name || '-'}</td>
              <td>{s.phone || '-'}</td>
              <td>{s.user ? '✅' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
