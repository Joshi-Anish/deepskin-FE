import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { PatientCaseDetail, PatientCases, PatientDashboard, PatientMessages, NewCasePage } from './pages/PatientPages';
import { DoctorActiveCases, DoctorApplicationStatus, DoctorCaseDetail, DoctorMessages, DoctorQueue } from './pages/DoctorPages';
import { AdminDashboard, AuditLog, DoctorManagement } from './pages/AdminPages';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  if (user.role === 'doctor' && user.verificationStatus !== 'approved') return <Navigate to="/doctor/application-status" replace />;
  return children;
}

function homeFor(user) {
  if (!user) return '/login';
  if (user.role === 'patient') return '/patient/dashboard';
  if (user.role === 'doctor') return user.verificationStatus === 'approved' ? '/doctor/queue' : '/doctor/application-status';
  return '/admin/dashboard';
}

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/doctor/application-status" element={<DoctorApplicationStatus />} />

      <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/new-case" element={<ProtectedRoute roles={['patient']}><NewCasePage /></ProtectedRoute>} />
      <Route path="/patient/cases" element={<ProtectedRoute roles={['patient']}><PatientCases /></ProtectedRoute>} />
      <Route path="/patient/history" element={<ProtectedRoute roles={['patient']}><PatientCases reviewedOnly /></ProtectedRoute>} />
      <Route path="/patient/cases/:id" element={<ProtectedRoute roles={['patient']}><PatientCaseDetail /></ProtectedRoute>} />
      <Route path="/patient/messages" element={<ProtectedRoute roles={['patient']}><PatientMessages /></ProtectedRoute>} />

      <Route path="/doctor/queue" element={<ProtectedRoute roles={['doctor']}><DoctorQueue /></ProtectedRoute>} />
      <Route path="/doctor/active" element={<ProtectedRoute roles={['doctor']}><DoctorActiveCases /></ProtectedRoute>} />
      <Route path="/doctor/cases/:id" element={<ProtectedRoute roles={['doctor']}><DoctorCaseDetail /></ProtectedRoute>} />
      <Route path="/doctor/messages" element={<ProtectedRoute roles={['doctor']}><DoctorMessages /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute roles={['admin']}><DoctorManagement /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AuditLog /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute roles={['patient','doctor','admin']}><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
