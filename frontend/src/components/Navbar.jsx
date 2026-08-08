import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-title">Welcome, {user?.name}</div>
      <div className="navbar-right">
        <span className="navbar-role">{user?.identity}</span>
        <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
