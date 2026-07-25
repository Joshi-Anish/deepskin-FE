import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Eye, ImageIcon, Layers3, Search, Send, SlidersHorizontal } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell, EmptyState, Modal, PageHeader, PriorityBadge, StatusBadge, VerdictBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate, formatDateTime, timeAgo, verdictLabel } from '../utils/format';

function DoctorShell({ children }) { return <AppShell role="doctor">{children}</AppShell>; }

export function DoctorApplicationStatus() {
  const { user, logout } = useAuth();
  if (!user || user.role !== 'doctor') return <Navigate to="/login" replace />;
  const status = user.verificationStatus;
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon"><Clock3 /></div>
        <h1>Doctor Application</h1>
        <span className={`application-status ${status}`}>{status === 'pending' ? 'Pending Review' : status === 'rejected' ? 'Rejected' : 'More Information Required'}</span>
        <p>{status === 'pending' ? 'Your professional information has been submitted. Doctor tools remain locked until an administrator approves your application.' : user.verificationReason || 'Please contact the administrator for more information.'}</p>
        <dl><div><dt>Name</dt><dd>{user.fullName}</dd></div><div><dt>Specialization</dt><dd>{user.specialization}</dd></div><div><dt>Medical licence</dt><dd>{user.medicalLicense}</dd></div><div><dt>Hospital / Clinic</dt><dd>{user.hospital || '—'}</dd></div></dl>
        <button className="secondary-button full" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export function DoctorQueue() {
  const { user } = useAuth();
  const { cases, pickupCase } = useAppData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const queue = useMemo(() => cases.filter((item) => item.status === 'pending' && !item.assignedDoctorId)
    .filter((item) => filter === 'all' || item.priority === filter)
    .filter((item) => item.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => ({high:3,medium:2,low:1}[b.priority]-({high:3,medium:2,low:1}[a.priority]) || new Date(a.submittedAt)-new Date(b.submittedAt))), [cases, filter, search]);

  const pickup = () => {
    const result = pickupCase(confirm.id, user.id);
    if (!result.ok) { setError(result.message); setConfirm(null); return; }
    navigate(`/doctor/cases/${confirm.id}`);
  };

  return (
    <DoctorShell>
      <PageHeader title="Shared Case Queue" subtitle="Unassigned cases are triaged by coarse priority. Full AI detail is revealed only after pickup." actions={<button className="secondary-button">Refresh</button>} />
      <div className="stats-grid wide"><div><span>Waiting cases</span><strong>{cases.filter(c=>c.status==='pending'&&!c.assignedDoctorId).length}</strong></div><div><span>High priority</span><strong>{cases.filter(c=>c.status==='pending'&&c.priority==='high').length}</strong></div><div><span>Oldest wait</span><strong>{queue[queue.length-1] ? timeAgo(queue[queue.length-1].submittedAt) : '—'}</strong></div></div>
      <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search case ID" /></div><div className="filter-chips compact">{['all','high','medium','low'].map(v=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>
      {error && <div className="alert error">{error}</div>}
      {queue.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Preview</th><th>Case ID</th><th>Waiting</th><th>Priority</th><th></th></tr></thead><tbody>{queue.map((item)=><tr key={item.id}><td><img className="table-thumb" src={item.image} alt="Lesion thumbnail" /></td><td><strong>{item.id}</strong><small>Unassigned</small></td><td>{timeAgo(item.submittedAt)}</td><td><PriorityBadge priority={item.priority}/></td><td><button className="primary-button small" onClick={()=>setConfirm(item)}>Pick Up Case</button></td></tr>)}</tbody></table></div> : <EmptyState title="Queue is clear" text="No unassigned cases match this filter." />}
      {confirm && <Modal title="Pick up this case for review?" onClose={()=>setConfirm(null)} actions={<><button className="secondary-button" onClick={()=>setConfirm(null)}>Cancel</button><button className="primary-button" onClick={pickup}>Confirm Pickup</button></>}><p>You will be assigned to <strong>{confirm.id}</strong>. The case will disappear from every other doctor’s queue.</p></Modal>}
    </DoctorShell>
  );
}

export function DoctorActiveCases() {
  const { user } = useAuth();
  const { cases, users } = useAppData();
  const active = cases.filter((item)=>item.assignedDoctorId===user.id && item.status==='inReview');
  return <DoctorShell><PageHeader title="My Active Cases" subtitle="Cases you have picked up but not yet finalized." />{active.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Preview</th><th>Case</th><th>Patient</th><th>Picked up</th><th>Status</th><th></th></tr></thead><tbody>{active.map((item)=>{const patient=users.find(u=>u.id===item.patientId); return <tr key={item.id}><td><img className="table-thumb" src={item.image} alt=""/></td><td><strong>{item.id}</strong></td><td>{patient?.fullName}</td><td>{timeAgo(item.assignedAt)}</td><td><StatusBadge status={item.status}/></td><td><Link className="primary-button small" to={`/doctor/cases/${item.id}`}>Continue Review</Link></td></tr>})}</tbody></table></div> : <EmptyState title="No active cases" text="Pick up a case from the shared queue to begin a review." action={<Link className="primary-button" to="/doctor/queue">Open Queue</Link>} />}</DoctorShell>;
}

export function DoctorCaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { cases, users, submitVerdict, addMessage, updateCase } = useAppData();
  const navigate = useNavigate();
  const item = cases.find((entry)=>entry.id===id && entry.assignedDoctorId===user.id);
  const [heatmap, setHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(55);
  const [compare, setCompare] = useState(false);
  const [form, setForm] = useState({ verdict: item?.verdict || '', recommendation: item?.recommendation || '', monitoringPeriod: item?.monitoringPeriod || '', clinicalNotes: item?.clinicalNotes || '', message: '' });
  const [confirm, setConfirm] = useState(false);
  const [messageText, setMessageText] = useState('');
  if (!item) return <Navigate to="/doctor/active" replace />;
  const patient = users.find((entry)=>entry.id===item.patientId);
  const history = cases.filter((entry)=>entry.patientId===patient.id && entry.id!==item.id && entry.status==='reviewed').sort((a,b)=>new Date(b.reviewedAt)-new Date(a.reviewedAt));
  const set = (name,value)=>setForm((current)=>({...current,[name]:value}));
  const submit = ()=>{ submitVerdict(item.id,user.id,form); setConfirm(false); navigate('/doctor/active'); };
  const saveDraft = ()=>updateCase(item.id,{ draft: form },{ actor:user.fullName, action:'Draft saved', from:'inReview', to:'inReview' });
  const send = ()=>{ addMessage(item.id,user.id,messageText); setMessageText(''); };
  const requestImage = ()=>{
    updateCase(item.id,{ imageRequested:true },{ actor:user.fullName, action:'Additional image requested', from:item.status, to:item.status });
    addMessage(item.id,user.id,'Please upload one clearer image of the same lesion using bright, even lighting.');
  };

  return (
    <DoctorShell>
      <PageHeader title={`Review ${item.id}`} subtitle={`Assigned ${formatDateTime(item.assignedAt)}`} back="/doctor/active" actions={<StatusBadge status={item.status}/>} />
      <div className="doctor-review-grid">
        <section className="review-column image-review-column">
          <div className="panel-head"><div><ImageIcon size={18}/><strong>Image Review</strong></div><button className="secondary-button small" onClick={()=>setCompare(v=>!v)}>{compare?'Overlay view':'Side-by-side'}</button></div>
          <div className={`image-comparison ${compare?'side-by-side':''}`}><div className="image-stage"><img src={item.image} alt="Original lesion" />{heatmap && <div className="heatmap-overlay" style={{opacity:opacity/100}}/>}<span>Original {heatmap?'with AI overlay':''}</span></div>{compare&&<div className="image-stage"><img src={item.image} alt="Original lesion without overlay"/><span>Raw image</span></div>}</div>
          {(item.additionalImages || []).length > 0 && <div className="doctor-additional-images"><strong>Patient-provided follow-up image</strong><div>{item.additionalImages.map((image,index)=><img key={index} src={image} alt={`Follow-up lesion ${index+1}`}/>)}</div></div>}
          <div className="heatmap-controls"><label className="switch-row"><input type="checkbox" checked={heatmap} onChange={(e)=>setHeatmap(e.target.checked)}/> Attention map overlay</label><label>Opacity <input type="range" min="0" max="100" value={opacity} disabled={!heatmap} onChange={(e)=>setOpacity(e.target.value)}/><span>{opacity}%</span></label></div>
        </section>

        <section className="review-column ai-column">
          <div className="panel-head"><div><Layers3 size={18}/><strong>AI Analysis</strong></div><PriorityBadge priority={item.priority}/></div>
          <div className={`ai-result ${item.aiPrediction}`}><span>Model prediction</span><strong>{item.aiPrediction === 'malignant' ? 'Malignant pattern' : 'Benign pattern'}</strong><div className="confidence"><i style={{width:`${item.confidence*100}%`}}/><span>{Math.round(item.confidence*100)}% confidence</span></div></div>
          <dl className="analysis-list"><div><dt>Model</dt><dd>EfficientNetB2 + CBAM</dd></div><div><dt>Processed</dt><dd>{formatDateTime(item.submittedAt)}</dd></div><div><dt>Priority</dt><dd><PriorityBadge priority={item.priority}/></dd></div></dl>
          <div className="alert warning"><AlertTriangle size={18}/> AI output supports triage and clinical review. It is not a final diagnosis.</div>
        </section>

        <section className="review-column patient-column">
          <div className="panel-head"><div><Eye size={18}/><strong>Patient Information</strong></div></div>
          <div className="patient-summary"><div className="avatar large">{patient.fullName[0]}</div><div><strong>{patient.fullName}</strong><span>{patient.email}</span></div></div>
          <dl className="analysis-list"><div><dt>Age</dt><dd>{patient.dateOfBirth ? Math.floor((Date.now()-new Date(patient.dateOfBirth))/(365.25*24*3600*1000)) : '—'}</dd></div><div><dt>Submitted</dt><dd>{formatDate(item.submittedAt)}</dd></div><div className="full"><dt>Patient note</dt><dd>{item.note || 'No note provided.'}</dd></div></dl>
          <details className="history-panel"><summary>View Patient History ({history.length})</summary>{history.length ? history.map((past)=><details key={past.id} className="history-item history-detail"><summary><img src={past.image} alt=""/><div><strong>{past.id}</strong><span>{formatDate(past.reviewedAt)}</span><VerdictBadge verdict={past.verdict}/></div></summary><p>{past.recommendation}</p></details>) : <p>No previous reviewed cases.</p>}</details>
        </section>
      </div>

      <div className="doctor-lower-grid">
        <section className="detail-card verdict-form"><h2>Structured Verdict</h2><div className="verdict-options">{[['reassure','Reassure'],['monitor','Monitor'],['recommendBiopsy','Recommend Biopsy'],['referSpecialist','Refer to Specialist']].map(([value,label])=><label key={value} className={form.verdict===value?'selected':''}><input type="radio" name="verdict" value={value} checked={form.verdict===value} onChange={()=>set('verdict',value)}/><span>{label}</span></label>)}</div>
          <label>Patient recommendation<textarea rows="5" value={form.recommendation} onChange={(e)=>set('recommendation',e.target.value)} placeholder="Write a clear patient-friendly explanation and next step."/></label>
          {form.verdict==='monitor' && <label>Monitoring period<select value={form.monitoringPeriod} onChange={(e)=>set('monitoringPeriod',e.target.value)}><option value="">Select period</option><option>2 weeks</option><option>4 weeks</option><option>8 weeks</option><option>12 weeks</option><option>Custom period</option></select></label>}
          <label>Clinical notes <small>(doctor/admin only)</small><textarea rows="3" value={form.clinicalNotes} onChange={(e)=>set('clinicalNotes',e.target.value)} /></label>
          <label>Message to patient<textarea rows="3" value={form.message} onChange={(e)=>set('message',e.target.value)} placeholder="Optional message sent with the verdict."/></label>
          {item.status === 'reviewed' ? <div className="alert success"><CheckCircle2 size={18}/> This verdict has been finalized and is locked for normal editing.</div> : <div className="form-row wrap-actions"><button className="secondary-button" onClick={requestImage}>Request Another Image</button><button className="secondary-button" onClick={saveDraft}>Save Draft</button><button className="primary-button" disabled={!form.verdict||!form.recommendation.trim()} onClick={()=>setConfirm(true)}>Send Verdict</button></div>}
        </section>
        <section className="detail-card message-panel"><div className="section-head"><h2>Case Messages</h2><span>Async thread</span></div><div className="message-thread doctor-thread">{item.messages.length?item.messages.map(message=><div key={message.id} className={`message ${message.senderId===user.id?'mine':''}`}><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></div>):<p className="muted">No messages yet.</p>}</div><div className="message-composer"><input value={messageText} onChange={(e)=>setMessageText(e.target.value)} placeholder="Message the patient…"/><button onClick={send}><Send size={18}/></button></div></section>
      </div>
      {confirm&&<Modal title="Send this verdict to the patient?" onClose={()=>setConfirm(false)} actions={<><button className="secondary-button" onClick={()=>setConfirm(false)}>Cancel</button><button className="primary-button" onClick={submit}>Send Verdict</button></>}><div className="confirmation-summary"><strong>{verdictLabel[form.verdict]}</strong><p>{form.recommendation}</p>{form.message&&<blockquote>{form.message}</blockquote>}</div></Modal>}
    </DoctorShell>
  );
}

export function DoctorMessages() {
  const { user } = useAuth();
  const { cases, users } = useAppData();
  const active=cases.filter(c=>c.assignedDoctorId===user.id);
  return <DoctorShell><PageHeader title="Messages" subtitle="Patient conversations attached to your assigned cases." />{active.length?<div className="message-inbox desktop">{active.map(item=>{const patient=users.find(u=>u.id===item.patientId);const last=item.messages[item.messages.length-1];return <Link key={item.id} to={`/doctor/cases/${item.id}`}><div className="avatar">{patient?.fullName?.[0]}</div><div><strong>{patient?.fullName}</strong><span>{item.id}</span><p>{last?.text||'No messages yet.'}</p></div><StatusBadge status={item.status}/></Link>})}</div>:<EmptyState title="No conversations" text="Messages appear after you pick up a case."/>}</DoctorShell>;
}
