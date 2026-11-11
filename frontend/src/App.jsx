import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './Layout';
import ProjectLayout from './ProjectLayout';

import Landing from './screens/Landing';
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
          <Route path="/" element={<Landing />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/new" element={<ProjectSetup />} />
              <Route path="/projects/:id" element={<ProjectLayout />}>
                <Route path="setup" element={<ProjectSetup />} />
                <Route path="requirements" element={<RequirementsConstraints />} />
                <Route path="materials" element={<CandidateAlternatives />} />
                <Route path="recommendation" element={<TrialRecommendation />} />
                <Route path="trial-result" element={<TrialResult />} />
                <Route path="updated-recommendation" element={<UpdatedRecommendation />} />
                <Route path="dashboard" element={<ProjectDashboard />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

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
