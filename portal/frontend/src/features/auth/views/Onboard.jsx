import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { GraduationCap, ArrowRight, Home, Bus, Smartphone, FileText, User } from 'lucide-react';

const Onboard = () => {
  const { onboardStudent, user } = useAuth();
  const navigate = useNavigate();

  // Personal info — pre-populate from auth context (from Google or mock login)
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  // Academic info
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('CSE(AI&ML)');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');
  const [batch, setBatch] = useState('2024-2028');
  const [phone, setPhone] = useState('');

  // Accommodation
  const [hostelId, setHostelId] = useState('');
  const [busRouteId, setBusRouteId] = useState('');

  const [hostels, setHostels] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingResources, setLoadingResources] = useState(true);

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
        console.error("Failed to load onboarding resources:", err);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = user?.role === 'admin' ? {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    } : {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      roll_no: rollNo.trim(),
      department,
      section,
      semester,
      batch,
      phone: phone || null,
      hostel_id: hostelId ? parseInt(hostelId) : null,
      bus_route_id: busRouteId ? parseInt(busRouteId) : null,
    };

    const res = await onboardStudent(payload);
    setSubmitting(false);
    if (res.success) {
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } else {
      if (typeof res.error === 'object') {
        const firstErrKey = Object.keys(res.error)[0];
        const errorMsg = res.error[firstErrKey];
        setError(`${firstErrKey.replace(/_/g, ' ').toUpperCase()}: ${Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}`);
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div 
      className="flex min-h-screen w-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 transition-colors duration-300"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-accent/15 rounded-full border border-accent/20 mb-3">
            <GraduationCap className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
            Welcome to Campus Portal
          </h1>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Tell us a bit about yourself to personalise your dashboard.
          </p>
        </div>

        <GlassContainer>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-500 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Personal Info ─────────────────────────────── */}
            <div className="border-b border-brand-border/20 dark:border-brand-border-dark/25 pb-4">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Personal Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Arjun"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>
            </div>

            {user?.role !== 'admin' && (
              <>
                {/* ── Academic Info ──────────────────────────────── */}
                <div className="border-b border-brand-border/20 dark:border-brand-border-dark/25 pb-4">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Academic Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g. 24CSE001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Batch Year *
                      </label>
                      <input
                        type="text"
                        required
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="e.g. 2024-2028"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
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
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Semester *
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
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
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Section *
                      </label>
                      <input
                        type="text"
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="e.g. A, B, C"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Hostel & Transit ───────────────────────────── */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-4 h-4" /> Hostel &amp; Transit (Optional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        Hostel Block
                      </label>
                      <select
                        value={hostelId}
                        onChange={(e) => setHostelId(e.target.value)}
                        disabled={loadingResources}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                      >
                        <option value="" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Day Scholar (No Hostel)</option>
                        {hostels.map(h => (
                          <option key={h.id} value={h.id} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">{h.name} ({h.type === 'boys' ? 'Boys' : 'Girls'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1">
                        College Bus Route
                      </label>
                      <select
                        value={busRouteId}
                        onChange={(e) => setBusRouteId(e.target.value)}
                        disabled={loadingResources}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                      >
                        <option value="" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Private Transit (No Bus)</option>
                        {busRoutes.map(route => (
                          <option key={route.id} value={route.id} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Route {route.route_no} ({route.source} → {route.destination})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brand-text/80 dark:text-brand-text-dark/85 mb-1 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" /> Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-sm text-brand-text dark:text-brand-text-dark input-focus-ring"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent/95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-md shadow-accent/20 transition-all duration-200 cursor-pointer"
            >
              {submitting ? 'Setting up your portal...' : (user?.role === 'admin' ? 'Complete Setup & Enter Admin Panel' : 'Complete Setup & Enter Portal')}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </GlassContainer>
      </div>
    </div>
  );
};

export default Onboard;
