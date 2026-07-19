import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassContainer from '../../../components/ui/GlassContainer';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';
import api from '../../../utils/api';
import FreshverseLogo from '../../../components/ui/FreshverseLogo';

const Login = () => {
  const { emailLogin, emailRegister, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState('signin');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Auth Configuration State
  const [googleClientId, setGoogleClientId] = useState('');

  // Sign In
  const [siEmail, setSiEmail] = useState('');
  const [siPass, setSiPass] = useState('');
  const [siShowPass, setSiShowPass] = useState(false);

  // Sign Up
  const [suFirstName, setSuFirstName] = useState('');
  const [suLastName, setSuLastName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suRole, setSuRole] = useState('student');
  const [suPass, setSuPass] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPass, setSuShowPass] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);

  // 1. Fetch Configuration on Mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('auth/config/');
        setGoogleClientId(response.data.google_client_id);
      } catch (err) {
        console.error('Error fetching auth config:', err);
      }
    };
    fetchConfig();
  }, []);

  // 2. Load Google Script & Initialize
  useEffect(() => {
    if (googleClientId) {
      // Dynamically load Google GSI client library if not already present
      if (!document.getElementById('google-gsi-client')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      const initGoogle = () => {
        if (window.google) {
          const btn = document.getElementById('googleRealBtn');
          if (btn) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleRealGoogleResponse,
            });
            window.google.accounts.id.renderButton(
              btn,
              { theme: 'outline', size: 'large', width: 380 }
            );
          } else {
            setTimeout(initGoogle, 100);
          }
        } else {
          setTimeout(initGoogle, 100);
        }
      };
      initGoogle();
    }
  }, [googleClientId]);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const redirect = (res) => {
    if (res.success) {
      navigate(res.role === 'admin' ? '/admin/dashboard' : (res.hasProfile ? '/dashboard' : '/onboard'));
    } else {
      setError(res.error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    redirect(await emailLogin(siEmail, siPass));
    setBusy(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (suPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (suPass !== suConfirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    redirect(await emailRegister({ email: suEmail, password: suPass, first_name: suFirstName, last_name: suLastName, role: suRole }));
    setBusy(false);
  };

  // Production Google Authentication Flow (receives id_token)
  const handleRealGoogleResponse = async (response) => {
    setBusy(true); setError('');
    redirect(await loginWithGoogle({ id_token: response.credential }));
    setBusy(false);
  };



  const inputCls = "w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-sm text-brand-text dark:text-brand-text-dark outline-none focus:ring-2 focus:ring-accent/40 transition";
  const smallInputCls = "w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-sm text-brand-text dark:text-brand-text-dark outline-none focus:ring-2 focus:ring-accent/40 transition";

  const GoogleSVG = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 15.01 1 12 1 7.24 1 3.19 3.73 1.24 7.74l3.87 3C6.03 7.77 8.78 5.04 12 5.04z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.43-4.91 3.43-8.6z"/>
      <path fill="#FBBC05" d="M5.11 14.74c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.24 7.74C.45 9.36 0 11.13 0 13s.45 3.64 1.24 5.26l3.87-3.52z"/>
      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.22 0-5.97-2.73-6.94-5.7l-3.87 3C3.19 20.27 7.24 23 12 23z"/>
    </svg>
  );

  return (
    <div 
      className="flex min-h-screen w-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 transition-colors duration-300"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Left branding */}
        <div className="space-y-8 text-left p-4 md:p-8">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-[#F3D9CC] rounded-2xl border border-accent/20 flex items-center justify-center">
              <FreshverseLogo size={44} />
            </div>
            <span className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark tracking-tight">
              FreshVerse
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-brand-text dark:text-brand-text-dark leading-[1.1]">
              Everything You Need.<br />
              <span className="text-accent">From Day One.</span>
            </h1>
            <p className="text-base text-brand-text/75 dark:text-brand-text-dark/75 max-w-md leading-relaxed">
              Navigate your campus with confidence. Access timetables, locate classrooms and faculty, explore campus services, and stay updated—all in one place.
            </p>
          </div>

          <div className="pt-4 border-t border-brand-border/20 dark:border-brand-border-dark/20 max-w-md">
            <p className="text-xs uppercase tracking-wider font-extrabold text-brand-text/60 dark:text-brand-text-dark/60 mb-3">
              Trusted by
            </p>
            <div className="flex flex-wrap gap-2.5">
              {['Students', 'Faculty', 'Administration'].map((role) => (
                <span 
                  key={role} 
                  className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#4E220F] text-white shadow-md shadow-[#4E220F]/20 transition-all"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full max-w-md mx-auto">
          <GlassContainer className="w-full">

            {/* Tabs */}
            <div className="flex rounded-xl bg-brand-border/20 dark:bg-brand-border-dark/20 p-1 mb-6">
              {['signin','signup'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? 'bg-accent text-white shadow-sm' : 'text-brand-text/60 dark:text-brand-text-dark/60 hover:text-brand-text dark:hover:text-brand-text-dark'}`}>
                  {t === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-500 text-xs rounded-xl font-medium">{error}</div>
            )}

            {/* Official Google Button Container */}
            <div className="mb-5 flex justify-center min-h-[44px]">
              <div id="googleRealBtn" className="w-full max-w-[380px]"></div>
            </div>

            <div className="flex items-center my-4 text-[10px] uppercase text-brand-text/40 dark:text-brand-text-dark/40 font-black tracking-wider">
              <div className="flex-1 border-t border-brand-border/30 dark:border-brand-border-dark/30" />
              <span className="px-3">or with email</span>
              <div className="flex-1 border-t border-brand-border/30 dark:border-brand-border-dark/30" />
            </div>

            {/* ── SIGN IN ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input type="email" required placeholder="Email address"
                    value={siEmail} onChange={e => setSiEmail(e.target.value)} className={inputCls} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input type={siShowPass ? 'text' : 'password'} required placeholder="Password"
                    value={siPass} onChange={e => setSiPass(e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setSiShowPass(!siShowPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-accent transition">
                    {siShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={busy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold shadow-md shadow-accent/20 transition-all disabled:opacity-60 cursor-pointer">
                  {busy ? 'Signing in…' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-xs text-brand-text/50 dark:text-brand-text-dark/50">
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-accent font-semibold hover:underline">Sign Up</button>
                </p>
              </form>
            )}

            {/* ── SIGN UP ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                    <input type="text" required placeholder="First Name"
                      value={suFirstName} onChange={e => setSuFirstName(e.target.value)} className={smallInputCls} />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                    <input type="text" required placeholder="Last Name"
                      value={suLastName} onChange={e => setSuLastName(e.target.value)} className={smallInputCls} />
                  </div>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input type="email" required placeholder="Email address"
                    value={suEmail} onChange={e => setSuEmail(e.target.value)} className={inputCls} />
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2">
                  {[['student','Student'],['admin','Administrator']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setSuRole(val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${suRole === val ? 'bg-accent text-white shadow-sm' : 'bg-brand-border/20 dark:bg-brand-border-dark/20 text-brand-text/70 dark:text-brand-text-dark/70 hover:bg-brand-border/35'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input type={suShowPass ? 'text' : 'password'} required placeholder="Password (min. 6 chars)"
                    value={suPass} onChange={e => setSuPass(e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setSuShowPass(!suShowPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-accent transition">
                    {suShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input type={suShowConfirm ? 'text' : 'password'} required placeholder="Confirm password"
                    value={suConfirm} onChange={e => setSuConfirm(e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setSuShowConfirm(!suShowConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-accent transition">
                    {suShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {suPass && suConfirm && (
                  <p className={`text-[11px] font-semibold ${suPass === suConfirm ? 'text-emerald-500' : 'text-red-500'}`}>
                    {suPass === suConfirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}

                <button type="submit" disabled={busy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold shadow-md shadow-accent/20 transition-all disabled:opacity-60 cursor-pointer">
                  {busy ? 'Creating account…' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-xs text-brand-text/50 dark:text-brand-text-dark/50">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-accent font-semibold hover:underline">Sign In</button>
                </p>
              </form>
            )}
          </GlassContainer>
        </div>
      </div>

    </div>
  );
};

export default Login;
