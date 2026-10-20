import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages (lazy imports for code splitting)
import { lazy, Suspense } from 'react';
import PageLoader from './components/common/PageLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const GoogleCallbackPage = lazy(() => import('./pages/auth/GoogleCallbackPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TripPlannerPage = lazy(() => import('./pages/TripPlannerPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const HotelsPage = lazy(() => import('./pages/HotelsPage'));
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MapPage = lazy(() => import('./pages/MapPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            </Route>

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/plan" element={<TripPlannerPage />} />
                <Route path="/trips" element={<MyTripsPage />} />
                <Route path="/trips/:id" element={<TripDetailPage />} />
                <Route path="/hotels" element={<HotelsPage />} />
                <Route path="/hotels/:id" element={<HotelDetailPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/map" element={<MapPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
