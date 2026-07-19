import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Users, Trophy, Megaphone, FileSpreadsheet, 
  ArrowRight, ShieldCheck, Database, CalendarRange, Bus, MapPin, Building, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    events: 0,
    announcements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [facRes, statsRes] = await Promise.all([
          api.get('academic/faculty/'),
          api.get('core/stats/'),
        ]);
        setStats({
          students: statsRes.data.total_students,
          faculty: facRes.data.length,
          events: statsRes.data.upcoming_events,
          announcements: statsRes.data.announcements
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminActions = [
    { label: 'Timetable Management', desc: 'Upload, parse with AI, and configure college timetables for all departments.', path: '/admin/timetable-manage', icon: FileSpreadsheet, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { label: 'Event Publisher & Registration', desc: 'Publish posters, deadlines, and export registrant lists.', path: '/admin/events', icon: Trophy, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { label: 'Broadcast Circular', desc: 'Push circular announcements directly to student notification feeds.', path: '/admin/announcements', icon: Megaphone, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { label: 'Manage Bus Transits', desc: 'Configure bus routes 1-24, edit dropping stops, and timing charts.', path: '/admin/transport', icon: Bus, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
    { label: 'Campus Directory', desc: 'Manage blocks (RV, KS, BD, Mech, MBA), labs, facilities, and offices.', path: '/admin/campus-directory', icon: MapPin, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    { label: 'Academic Calendar', desc: 'Manage exam schedules, day orders, activities, and targeted college events.', path: '/admin/calendar', icon: CalendarRange, color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
    { label: 'Hostel Management', desc: 'Configure boys/girls residential blocks, contact info, rules, and map locations.', path: '/admin/hostels', icon: Building, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    { label: 'Manage Clubs & Communities', desc: 'Create student societies, interest groups, committees, and assign club coordinators.', path: '/admin/clubs', icon: Sparkles, color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
    { label: 'Manage Faculty Directory', desc: 'Create faculty contacts, edit designations, cabin locations, and rotational semester assignments.', path: '/admin/faculty', icon: Users, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  ];

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
            Administrative Control Panel
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Logged in as {user?.first_name} {user?.last_name} ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#4E220F]/10 text-[#4E220F] dark:bg-[#E6CCB2]/10 dark:text-[#E6CCB2] border border-[#4E220F]/20 dark:border-[#E6CCB2]/20 px-3 py-1.5 rounded-full font-bold">
          <ShieldCheck className="w-4 h-4" /> System Online
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <GlassContainer className="p-4 bg-gradient-to-br from-white/70 to-primary/5 dark:from-brand-card-dark/70 dark:to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 uppercase font-extrabold tracking-wider">Students onboarded</p>
              <h3 className="text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">
                {loading ? '...' : stats.students}
              </h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 uppercase font-extrabold tracking-wider">Faculty index</p>
              <h3 className="text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">
                {loading ? '...' : stats.faculty}
              </h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-xl">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 uppercase font-extrabold tracking-wider">Active Events</p>
              <h3 className="text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">
                {loading ? '...' : stats.events}
              </h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 uppercase font-extrabold tracking-wider">announcements</p>
              <h3 className="text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">
                {loading ? '...' : stats.announcements}
              </h3>
            </div>
            <div className="p-3 bg-accent/15 text-accent rounded-xl">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
        </GlassContainer>

      </div>

      {/* Admin Quick Action Blocks */}
      <div>
        <h3 className="text-lg font-bold text-brand-text dark:text-brand-text-dark mb-4">
          Key Operations Shortcuts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminActions.map((action, idx) => (
            <GlassContainer key={idx} className="flex flex-col justify-between h-48 border hover:scale-[1.01] transition-transform duration-200">
              <div className="space-y-2">
                <div className={`inline-flex p-3 rounded-xl border ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-brand-text dark:text-brand-text-dark text-base">
                  {action.label}
                </h4>
                <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/60 leading-relaxed">
                  {action.desc}
                </p>
              </div>

              <Link
                to={action.path}
                className="flex items-center gap-1.5 text-xs text-accent font-bold hover:underline mt-4 cursor-pointer"
              >
                Launch Panel <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassContainer>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default AdminDashboard;
