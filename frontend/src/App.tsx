import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import RedTeamMutator from './pages/RedTeamMutator';
import ThreatMatrix from './pages/ThreatMatrix';
import RemediationWorkshop from './pages/RemediationWorkshop';
import Targets from './pages/Targets';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import NewAssessment from './pages/NewAssessment';
import Findings from './pages/Findings';
import Reports from './pages/Reports';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="playground" element={<Playground />} />
            <Route path="redteam" element={<RedTeamMutator />} />
            <Route path="remediation" element={<RemediationWorkshop />} />
            <Route path="matrix" element={<ThreatMatrix />} />
            <Route path="targets" element={<Targets />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="assessments/new" element={<NewAssessment />} />
            <Route path="assessments/:id" element={<AssessmentDetail />} />
            <Route path="findings" element={<Findings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
