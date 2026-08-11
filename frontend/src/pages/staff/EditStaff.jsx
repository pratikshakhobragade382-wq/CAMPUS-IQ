import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ROLES = ['teacher','accountant','librarian','clerk','receptionist','nurse','counselor','coordinator','lab_assistant','peon','driver','security','other'];

export default function EditStaff() {
  const { id } = useParams(), navigate = useNavigate();
  const [departments,setDepartments]=useState([]), [form,setForm]=useState(null), [error,setError]=useState(''), [loading,setLoading]=useState(true), [saving,setSaving]=useState(false);

  useEffect(() => {
    Promise.all([axiosClient.get(`/staff/${id}`),axiosClient.get('/departments').catch(()=>({data:{data:[]}}))])
      .then(([s,d]) => {
        const x=s.data?.data;
        setForm({employeeId:x.employeeId||'',name:x.name||'',email:x.email||'',phone:x.phone||'',gender:x.gender||'',dateOfJoining:x.dateOfJoining?.slice(0,10)||'',role:x.role||'teacher',departmentId:x.departmentId||'',salary:x.salary??''});
        setDepartments(d.data?.data||[]);
      }).catch(e=>setError(e.response?.data?.error||'Failed to load staff')).finally(()=>setLoading(false));
  },[id]);

  const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const submit=async e=>{
    e.preventDefault();setSaving(true);setError('');
    try { await axiosClient.put(`/staff/${id}`,{...form,departmentId:form.departmentId||null,salary:form.salary===''?null:Number(form.salary),dateOfJoining:form.dateOfJoining||null});navigate('/staff'); }
    catch(e){setError(e.response?.data?.error||'Failed to update staff');} finally{setSaving(false);}
  };

  if(loading)return <div className="page">Loading staff...</div>;
  if(!form)return <div className="page auth-error">{error||'Staff not found'}</div>;

  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <h1>Edit Staff</h1>{error&&<div className="auth-error">{error}</div>}
    <label>Employee ID<input name="employeeId" value={form.employeeId} onChange={change} required /></label>
    <label>Name<input name="name" value={form.name} onChange={change} required /></label>
    <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
    <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
    <label>Gender<select name="gender" value={form.gender} onChange={change}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
    <label>Date of Joining<input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={change} /></label>
    <label>Role<select name="role" value={form.role} onChange={change}>{ROLES.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select></label>
    <label>Department<select name="departmentId" value={form.departmentId} onChange={change}><option value="">No department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Salary<input type="number" name="salary" value={form.salary} onChange={change} /></label>
    <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={()=>navigate('/staff')}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving?'Saving...':'Save Changes'}</button></div>
  </form></div>;
}
