import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import ResearchHome from './pages/ResearchHome';
import TrustworthyXAI from './pages/TrustworthyXAI';
import PersonalizedNutrition from './pages/PersonalizedNutrition';
import PrivacyRecalibration from './pages/PrivacyRecalibration';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import GISMap from './pages/GISMap';
import ResourcePlanning from './pages/ResourcePlanning';
import ClinicStaff from './pages/ClinicStaff';
import EarlyWarning from './pages/EarlyWarning';
import TrendAnalysis from './pages/TrendAnalysis';
import ExplainableAI from './pages/ExplainableAI';
import DistrictDetails from './pages/DistrictDetails';
import Dataset from './pages/Dataset';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/research-home" replace /> : <Login />}
      />

      <Route
        path="/research-home"
        element={
          <ProtectedRoute>
            <ResearchHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/component/trustworthy-xai"
        element={
          <ProtectedRoute>
            <TrustworthyXAI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/component/personalized-nutrition"
        element={
          <ProtectedRoute>
            <PersonalizedNutrition />
          </ProtectedRoute>
        }
      />
      <Route
        path="/component/privacy-recalibration"
        element={
          <ProtectedRoute>
            <PrivacyRecalibration />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/research-home" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="gis-map" element={<GISMap />} />
        <Route path="resource-planning" element={<ResourcePlanning />} />
        <Route path="clinic-staff" element={<ClinicStaff />} />
        <Route path="early-warning" element={<EarlyWarning />} />
        <Route path="trend-analysis" element={<TrendAnalysis />} />
        <Route path="explainable-ai" element={<ExplainableAI />} />
        <Route path="district-details" element={<DistrictDetails />} />
        <Route path="dataset" element={<Dataset />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/research-home' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#0B1F4D',
              color: '#fff',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
