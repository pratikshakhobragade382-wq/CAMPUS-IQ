import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './staff.css';
const ROLES = ['teacher','accountant','librarian','clerk','receptionist','nurse','counselor','coordinator','lab_assistant','peon','driver','security','other'];

export default function AddStaff() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({employeeId:'',name:'',email:'',password:'',phone:'',gender:'',dateOfJoining:'',role:'teacher',departmentId:'',salary:''});

  useEffect(() => {
    axiosClient.get('/departments').then(r => setDepartments(r.data?.data || [])).catch(() => setDepartments([]));
  }, []);
  const change = e => setForm(f => ({...f,[e.target.name]:e.target.value}));
  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await axiosClient.post('/staff',{...form,identity:'staff',departmentId:form.departmentId||undefined,salary:form.salary||undefined,dateOfJoining:form.dateOfJoining||undefined});
      navigate('/staff');
    } catch(err) { setError(err.response?.data?.error || 'Failed to create staff'); }
    finally { setLoading(false); }
  };

  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <h1>Add Staff</h1>{error && <div className="auth-error">{error}</div>}
    <label>Employee ID<input name="employeeId" value={form.employeeId} onChange={change} required /></label>
    <label>Name<input name="name" value={form.name} onChange={change} required /></label>
    <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
    <label>Login Password<input type="password" name="password" value={form.password} onChange={change} minLength="8" required /></label>
    <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
    <label>Gender<select name="gender" value={form.gender} onChange={change}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
    <label>Date of Joining<input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={change} /></label>
    <label>Role<select name="role" value={form.role} onChange={change}>{ROLES.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select></label>
    <label>Department<select name="departmentId" value={form.departmentId} onChange={change}><option value="">No department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Salary<input type="number" name="salary" value={form.salary} onChange={change} /></label>
    <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={()=>navigate('/staff')}>Cancel</button><button disabled={loading} className="btn btn-primary">{loading?'Saving...':'Create Staff'}</button></div>
  </form></div>;
}
