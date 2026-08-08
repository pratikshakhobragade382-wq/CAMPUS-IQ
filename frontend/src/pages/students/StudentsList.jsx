import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function StudentsList() {
  const { user } = useAuth();
  const isParent = user?.identity === 'parent';

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/students', { params: { search } });
      setStudents(res.data.data?.students || res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await axiosClient.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        {!isParent && (
          <Link to="/students/new" className="btn btn-primary">+ Add Student</Link>
        )}
      </div>

      <input
        className="search-input"
        placeholder="Search by name, admission no, GR no..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="auth-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Admission No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Roll No</th>
              <th>Gender</th>
              {!isParent && <th></th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No students found</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td>{s.admissionNo}</td>
                  <td>{s.studentName}</td>
                  <td>{s.class?.name || s.classId}</td>
                  <td>{s.rollNo || '-'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{s.gender || '-'}</td>
                  {!isParent && (
                    <td className="row-actions">
                      <Link to={`/students/${s.id}/edit`} className="btn btn-small">Edit</Link>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
