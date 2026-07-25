import { useMemo, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, Search, ShieldAlert, UserCheck, UserX, Users } from 'lucide-react';
import { AppShell, EmptyState, Modal, PageHeader, PriorityBadge, StatusBadge, VerdictBadge } from '../components/ui';
import { useAppData } from '../context/AppDataContext';
import { formatDate, formatDateTime, verdictLabel } from '../utils/format';

function AdminShell({ children }) { return <AppShell role="admin">{children}</AppShell>; }

export function AdminDashboard() {
  const { users, cases, audit, model, triggerRetraining } = useAppData();
  const doctors = users.filter((u)=>u.role==='doctor');
  const reviewed = cases.filter((c)=>c.status==='reviewed');
  const avgMinutes = reviewed.length ? Math.round(reviewed.reduce((sum,c)=>sum + Math.max(0,(new Date(c.reviewedAt)-new Date(c.submittedAt))/60000),0)/reviewed.length) : 0;
  const verdictCounts = ['reassure','monitor','recommendBiopsy','referSpecialist'].map((v)=>({label:verdictLabel[v],count:reviewed.filter(c=>c.verdict===v).length}));
  const maxVerdict = Math.max(1,...verdictCounts.map(v=>v.count));
  return (
    <AdminShell>
      <PageHeader title="Admin Dashboard" subtitle="Operational oversight for DeepSkin queues, doctors, audit activity, and model lifecycle." />
      <div className="stats-grid admin-stats"><div><Users/><span>Total patients</span><strong>{users.filter(u=>u.role==='patient').length}</strong></div><div><UserCheck/><span>Active doctors</span><strong>{doctors.filter(d=>d.status==='active'&&d.verificationStatus==='approved').length}</strong></div><div><ShieldAlert/><span>Pending applications</span><strong>{doctors.filter(d=>d.verificationStatus==='pending').length}</strong></div><div><Activity/><span>Queue length</span><strong>{cases.filter(c=>c.status==='pending').length}</strong></div><div><RefreshCw/><span>In review</span><strong>{cases.filter(c=>c.status==='inReview').length}</strong></div><div><CheckCircle2/><span>Avg. time to review</span><strong>{avgMinutes}m</strong></div></div>
      <div className="admin-grid">
        <section className="detail-card"><div className="section-head"><h2>Verdict Distribution</h2><span>{reviewed.length} reviewed</span></div><div className="bar-list">{verdictCounts.map((item)=><div key={item.label}><div><span>{item.label}</span><strong>{item.count}</strong></div><i><b style={{width:`${(item.count/maxVerdict)*100}%`}}/></i></div>)}</div></section>
        <section className="detail-card"><div className="section-head"><h2>Queue Status</h2><span>Current</span></div><div className="donut-placeholder"><div><strong>{cases.length}</strong><span>Total cases</span></div></div><div className="legend"><span><i className="pending"/>Pending {cases.filter(c=>c.status==='pending').length}</span><span><i className="inReview"/>In Review {cases.filter(c=>c.status==='inReview').length}</span><span><i className="reviewed"/>Reviewed {reviewed.length}</span></div></section>
        <section className="detail-card model-card"><div className="section-head"><h2>Model Retraining</h2><span>{model.version}</span></div><dl className="analysis-list"><div><dt>Status</dt><dd>{model.status}</dd></div><div><dt>Last retrained</dt><dd>{formatDate(model.lastRetrainedAt)}</dd></div><div><dt>Reviewed cases available</dt><dd>{reviewed.length}</dd></div></dl><div className="progress-bar"><i style={{width:`${model.progress}%`}}/></div><button className="primary-button" disabled={['Preparing Data','Training','Evaluating'].includes(model.status)} onClick={triggerRetraining}>Start Retraining</button></section>
        <section className="detail-card activity-card"><div className="section-head"><h2>Recent Activity</h2><span>Audit events</span></div><div className="activity-list">{audit.slice(0,6).map((entry)=><div key={entry.id}><i/><div><strong>{entry.action}</strong><span>{entry.caseId||entry.actor} · {formatDateTime(entry.at)}</span></div></div>)}</div></section>
      </div>
    </AdminShell>
  );
}

