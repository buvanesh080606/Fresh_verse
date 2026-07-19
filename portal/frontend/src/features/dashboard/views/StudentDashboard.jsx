import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import api, { getMediaUrl } from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import SparkleLogo from '../../../components/ui/SparkleLogo';
import { 
  BookOpen, Clock, Megaphone, Calendar, 
  MapPin, User, Send, MessageSquare, TrendingUp,
  Coffee, Utensils, Trophy, Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Filler,
  Legend
);

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [currentNext, setCurrentNext] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [stats, setStats] = useState({
    total_students: 2451,
    upcoming_events: 18,
    announcements: 27,
    ai_queries_today: 156
  });
  const [weeklyActivity, setWeeklyActivity] = useState([35, 48, 42, 68, 80, 65, 75]);

  // Mini AI Assistant state
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState([
    { role: 'assistant', text: `Hi ${user?.first_name || 'there'}! 👋 How can I help you today?` }
  ]);
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentNextRes, todayRes, announcementsRes, eventsRes, statsRes] = await Promise.all([
          api.get('academic/timetable/current_next/').catch(() => ({ data: null })),
          api.get('academic/timetable/today/').catch(() => ({ data: [] })),
          api.get('events/announcements/').catch(() => ({ data: [] })),
          api.get('events/events/').catch(() => ({ data: [] })),
          api.get('core/stats/').catch(() => ({ data: null })),
        ]);
        setCurrentNext(currentNextRes.data);
        setTodayClasses(todayRes.data);
        setAnnouncements(announcementsRes.data.slice(0, 4));
        setEvents(eventsRes.data.slice(0, 2));
        if (statsRes && statsRes.data) {
          setStats(statsRes.data);
          if (statsRes.data.weekly_activity) {
            setWeeklyActivity(statsRes.data.weekly_activity);
          }
        }
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedAnnouncement(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendChat = async (textToSend) => {
    const messageText = textToSend || query;
    if (!messageText.trim()) return;

    setChatLog(prev => [...prev, { role: 'user', text: messageText }]);
    setQuery('');
    setSendingChat(true);

    try {
      const response = await api.post('ai/chat/', { query: messageText });
      setChatLog(prev => [...prev, { role: 'assistant', text: response.data.response }]);
    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, { role: 'assistant', text: "Sorry, I am offline or cannot connect to the server right now." }]);
    } finally {
      setSendingChat(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await api.post(`events/events/${eventId}/register/`);
      alert("Successfully registered for this event!");
      // Update event capacity and registration status locally
      setEvents(prev => prev.map(e => e.id === eventId ? { 
        ...e, 
        available_seats: Math.max(0, e.available_seats - 1),
        is_registered_by_me: true 
      } : e));
    } catch (err) {
      const errMsg = err.response?.data?.error || 
                     err.response?.data?.message || 
                     err.response?.data?.detail || 
                     (err.response?.data && typeof err.response.data === 'string' ? err.response.data : null) ||
                     'Registration failed or already registered.';
      alert(errMsg);
    }
  };

  // Chart configuration for Weekly Overview
  const graphColor = isDark ? '#8B5E3C' : '#4E220F';

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Active Hours',
        data: weeklyActivity,
        borderColor: graphColor,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 240);
          if (isDark) {
            gradient.addColorStop(0, 'rgba(139, 94, 60, 0.45)');
            gradient.addColorStop(1, 'rgba(139, 94, 60, 0.00)');
          } else {
            gradient.addColorStop(0, 'rgba(78, 34, 15, 0.45)');
            gradient.addColorStop(1, 'rgba(78, 34, 15, 0.00)');
          }
          return gradient;
        },
        tension: 0.4,
        pointBackgroundColor: graphColor,
        pointBorderColor: '#FFFFFF',
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#3F2C22',
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 8,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? '#FAF2EE' : '#4E220F', font: { size: 10 } } },
      y: { min: 0, max: 100, ticks: { stepSize: 20, color: isDark ? '#FAF2EE' : '#4E220F', font: { size: 10 } }, grid: { color: isDark ? 'rgba(92, 56, 39, 0.25)' : 'rgba(139, 94, 60, 0.25)' } }
    }
  };

  const chips = [
    "What's my next class?",
    "Show bus timings",
    "Where is AI Lab?",
    "Upcoming events"
  ];

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Dynamic welcome headings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-text dark:text-brand-text-dark tracking-tight">
            Dashboard
          </h2>
          <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/60 mt-0.5">
            Welcome back, <span className="font-extrabold text-accent">{user?.first_name || 'Student'}</span>! Have a productive day ahead.
          </p>
        </div>
      </div>

      {/* Grid containing 4 stats counters - Responsive columns: 1 on mobile, 2 on tablet/laptop, 4 on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Total Students */}
        <div className="glass-effect rounded-3xl shadow-sm border border-brand-border/20 dark:border-brand-border-dark/15 p-5 transition-all duration-300 hover:scale-[1.01] bg-white dark:bg-brand-card-dark flex flex-col justify-between gap-4 min-h-[9rem]">
          <div className="p-2.5 bg-accent/10 rounded-2xl text-accent self-start">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50 dark:text-brand-text-dark/50">Total Students</p>
            <h3 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">{stats.total_students}</h3>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> ↑ 12.5% from last month
            </span>
          </div>
        </div>
 
        {/* Card 2: Upcoming Events */}
        <div className="glass-effect rounded-3xl shadow-sm border border-brand-border/20 dark:border-brand-border-dark/15 p-5 transition-all duration-300 hover:scale-[1.01] bg-white dark:bg-brand-card-dark flex flex-col justify-between gap-4 min-h-[9rem]">
          <div className="p-2.5 bg-accent/10 rounded-2xl text-accent self-start">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50 dark:text-brand-text-dark/50">Upcoming Events</p>
            <h3 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">{stats.upcoming_events}</h3>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> ↑ 8.2% from last month
            </span>
          </div>
        </div>
 
        {/* Card 3: Announcements */}
        <div className="glass-effect rounded-3xl shadow-sm border border-brand-border/20 dark:border-brand-border-dark/15 p-5 transition-all duration-300 hover:scale-[1.01] bg-white dark:bg-brand-card-dark flex flex-col justify-between gap-4 min-h-[9rem]">
          <div className="p-2.5 bg-accent/10 rounded-2xl text-accent self-start">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50 dark:text-brand-text-dark/50">Announcements</p>
            <h3 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">{stats.announcements}</h3>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> ↑ 4.1% from last month
            </span>
          </div>
        </div>
 
        {/* Card 4: AI Queries */}
        <div className="glass-effect rounded-3xl shadow-sm border border-brand-border/20 dark:border-brand-border-dark/15 p-5 transition-all duration-300 hover:scale-[1.01] bg-white dark:bg-brand-card-dark flex flex-col justify-between gap-4 min-h-[9rem]">
          <div className="p-2.5 bg-accent/10 rounded-2xl text-accent self-start">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50 dark:text-brand-text-dark/50">AI Queries (Today)</p>
            <h3 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-brand-text-dark mt-1">{stats.ai_queries_today}</h3>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> ↑ 23.7% from yesterday
            </span>
          </div>
        </div>
      </div>

      {/* Middle row: Weekly Overview (Chart) & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Area Graph */}
        <div className="lg:col-span-2">
          <GlassContainer className="bg-white dark:bg-brand-card-dark border border-brand-border/25 dark:border-brand-border-dark/15 rounded-3xl p-5 shadow-sm h-80 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
              <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark">Weekly Overview</h3>
              <select className="px-3 py-1 text-[11px] font-bold rounded-full border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-brand-text dark:text-brand-text-dark outline-none cursor-pointer">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            
            <div className="h-56 mt-4">
              <Line data={chartData} options={chartOptions} />
            </div>
          </GlassContainer>
        </div>

        {/* Today's Classes timeline list */}
        <div>
          <GlassContainer className="bg-white dark:bg-brand-card-dark border border-brand-border/25 dark:border-brand-border-dark/15 rounded-3xl p-5 shadow-sm h-80 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
              <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark">Today's Schedule</h3>
              <Link to="/timetable" className="text-[10px] text-accent font-extrabold hover:underline">
                View full timetable
              </Link>
            </div>

            {/* List items timeline */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
              {todayClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-text/45 dark:text-brand-text-dark/45">
                  <BookOpen className="w-8 h-8 opacity-30 mb-1" />
                  <p className="text-xs">No lectures scheduled today</p>
                </div>
              ) : (
                todayClasses.map((cls, idx) => {
                  const isBreak = cls.slot_type === 'break';
                  const isLunch = cls.slot_type === 'lunch';
                  const isSpecial = isBreak || isLunch;

                  if (isBreak) {
                    return (
                      <div key={cls.id || idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-900/20 border border-amber-400/25 dark:border-amber-700/30">
                        <Coffee className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">Break</span>
                        <span className="text-[9px] text-amber-500/80 ml-auto font-semibold">
                          {cls.start_time?.substring(0,5)} – {cls.end_time?.substring(0,5)}
                        </span>
                      </div>
                    );
                  }

                  if (isLunch) {
                    return (
                      <div key={cls.id || idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-400/25 dark:border-emerald-700/30">
                        <Utensils className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Lunch Break</span>
                        <span className="text-[9px] text-emerald-500/80 ml-auto font-semibold">
                          {cls.start_time?.substring(0,5)} – {cls.end_time?.substring(0,5)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={cls.id || idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {idx !== todayClasses.length - 1 && <div className="w-[1px] flex-1 bg-brand-border/30 dark:bg-brand-border-dark/30 mt-1" />}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-accent">
                          {cls.start_time?.substring(0, 5)} - {cls.end_time?.substring(0, 5)}
                        </p>
                        <h4 className="text-xs font-black text-brand-text dark:text-brand-text-dark truncate mt-0.5">
                          {cls.subject_name}
                        </h4>
                        <p className="text-[10px] text-brand-text/75 dark:text-brand-text-dark/75 mt-0.5 truncate">
                          {cls.subject_code && cls.subject_code !== 'BREAK' && cls.subject_code !== 'LUNCH' ? cls.subject_code : ''}
                          {cls.faculty_detail?.name ? ` • ${cls.faculty_detail.name}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Timetable Button */}
            <Link 
              to="/timetable" 
              className="w-full mt-4 py-2 px-4 rounded-xl bg-accent hover:bg-accent/95 text-white font-bold text-xs text-center shadow-md shadow-accent/20 transition-all duration-200"
            >
              View full timetable
            </Link>
          </GlassContainer>
        </div>

      </div>

      {/* Bottom row: Events cards, notices lists, and AI chat widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Events cards column */}
        <GlassContainer className="bg-white dark:bg-brand-card-dark border border-brand-border/25 dark:border-brand-border-dark/15 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
            <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark">Upcoming Events</h3>
            <Link to="/events" className="text-[10px] text-accent font-extrabold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-xs text-brand-text/50 py-6 text-center">No upcoming events found.</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex gap-3 bg-brand-bg/40 dark:bg-brand-card-dark/40 p-2.5 rounded-2xl border border-brand-border/10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-accent/20 to-primary/25 border border-brand-border/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {event.poster_url ? (
                      <img 
                        src={getMediaUrl(event.poster_url)} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Trophy className="w-6 h-6 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-brand-text dark:text-brand-text-dark truncate">
                        {event.title}
                      </h4>
                      <p className="text-[9px] text-brand-text/55 dark:text-brand-text-dark/55 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(event.date_time).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] text-brand-text/55 dark:text-brand-text-dark/55 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.venue}
                      </p>
                      <p className="text-[9px] text-brand-text/55 dark:text-brand-text-dark/55 mt-0.5 flex items-center gap-1 font-semibold">
                        <Users className="w-3 h-3 text-accent" /> {event.available_seats} / {event.max_seats} seats remaining
                      </p>
                    </div>
                    {event.is_registered_by_me ? (
                      <span className="mt-2 text-[9px] font-extrabold text-secondary bg-secondary/15 px-2.5 py-0.5 rounded border border-secondary/25 self-start">
                        Registered
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleRegisterEvent(event.id)}
                        disabled={event.available_seats === 0}
                        className={`mt-2 text-[10px] font-bold text-white px-3 py-1 rounded-lg self-start transition-all ${
                          event.available_seats === 0
                            ? 'bg-brand-border/20 text-brand-text/40 cursor-not-allowed'
                            : 'bg-accent hover:bg-accent/95 cursor-pointer'
                        }`}
                      >
                        {event.available_seats === 0 ? 'Full' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassContainer>

        {/* Notices/Announcements list */}
        <GlassContainer className="bg-white dark:bg-brand-card-dark border border-brand-border/25 dark:border-brand-border-dark/15 rounded-3xl p-5 shadow-sm flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5 mb-4">
              <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark">Recent Announcements</h3>
              {user?.role === 'admin' ? (
                <Link to="/admin/announcements" className="text-[10px] text-accent font-extrabold hover:underline">
                  Manage Circulars
                </Link>
              ) : (
                <Link to="/announcements" className="text-[10px] text-accent font-extrabold hover:underline">
                  View all
                </Link>
              )}
            </div>

            <ol className="space-y-2">
              {announcements.length === 0 ? (
                <p className="text-xs text-brand-text/50 py-6 text-center">No announcements recorded.</p>
              ) : (
                announcements.map((ann, index) => (
                  <li 
                    key={ann.id} 
                    onClick={() => {
                      if (user?.role === 'admin') {
                        navigate('/admin/announcements');
                      } else {
                        setSelectedAnnouncement(ann);
                      }
                    }}
                    className="flex gap-3 p-2.5 rounded-2xl hover:bg-brand-bg/60 dark:hover:bg-brand-card-dark/60 border border-transparent hover:border-brand-border/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all duration-200 group"
                  >
                    {/* Serial number badge */}
                    <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-accent">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-brand-text dark:text-brand-text-dark group-hover:text-accent transition-colors duration-150 line-clamp-1">
                        {ann.title}
                      </h4>
                      <p className="text-[10px] text-brand-text/70 dark:text-brand-text-dark/70 mt-0.5 line-clamp-1 leading-relaxed">
                        {ann.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-brand-text/60 dark:text-brand-text-dark/60 font-medium">
                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize text-accent font-bold">{ann.category}</span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </div>

          {user?.role === 'admin' ? (
            <Link 
              to="/admin/announcements" 
              className="w-full mt-4 py-2 px-4 rounded-xl bg-accent/10 hover:bg-accent/15 text-accent font-bold text-xs text-center transition-all duration-200"
            >
              Broadcast Circular
            </Link>
          ) : (
            <Link 
              to="/announcements" 
              className="w-full mt-4 py-2 px-4 rounded-xl bg-accent/10 hover:bg-accent/15 text-accent font-bold text-xs text-center transition-all duration-200"
            >
              All Announcements
            </Link>
          )}
        </GlassContainer>

        {/* Mini Chat Widget */}
        <GlassContainer className="bg-white dark:bg-brand-card-dark border border-brand-border/25 dark:border-brand-border-dark/15 rounded-3xl p-5 shadow-sm h-80 flex flex-col justify-between text-left">
          <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
            <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark flex items-center gap-1.5">
              <SparkleLogo size={18} /> AI Assistant
            </h3>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto mt-3.5 space-y-3 pr-1 text-xs">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {chat.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <SparkleLogo size={13} />
                  </div>
                )}
                <div className={`p-2.5 rounded-2xl max-w-[80%] leading-relaxed ${
                  chat.role === 'user' 
                    ? 'bg-accent text-white rounded-tr-none' 
                    : 'bg-brand-bg/70 dark:bg-brand-border-dark/30 text-brand-text dark:text-brand-text-dark rounded-tl-none border border-brand-border/10'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {sendingChat && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <SparkleLogo size={13} />
                </div>
                <div className="p-2.5 rounded-2xl bg-brand-bg/70 dark:bg-brand-border-dark/30 text-brand-text/50 italic animate-pulse">
                  Gemini is thinking...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt chips suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2 py-1">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => handleSendChat(chip)}
                className="text-[9px] font-bold text-accent bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded-full transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Send Area */}
          <div className="flex items-center gap-2 mt-2 bg-brand-bg/50 dark:bg-brand-border-dark/30 border border-brand-border/30 dark:border-brand-border-dark/45 p-1 rounded-xl">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask anything..." 
              className="flex-1 bg-transparent border-none text-[11px] text-brand-text dark:text-brand-text-dark px-2 outline-none"
            />
            <button 
              onClick={() => handleSendChat()}
              className="p-2 bg-accent text-white rounded-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </GlassContainer>

      </div>

      {/* Cool Interactive Announcement Modal */}
      {selectedAnnouncement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                selectedAnnouncement.category === 'academic' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                selectedAnnouncement.category === 'exam' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                selectedAnnouncement.category === 'placement' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                'bg-purple-500/10 text-purple-500 border border-purple-500/20'
              }`}>
                {selectedAnnouncement.category} Circular
              </span>
              <span className="text-[10px] text-brand-text/45 dark:text-brand-text-dark/45 font-medium">
                {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-brand-text dark:text-brand-text-dark leading-snug">
                {selectedAnnouncement.title}
              </h3>
              <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/85 whitespace-pre-line leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
                {selectedAnnouncement.content}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex items-center justify-between">
              <span className="text-[9px] text-brand-text/40 dark:text-brand-text-dark/45">
                Target: {selectedAnnouncement.target_department} (Sec: {selectedAnnouncement.target_section})
              </span>
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
