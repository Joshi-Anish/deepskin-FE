import { Bell, ChevronLeft, LogOut, Menu, ShieldCheck, Stethoscope, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { statusLabel, verdictLabel } from '../utils/format';

export function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark"><Stethoscope size={compact ? 16 : 20} /></span>
      <span>DeepSkin <strong>Medical</strong></span>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{statusLabel[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority}`}>{priority?.[0]?.toUpperCase() + priority?.slice(1)}</span>;
}

export function VerdictBadge({ verdict }) {
  if (!verdict) return null;
  return <span className={`badge verdict-${verdict}`}>{verdictLabel[verdict]}</span>;
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <img src="/assets/empty-state.svg" alt="" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <div>
        {back && <button className="icon-button back-button" onClick={() => navigate(back)} aria-label="Go back"><ChevronLeft /></button>}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}

const patientNav = [
  ['/patient/dashboard', 'Dashboard'],
  ['/patient/new-case', 'New Case'],
  ['/patient/cases', 'My Cases'],
  ['/patient/messages', 'Messages'],
  ['/profile', 'Profile'],
];

const doctorNav = [
  ['/doctor/queue', 'Case Queue'],
  ['/doctor/active', 'My Active Cases'],
  ['/doctor/messages', 'Messages'],
  ['/profile', 'Profile'],
];

const adminNav = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/doctors', 'Doctor Management'],
  ['/admin/audit', 'Audit Log'],
  ['/profile', 'Profile'],
];

export function AppShell({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = role === 'patient' ? patientNav : role === 'doctor' ? doctorNav : adminNav;

  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`app-shell role-${role}`}>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <Brand />
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)}><X /></button>
        </div>
        <div className="sidebar-user">
          <div className="avatar">{user?.fullName?.split(' ').filter(Boolean).slice(-1)[0]?.[0] || 'U'}</div>
          <div><strong>{user?.fullName}</strong><span>{role}</span></div>
        </div>
        <nav>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>
          ))}
        </nav>
        <button className="logout-button" onClick={doLogout}><LogOut size={18} /> Logout</button>
      </aside>
      {open && <button className="scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setOpen(true)}><Menu /></button>
          <Brand compact />
          <div className="topbar-actions"><Bell size={19} /><div className="avatar small">{user?.fullName?.[0]}</div></div>
        </header>
        <main className="content">{children}</main>
      </div>
      {role === 'patient' && <PatientBottomNav />}
    </div>
  );
}

function PatientBottomNav() {
  return (
    <nav className="bottom-nav">
      {patientNav.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
          <span>{label === 'Dashboard' ? '▦' : label === 'New Case' ? '＋' : label === 'My Cases' ? '▤' : label === 'Messages' ? '✉' : '◉'}</span>
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

export function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose}><X /></button></div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function SecureNote({ children }) {
  return <div className="secure-note"><ShieldCheck size={18} /> <span>{children}</span></div>;
}