export function DoctorManagement() {
  const { users, reviewDoctor, toggleDoctorStatus } = useAppData();
  const [filter,setFilter]=useState('all');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState(null);
  const [reason,setReason]=useState('');
  const doctors=users.filter(u=>u.role==='doctor').filter(d=>filter==='all'||d.verificationStatus===filter||d.status===filter).filter(d=>(d.fullName+d.email+d.medicalLicense).toLowerCase().includes(query.toLowerCase()));
  return (
    <AdminShell>
      <PageHeader title="Doctor Management" subtitle="Review self-submitted doctor applications and manage approved accounts." />
      <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search doctor, email, licence"/></div><div className="filter-chips compact">{['all','pending','approved','rejected','deactivated'].map(v=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Doctor</th><th>Specialization</th><th>Licence</th><th>Verification</th><th>Account</th><th></th></tr></thead><tbody>{doctors.map((doctor)=><tr key={doctor.id}><td><strong>{doctor.fullName}</strong><small>{doctor.email}</small></td><td>{doctor.specialization||'—'}</td><td>{doctor.medicalLicense||'—'}</td><td><span className={`application-status ${doctor.verificationStatus}`}>{doctor.verificationStatus}</span></td><td>{doctor.status}</td><td><button className="secondary-button small" onClick={()=>setSelected(doctor)}>Review</button></td></tr>)}</tbody></table></div>
      {selected&&<Modal title="Doctor application review" onClose={()=>{setSelected(null);setReason('')}} actions={<><button className="secondary-button" onClick={()=>{toggleDoctorStatus(selected.id);setSelected(null)}}>{selected.status==='deactivated'?'Reactivate':'Deactivate'}</button>{selected.verificationStatus!=='approved'&&<button className="danger-button" onClick={()=>{reviewDoctor(selected.id,'rejected',reason||'Application could not be verified.');setSelected(null)}}>Reject</button>}<button className="primary-button" onClick={()=>{reviewDoctor(selected.id,'approved','');setSelected(null)}}>Approve</button></>}><div className="doctor-application"><dl><div><dt>Name</dt><dd>{selected.fullName}</dd></div><div><dt>Email</dt><dd>{selected.email}</dd></div><div><dt>Specialization</dt><dd>{selected.specialization}</dd></div><div><dt>Medical licence</dt><dd>{selected.medicalLicense}</dd></div><div><dt>Hospital</dt><dd>{selected.hospital||'—'}</dd></div><div><dt>Experience</dt><dd>{selected.yearsExperience||0} years</dd></div></dl><div className="document-list">{(selected.documents||[]).map(doc=><span key={doc}>📄 {doc}</span>)}</div><label>Reason / reviewer note<textarea rows="3" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Required when rejecting or requesting changes."/></label></div></Modal>}
    </AdminShell>
  );
}

export function AuditLog() {
  const { audit }=useAppData();
  const [query,setQuery]=useState('');
  const [action,setAction]=useState('all');
  const actions=useMemo(()=>['all',...new Set(audit.map(a=>a.action))],[audit]);
  const rows=audit.filter(a=>action==='all'||a.action===action).filter(a=>JSON.stringify(a).toLowerCase().includes(query.toLowerCase()));
  return <AdminShell><PageHeader title="Audit Log" subtitle="Searchable history of case, doctor, messaging, and model actions."/><div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search case, actor, verdict"/></div><select value={action} onChange={(e)=>setAction(e.target.value)}>{actions.map(a=><option key={a}>{a}</option>)}</select></div>{rows.length?<div className="data-table-wrap"><table className="data-table"><thead><tr><th>Timestamp</th><th>Case</th><th>Actor</th><th>Action</th><th>Status change</th><th>Verdict</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{formatDateTime(row.at)}</td><td>{row.caseId||'—'}</td><td>{row.actor}</td><td>{row.action}</td><td>{row.from||'—'} → {row.to||'—'}</td><td>{row.verdict?<VerdictBadge verdict={row.verdict}/>: '—'}</td></tr>)}</tbody></table></div>:<EmptyState title="No audit events" text="No events match the current search and filter."/>}</AdminShell>;
}
