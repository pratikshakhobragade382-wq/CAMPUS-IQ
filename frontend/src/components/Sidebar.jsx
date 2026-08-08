import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const baseLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/students', label: 'Students', icon: '🎓' },
];

const adminLinks = [
  { to: '/staff', label: 'Staff', icon: '👥' },
  { to: '/users/new', label: 'Add User', icon: '➕' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const links = user?.identity === 'admin' ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">School ERP</div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
