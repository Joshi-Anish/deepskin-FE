import { useMemo, useRef, useState } from 'react';
import { Camera, Check, ChevronRight, Clock, ImagePlus, MessageSquare, Plus, RotateCcw, Send, UploadCloud } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader, StatusBadge, VerdictBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatDate, formatDateTime, verdictLabel } from '../utils/format';

function PatientShell({ children }) {
  return <AppShell role="patient">{children}</AppShell>;
}

function CaseCard({ item, doctor }) {
  return (
    <article className="patient-case-card">
      <img src={item.image} alt="Submitted skin lesion" />
      <div className="case-card-body">
        <div className="case-card-top"><strong>{item.id}</strong><StatusBadge status={item.status} /></div>
        <p>Submitted {formatDate(item.submittedAt)}</p>
        <span>{doctor ? doctor.fullName : item.status === 'pending' ? 'Awaiting assignment' : 'Doctor assigned'}</span>
      </div>
      <Link to={`/patient/cases/${item.id}`} className="icon-link" aria-label="View case"><ChevronRight /></Link>
    </article>
  );
}

export function PatientDashboard() {
  const { user } = useAuth();
  const { cases, users } = useAppData();
  const patientCases = useMemo(() => cases.filter((item) => item.patientId === user.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)), [cases, user.id]);
  const counts = { total: patientCases.length, pending: patientCases.filter((c) => c.status === 'pending').length, inReview: patientCases.filter((c) => c.status === 'inReview').length, reviewed: patientCases.filter((c) => c.status === 'reviewed').length };
  return (
    <PatientShell>
      <div className="mobile-welcome"><span>Welcome back,</span><h1>Hello, {user.fullName.split(' ')[0]}</h1></div>
      <Link className="primary-button full hero-action" to="/patient/new-case"><Plus size={18} /> Create New Case</Link>
      <section className="section-block"><div className="section-label">Overview</div><div className="stats-grid patient-stats">
        <div><span>Total Cases</span><strong>{counts.total}</strong></div><div><span>Pending</span><strong>{counts.pending}</strong></div><div><span>In Review</span><strong>{counts.inReview}</strong></div><div><span>Reviewed</span><strong>{counts.reviewed}</strong></div>
      </div></section>
      <section className="section-block"><div className="section-head"><h2>Your Cases</h2><Link to="/patient/cases">View All</Link></div>
        <div className="case-list">{patientCases.slice(0, 3).map((item) => <CaseCard key={item.id} item={item} doctor={users.find((u) => u.id === item.assignedDoctorId)} />)}</div>
      </section>
    </PatientShell>
  );
}

export function PatientCases({ reviewedOnly = false }) {
  const { user } = useAuth();
  const { cases, users } = useAppData();
  const [filter, setFilter] = useState('all');
  const items = cases.filter((item) => item.patientId === user.id).filter((item) => reviewedOnly ? item.status === 'reviewed' : true).filter((item) => filter === 'all' || (reviewedOnly ? item.verdict === filter : item.status === filter));
  return (
    <PatientShell>
      <PageHeader title={reviewedOnly ? 'My Case History' : 'My Cases'} subtitle={reviewedOnly ? 'Review your past doctor assessments and recommendations.' : 'Track every lesion you have submitted.'} actions={reviewedOnly ? <Link className="secondary-button small" to="/patient/cases">All Cases</Link> : <Link className="secondary-button small" to="/patient/history">Reviewed History</Link>} />
      <div className="filter-chips">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        {reviewedOnly ? ['reassure','monitor','recommendBiopsy','referSpecialist'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{verdictLabel[value]}</button>) : ['pending','inReview','reviewed'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'inReview' ? 'In Review' : value[0].toUpperCase()+value.slice(1)}</button>)}
      </div>
      {items.length ? <div className="case-list roomy">{items.map((item) => <CaseCard key={item.id} item={item} doctor={users.find((u) => u.id === item.assignedDoctorId)} />)}</div> : <EmptyState title="No cases found" text="Cases matching this filter will appear here." />}
    </PatientShell>
  );
}

