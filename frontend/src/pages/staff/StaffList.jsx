import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './staff.css';   // 👈 add this line

const ROLES = ['teacher','accountant','librarian','clerk','receptionist','nurse','counselor','coordinator','lab_assistant','peon','driver','security','other'];

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const loadStaff = async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      const res = await axiosClient.get('/staff', { params });
      const data = res.data?.data || {};
      setStaff(data.staff || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load staff');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStaff(); }, [page, role]);

  const submitSearch = e => { e.preventDefault(); setPage(1); loadStaff(); };

  const removeStaff = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try { await axiosClient.delete(`/staff/${id}`); loadStaff(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete staff'); }
  };

  return <div className="page">
    <div className="page-header">
      <div><h1>Staff Management</h1><p>Manage teachers and school staff.</p></div>
      <Link to="/staff/new" className="btn btn-primary">+ Add Staff</Link>
    </div>

    <form className="filters" onSubmit={submitSearch}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email or employee ID" />
      <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
        <option value="">All roles</option>
        {ROLES.map(r => <option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}
      </select>
      <button className="btn btn-primary" type="submit">Search</button>
    </form>

    {error && <div className="auth-error">{error}</div>}
    {loading ? <div>Loading staff...</div> : <div className="table-wrap">
      <table className="data-table">
        <thead><tr>
          <th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th>
          <th>Department</th><th>Phone</th><th>Login</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {staff.length === 0 ? <tr><td colSpan="8">No staff found.</td></tr> :
            staff.map(s => <tr key={s.id}>
              <td>{s.employeeId}</td><td>{s.name}</td><td>{s.email}</td>
              <td>{s.role || '-'}</td><td>{s.department?.name || '-'}</td>
              <td>{s.phone || '-'}</td><td>{s.user ? 'Yes' : 'No'}</td>
              <td>
                <Link className="btn btn-secondary" to={`/staff/${s.id}/edit`}>Edit</Link>{' '}
                <button className="btn btn-danger" onClick={() => removeStaff(s.id, s.name)}>Delete</button>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>}

    {pagination.totalPages > 1 && <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
      <span>Page {page} of {pagination.totalPages}</span>
      <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
    </div>}
  </div>;
}
