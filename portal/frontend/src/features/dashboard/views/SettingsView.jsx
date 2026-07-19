import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  User, Shield, Bell, Key, Smartphone, Home, Bus, 
  Settings, RefreshCw, LogOut, CheckCircle, AlertTriangle 
} from 'lucide-react';

const SettingsView = () => {
  const { user, profile, logout } = useAuth();
  
  // States for editable settings
  const [phone, setPhone] = useState(profile?.phone || '');
  const [department, setDepartment] = useState(profile?.department || 'CSE(AI&ML)');
  const [semester, setSemester] = useState(profile?.semester || '1');
  const [section, setSection] = useState(profile?.section || '');
  const [batch, setBatch] = useState(profile?.batch || '');
  const [hostelId, setHostelId] = useState(profile?.hostel || '');
  const [busRouteId, setBusRouteId] = useState(profile?.bus_route || '');

  // Resources
  const [hostels, setHostels] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  
  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Preference Settings (saved in LocalStorage)
  const { theme, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [hostelsRes, routesRes] = await Promise.all([
          api.get('core/hostels/'),
          api.get('core/bus-routes/'),
        ]);
        setHostels(hostelsRes.data);
        setBusRoutes(routesRes.data);
      } catch (err) {
        console.error("Failed to load settings resources:", err);
      }
    };
    fetchResources();
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await api.put('auth/update-profile/', {
        phone: phone.trim(),
        department: department.trim(),
        section: section.trim(),
        semester: semester.trim(),
        batch: batch.trim(),
        hostel_id: hostelId || '',
        bus_route_id: busRouteId || ''
      });
      setSuccessMsg('Profile updated successfully! Refresh the page to reload all systems.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to update settings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetProfile = () => {
    if (window.confirm("Are you sure you want to reset your profile details? You will need to complete onboarding again.")) {
      window.location.href = '/onboard';
    }
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-accent animate-spin-slow" />
          Portal Settings
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Customise your profile details, platform preferences, and notifications.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-secondary/15 border border-secondary/35 text-accent dark:text-brand-text-dark rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Profile Summary */}
        <div className="md:col-span-1 space-y-6">
          <GlassContainer className="p-6 text-center space-y-4 border border-brand-border/10 dark:border-brand-border-dark/15">
            <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 text-accent font-black flex items-center justify-center text-2xl mx-auto">
              {`${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-brand-text dark:text-brand-text-dark text-lg leading-tight">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 mt-1 truncate">
                {user?.email}
              </p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-accent/15 border border-accent/20 text-[10px] uppercase font-black text-accent">
                {user?.role}
              </span>
            </div>
            {profile && (
              <div className="border-t border-brand-border/10 dark:border-brand-border-dark/10 pt-4 text-left space-y-2 text-xs text-brand-text/75 dark:text-brand-text-dark/80">
                <p><span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">Roll No:</span> {profile.roll_no}</p>
                <p><span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">Department:</span> {profile.department}</p>
                <p><span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">Semester:</span> Semester {profile.semester}</p>
                <p><span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">Section:</span> {profile.section}</p>
                <p><span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">Batch:</span> {profile.batch}</p>
              </div>
            )}
          </GlassContainer>

          {/* Preferences & Quick Actions */}
          <GlassContainer className="p-5 space-y-4 border border-brand-border/10 dark:border-brand-border-dark/15">
            <h4 className="text-xs uppercase font-black tracking-wider text-brand-text/45 dark:text-brand-text-dark/45 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Preferences
            </h4>

            {/* Dark Mode toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-brand-text dark:text-brand-text-dark">Dark Theme</span>
              <button
                onClick={handleToggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-accent' : 'bg-brand-border dark:bg-brand-border-dark/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification settings */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-brand-text dark:text-brand-text-dark">Email Notices</span>
              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  emailAlerts ? 'bg-accent' : 'bg-brand-border dark:bg-brand-border-dark/30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Account danger actions */}
            <div className="pt-4 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex flex-col gap-2">
              <button
                onClick={handleResetProfile}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-500 font-bold text-xs text-center transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset &amp; Re-Onboard
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-500 font-bold text-xs text-center transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </GlassContainer>
        </div>

        {/* Right Side: Edit Form */}
        <div className="md:col-span-2">
          <GlassContainer className="p-6 border border-brand-border/10 dark:border-brand-border-dark/15 h-full">
            <h4 className="text-xs uppercase font-black tracking-wider text-brand-text/45 dark:text-brand-text-dark/45 mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Personalise Academic &amp; Transit Details
            </h4>

            {profile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                    >
                      <option value="CSE(AI&ML)" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">CSE (AI &amp; ML)</option>
                      <option value="CSE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Computer Science &amp; Engineering</option>
                      <option value="ECE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Electronics &amp; Communication</option>
                      <option value="EEE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Electrical &amp; Electronics</option>
                      <option value="MECH" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Mechanical Engineering</option>
                      <option value="CIVIL" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Civil Engineering</option>
                      <option value="IT" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Information Technology</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                    >
                      <option value="1" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 1</option>
                      <option value="2" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 2</option>
                      <option value="3" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 3</option>
                      <option value="4" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 4</option>
                      <option value="5" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 5</option>
                      <option value="6" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 6</option>
                      <option value="7" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 7</option>
                      <option value="8" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      required
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">
                      Batch Year
                    </label>
                    <input
                      type="text"
                      required
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" /> Hostel Block
                    </label>
                    <select
                      value={hostelId}
                      onChange={(e) => setHostelId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                    >
                      <option value="" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Day Scholar (No Hostel)</option>
                      {hostels.map(h => (
                        <option key={h.id} value={h.id} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">{h.name} ({h.type === 'boys' ? 'Boys' : 'Girls'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5" /> Transit Route
                    </label>
                    <select
                      value={busRouteId}
                      onChange={(e) => setBusRouteId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                    >
                      <option value="" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Private Transit (No Bus)</option>
                      {busRoutes.map(route => (
                        <option key={route.id} value={route.id} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Route {route.route_no} ({route.source} → {route.destination})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border/10 dark:border-brand-border-dark/10">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20"
                  >
                    {submitting ? 'Saving Settings...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-20 text-brand-text/50 dark:text-brand-text-dark/50">
                <AlertTriangle className="w-12 h-12 mx-auto opacity-35 mb-2" />
                <p className="font-semibold text-sm">Please complete onboarding to open settings profile.</p>
              </div>
            )}
          </GlassContainer>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