export function NewCasePage() {
  const { user } = useAuth();
  const { createCase } = useAppData();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [image, setImage] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadFile(file) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/jpg','image/svg+xml'].includes(file.type)) return setError('Please upload a JPG or PNG image.');
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result); setError(''); };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!image) return setError('Please add a clear image before submitting.');
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const created = createCase({ patientId: user.id, image, note });
    setBusy(false);
    navigate(`/patient/cases/${created.id}`, { state: { submitted: true } });
  }

  return (
    <PatientShell>
      <div className="stepper"><div className={step >= 1 ? 'active' : ''}><span>1</span><small>Photo</small></div><i /><div className={step >= 2 ? 'active' : ''}><span>2</span><small>Details</small></div><i /><div className={step >= 3 ? 'active' : ''}><span>3</span><small>Review</small></div></div>
      {step === 1 && <>
        <PageHeader title="Capture the lesion" subtitle="For an accurate review, provide one clear image of one lesion." />
        <div className="instruction-card"><strong>Photo instructions</strong><ul><li>Use bright, natural lighting.</li><li>Keep the lesion in clear focus.</li><li>Avoid filters or editing.</li><li>One lesion per case submission.</li></ul></div>
        <button className={`upload-zone ${image ? 'has-image' : ''}`} onClick={() => inputRef.current?.click()}>{image ? <img src={image} alt="Selected lesion" /> : <><span><Camera /></span><strong>Upload Photo</strong><small>Camera or Gallery</small></>}</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
        {image && <div className="form-row"><button className="secondary-button" onClick={() => inputRef.current?.click()}><RotateCcw size={17}/> Retake / Replace</button><button className="link-button danger" onClick={() => setImage('')}>Remove</button></div>}
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button full sticky-action" disabled={!image} onClick={() => setStep(2)}>Continue</button>
      </>}
      {step === 2 && <>
        <PageHeader title="Add a note" subtitle="Tell the doctor what you noticed. This step is optional." />
        <div className="form-card"><label>Describe anything you noticed<textarea maxLength="500" rows="7" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: It has been itchy for two weeks and recently changed colour." /></label><div className="char-count">{note.length}/500</div></div>
        <div className="form-row sticky-action"><button className="secondary-button" onClick={() => setStep(1)}>Back</button><button className="primary-button" onClick={() => setStep(3)}>Review Case</button></div>
      </>}
      {step === 3 && <>
        <PageHeader title="Review your case" subtitle="Check the image and note before sending them to a doctor." />
        <div className="review-card"><img src={image} alt="Lesion preview" /><div><span>Optional note</span><p>{note || 'No note provided.'}</p></div></div>
        <label className="check-row consent"><input type="checkbox" defaultChecked /> I consent to secure image processing and doctor review.</label>
        <div className="alert info">Patients never see the model prediction, confidence score, or attention map. Only the doctor’s final assessment is shown.</div>
        <div className="form-row sticky-action"><button className="secondary-button" onClick={() => setStep(2)}>Back</button><button className="primary-button" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit Case'}</button></div>
      </>}
    </PatientShell>
  );
}

