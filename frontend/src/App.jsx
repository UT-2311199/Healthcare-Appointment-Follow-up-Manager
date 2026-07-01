import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster }       from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion }        from 'framer-motion';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider }            from './context/AuthContext';
import { NotificationProvider }    from './context/NotificationContext';
import ProtectedRoute              from './components/common/ProtectedRoute';
import Navbar                      from './components/common/Navbar';
import Sidebar                     from './components/common/Sidebar';

// ── Auth Pages ──
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// ── Patient Pages ──
import PatientDashboard  from './pages/patient/PatientDashboard';
import SearchDoctors     from './pages/patient/SearchDoctors';
import BookAppointment   from './pages/patient/BookAppointment';
import MyAppointments    from './pages/patient/MyAppointments';
import PatientApptDetail from './pages/patient/AppointmentDetail';

// ── Doctor Pages ──
import DoctorDashboard   from './pages/doctor/DoctorDashboard';
import TodayAppointments from './pages/doctor/TodayAppointments';
import DoctorApptDetail  from './pages/doctor/AppointmentDetail';
import DoctorProfile     from './pages/doctor/DoctorProfile';

// ── Admin Pages ──
import AdminDashboard  from './pages/admin/AdminDashboard';
import ManageDoctors   from './pages/admin/ManageDoctors';
import AllAppointments from './pages/admin/AllAppointments';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ── App Layout ──
function AppLayout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-h-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}

// ── Themed Toast ──
function ThemedToaster() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background:     isDark
            ? 'rgba(15,23,42,0.97)'
            : 'rgba(255,255,255,0.97)',
          color:          isDark ? '#f8fafc' : '#0f172a',
          border:         isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
          borderRadius:   '14px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          fontSize:       '14px',
          fontWeight:     '500',
          boxShadow:      isDark
            ? '0 20px 40px rgba(0,0,0,0.5)'
            : '0 10px 30px rgba(0,0,0,0.12)',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary:   '#10b981',
            secondary: isDark ? '#f8fafc' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary:   '#ef4444',
            secondary: isDark ? '#f8fafc' : '#ffffff',
          },
        },
      }}
    />
  );
}

// ── All Routes ──
function AppRoutes() {
  return (
    <>
      <ThemedToaster />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<Navigate to="/login" replace />} />

        {/* Patient */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard"        element={<PatientDashboard />}  />
          <Route path="search"           element={<SearchDoctors />}     />
          <Route path="book/:doctorId"   element={<BookAppointment />}   />
          <Route path="appointments"     element={<MyAppointments />}    />
          <Route path="appointments/:id" element={<PatientApptDetail />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Doctor */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard"        element={<DoctorDashboard />}   />
          <Route path="appointments"     element={<TodayAppointments />} />
          <Route path="appointments/:id" element={<DoctorApptDetail />}  />
          <Route path="profile"          element={<DoctorProfile />}     />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard"    element={<AdminDashboard />}  />
          <Route path="doctors"      element={<ManageDoctors />}   />
          <Route path="appointments" element={<AllAppointments />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// ── Root App ──
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}