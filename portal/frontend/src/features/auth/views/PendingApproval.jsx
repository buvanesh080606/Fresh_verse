import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import GlassContainer from '../../../components/ui/GlassContainer';
import { ShieldAlert, RefreshCw, LogOut, CheckCircle } from 'lucide-react';

const PendingApproval = () => {
  const { user, fetchCurrentUser, logout, isAuthenticated, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

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
    return <Navigate to="/login" replace />;
  }

  // If user is already approved, send them to their dashboard
  const isApproved = user.role === 'student' 
    ? user.is_approved 
    : (user.is_superadmin || user.is_approved_admin);

  if (isApproved) {
    const target = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCurrentUser();
    } catch (err) {
      console.error(err);
    } finally {
      // Small timeout for better UX feel
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat transition-colors duration-300"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-md">
        <GlassContainer className="p-8 border border-brand-border/30 dark:border-brand-border-dark/30 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-brand-text dark:text-brand-text-dark">
              Approval Pending
            </h2>
            <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/65 max-w-xs mx-auto">
              {user.role === 'admin'
                ? "Your administrator account has been created. Access to the Admin Dashboard requires approval from the Superadmin."
                : "Your student profile has been submitted successfully. Please wait while an administrator approves your access."
              }
            </p>
          </div>

          <div className="p-4 bg-brand-bg/30 dark:bg-brand-bg-dark/40 rounded-2xl border border-brand-border/10 text-[11px] font-bold text-brand-text/80 dark:text-brand-text-dark/80 w-full space-y-1.5 text-left">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-accent">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-600 dark:text-amber-400">Awaiting Permission</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full pt-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-accent/25 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking Status...' : 'Check Approval Status'}
            </button>

            <button
              onClick={logout}
              className="w-full py-3 rounded-xl border border-brand-border/40 hover:bg-rose-500/10 hover:text-rose-500 text-brand-text dark:text-brand-text-dark text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </GlassContainer>
      </div>
    </div>
  );
};

export default PendingApproval;