export function PatientCaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { cases, users, addMessage, updateCase } = useAppData();
  const extraImageRef = useRef(null);
  const item = cases.find((entry) => entry.id === id && entry.patientId === user.id);
  const [text, setText] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  if (!item) return <Navigate to="/patient/cases" replace />;
  const doctor = users.find((u) => u.id === item.assignedDoctorId);
  const send = () => { addMessage(item.id, user.id, text); setText(''); };

  const uploadRequestedImage = (file) => {
    if (!file || !['image/jpeg','image/png','image/jpg'].includes(file.type)) return;
    setImageBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateCase(item.id, { additionalImages: [...(item.additionalImages || []), reader.result], imageRequested: false }, { actor: user.fullName, action: 'Additional image uploaded', from: item.status, to: item.status });
      addMessage(item.id, user.id, 'I uploaded the additional image you requested.');
      setImageBusy(false);
    };
    reader.readAsDataURL(file);
  };
  return (
    <PatientShell>
      <PageHeader title="Case Detail" subtitle={`${item.id} · Submitted ${formatDate(item.submittedAt)}`} back="/patient/cases" />
      <div className="patient-detail-grid">
        <section className="case-image-panel"><img src={item.image} alt="Submitted lesion" /><div><span>Current status</span><StatusBadge status={item.status} /></div></section>
        <section className="detail-card"><h2>Case update</h2>{item.status !== 'reviewed' ? <div className="waiting-state"><Clock /><strong>{item.status === 'pending' ? 'Waiting for a doctor' : 'A doctor is reviewing your photo'}</strong><p>You will receive a notification when the review is complete.</p></div> : <><div className="doctor-verdict-card"><span>Doctor’s Verdict</span><VerdictBadge verdict={item.verdict} /><h3>{verdictLabel[item.verdict]}</h3><p>{item.recommendation}</p>{item.monitoringPeriod && <div className="monitor-note">Review period: {item.monitoringPeriod}</div>}</div><div className="reviewing-practitioner"><div className="avatar">{doctor?.fullName?.split(' ').slice(-1)[0]?.[0]}</div><div><strong>{doctor?.fullName}</strong><span>{doctor?.specialization}</span></div></div></>}
        </section>
      </div>
      <section className="detail-card"><h2>Your note</h2><p>{item.note || 'No note was provided.'}</p></section>
      {item.imageRequested && item.status !== 'reviewed' && <section className="detail-card requested-image"><h2>Doctor requested another image</h2><p>Please upload one clearer image of the same lesion. This option is available only because your assigned doctor requested it.</p><input ref={extraImageRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e)=>uploadRequestedImage(e.target.files?.[0])}/><button className="primary-button" disabled={imageBusy} onClick={()=>extraImageRef.current?.click()}><ImagePlus size={17}/>{imageBusy?'Uploading…':'Upload Requested Image'}</button></section>}
      {(item.additionalImages || []).length > 0 && <section className="detail-card"><h2>Additional image</h2><div className="additional-image-list">{item.additionalImages.map((image,index)=><img key={index} src={image} alt={`Additional lesion ${index+1}`}/>)}</div></section>}
      {doctor && <section className="detail-card message-panel"><div className="section-head"><h2>Messages</h2><span>{doctor.fullName}</span></div><div className="message-thread">{item.messages.length ? item.messages.map((message) => <div key={message.id} className={`message ${message.senderId === user.id ? 'mine' : ''}`}><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></div>) : <p className="muted">No messages yet.</p>}</div><div className="message-composer"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Write a message…" /><button onClick={send}><Send size={18}/></button></div><small className="medical-warning">This messaging feature is not an emergency service.</small></section>}
    </PatientShell>
  );
}

export function PatientMessages() {
  const { user } = useAuth();
  const { cases, users } = useAppData();
  const items = cases.filter((item) => item.patientId === user.id && item.assignedDoctorId).sort((a,b) => new Date(b.submittedAt)-new Date(a.submittedAt));
  return <PatientShell><PageHeader title="Messages" subtitle="Open a case to continue the conversation with its assigned doctor." />{items.length ? <div className="message-inbox">{items.map((item) => { const doctor=users.find((u)=>u.id===item.assignedDoctorId); const last=item.messages[item.messages.length-1]; return <Link key={item.id} to={`/patient/cases/${item.id}`}><div className="avatar">{doctor?.fullName?.slice(-1)}</div><div><strong>{doctor?.fullName}</strong><span>{item.id}</span><p>{last?.text || 'No messages yet.'}</p></div><ChevronRight /></Link>; })}</div> : <EmptyState title="No conversations" text="A conversation will appear after a doctor picks up your case." />}</PatientShell>;
}
