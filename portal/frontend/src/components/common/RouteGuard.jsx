import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-bg dark:bg-brand-bg-dark">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent/25 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle role restrictions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect appropriately
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export const OnboardingRoute = ({ children }) => {
  const { user, profile, loading, isAuthenticated } = useAuth();

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-bg dark:bg-brand-bg-dark">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-accent/25 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check onboarding status based on role
  const isOnboarded = user.role === 'admin'
    ? !!(user.first_name && user.last_name)
    : !!profile;

  // If already onboarded, redirect to their respective dashboard
  if (isOnboarded) {
    const target = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

export const MainAppRoute = ({ children }) => {
  const { user, profile, loading, isAuthenticated } = useAuth();

  // Wait for auth state to finish loading before making redirect decisions
  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-bg dark:bg-brand-bg-dark">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-accent/25 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If student is not onboarded, force onboarding
  if (user.role === 'student' && !profile) {
    return <Navigate to="/onboard" replace />;
  }

  // If admin is not onboarded (no name), force onboarding
  if (user.role === 'admin' && !(user.first_name && user.last_name)) {
    return <Navigate to="/onboard" replace />;
  }

  // If student is not approved, redirect to pending approval page
  if (user.role === 'student' && !user.is_approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If admin is not approved/superadmin, redirect to pending approval page
  if (user.role === 'admin' && !user.is_superadmin && !user.is_approved_admin) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};
