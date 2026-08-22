import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './Layout';

import Login from './screens/Login';
import ProjectList from './screens/ProjectList';
import ProjectSetup from './screens/ProjectSetup';
import RequirementsConstraints from './screens/RequirementsConstraints';
import CandidateAlternatives from './screens/CandidateAlternatives';
import TrialRecommendation from './screens/TrialRecommendation';
import TrialResult from './screens/TrialResult';
import UpdatedRecommendation from './screens/UpdatedRecommendation';
import ProjectDashboard from './screens/ProjectDashboard';
import AdminPanel from './screens/AdminPanel';
import NotFound from './screens/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/new" element={<ProjectSetup />} />
              <Route path="/projects/:id/setup" element={<ProjectSetup />} />
              <Route path="/projects/:id/requirements" element={<RequirementsConstraints />} />
              <Route path="/projects/:id/materials" element={<CandidateAlternatives />} />
              <Route path="/projects/:id/recommendation" element={<TrialRecommendation />} />
              <Route path="/projects/:id/trial-result" element={<TrialResult />} />
              <Route path="/projects/:id/updated-recommendation" element={<UpdatedRecommendation />} />
              <Route path="/projects/:id/dashboard" element={<ProjectDashboard />} />

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
