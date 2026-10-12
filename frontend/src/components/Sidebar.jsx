import React from 'react';
import { Compass, LayoutDashboard, Search, FolderKanban, FileCheck2, Settings, GraduationCap, Sparkles, Workflow } from 'lucide-react';
const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'discover', label: 'Discover scholarships', icon: Search },
  { id: 'applications', label: 'My applications', icon: FolderKanban },
  { id: 'agent', label: 'Agent workflow', icon: Workflow },
  { id: 'documents', label: 'Document vault', icon: FileCheck2 },
];
export default function Sidebar({ active, onChange, applicationCount = 0, userName, userInitials }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><GraduationCap size={22}/></div><div><b>scholarpath<span>.</span></b><small>STUDENT FUNDING OS</small></div></div>
    <div className="workspace-label">WORKSPACE</div>
    <nav>{items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} aria-label={label} title={label} aria-current={active === id ? 'page' : undefined} onClick={() => onChange(id)}><Icon size={18}/><span>{label}</span>{id === 'applications' && applicationCount > 0 && <em>{applicationCount}</em>}</button>)}</nav>
    <div className="sidebar-spacer"/>
    <div className="sidebar-promo"><div className="promo-icon"><Sparkles size={18}/></div><b>Let AI do the legwork.</b><p>Investigate requirements, spot missing documents, and keep every application moving.</p><button onClick={() => onChange('discover')}>Explore opportunities <Compass size={14}/></button></div>
    <button className="nav-item settings-item" aria-label="Settings" title="Settings" aria-current={active === 'settings' ? 'page' : undefined} onClick={() => onChange('settings')}><Settings size={18}/><span>Settings</span></button>
    <div className="profile-mini"><div className="avatar">{userInitials}</div><div><b>{userName || 'Student'}</b><small>Student workspace</small></div><span className="online-dot"/></div>
  </aside>;
}
