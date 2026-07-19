import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { CalendarRange, Landmark, Home, MapPin, Phone, ShieldAlert, Clock, GraduationCap } from 'lucide-react';

const CampusInfoView = () => {
  const location = useLocation();

  const getInitialTab = () => {
    if (location.pathname === '/hostels') return 'hostels';
    if (location.pathname === '/hostel-campus') return 'directory';
    return 'calendar';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [calendar, setCalendar] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === '/hostels') {
      setActiveTab('hostels');
    } else if (location.pathname === '/hostel-campus') {
      setActiveTab('directory');
    } else if (location.pathname === '/calendar') {
      setActiveTab('calendar');
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchCampusData = async () => {
      try {
        const [calRes, locRes, hostelRes] = await Promise.all([
          api.get('core/calendar/'),
          api.get('core/campus-info/'),
          api.get('core/hostels/'),
        ]);
        setCalendar(calRes.data);
        setLocations(locRes.data);
        setHostels(hostelRes.data);
      } catch (err) {
        console.error("Failed to load campus directory data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampusData();
  }, []);

  const tabStyle = (id) => `flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${
    activeTab === id
      ? 'bg-accent border-accent text-white shadow-md shadow-accent/25'
      : 'bg-transparent border-brand-border/25 dark:border-brand-border-dark/25 text-brand-text dark:text-brand-text-dark/80 hover:bg-brand-border/20'
  }`;

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
          Campus Information & Calendar
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Stay informed with active calendars, maps directory, and accommodations directories.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setActiveTab('calendar')} className={tabStyle('calendar')}>
          <CalendarRange className="w-4 h-4" /> Academic Calendar
        </button>
        <button onClick={() => setActiveTab('directory')} className={tabStyle('directory')}>
          <Landmark className="w-4 h-4" /> Campus Directory
        </button>
        <button onClick={() => setActiveTab('hostels')} className={tabStyle('hostels')}>
          <Home className="w-4 h-4" /> Hostels Directory
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading campus resources...</p>
        </div>
      ) : (
        <div className="pt-2">
          
          {/* Tab 1: Academic Calendar */}
          {activeTab === 'calendar' && (
            <GlassContainer className="space-y-6">
              <h3 className="text-lg font-black text-brand-text dark:text-brand-text-dark flex items-center gap-2 pb-2 border-b border-brand-border/20">
                <CalendarRange className="w-5 h-5 text-accent" /> Upcoming Milestones & Events
              </h3>

              {calendar.length === 0 ? (
                <p className="text-sm text-brand-text/55 py-6 text-center">No schedule events recorded.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-brand-border/40 dark:border-brand-border-dark/30 ml-4 space-y-6 py-2">
                  {calendar.map((item, idx) => (
                    <div key={idx} className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Bullet icon */}
                      <div className="absolute -left-[30.5px] w-4 h-4 rounded-full bg-accent border-4 border-brand-bg dark:border-brand-bg-dark" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-accent">{new Date(item.event_date).toLocaleDateString([], { dateStyle: 'long' })}</span>
                          {item.day_order && (
                            <span className="px-1.5 py-0.5 rounded bg-brand-bg/30 text-brand-text dark:bg-brand-bg-dark/40 dark:text-brand-text-dark border border-brand-border/45 dark:border-brand-border-dark/40 text-[9px] font-bold">
                              Day Order {item.day_order}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-brand-text dark:text-brand-text-dark text-sm leading-snug">{item.description}</h4>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.event_type === 'holiday' ? 'bg-red-500/10 text-red-500' :
                          item.event_type === 'exam' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-brand-bg/30 text-brand-text dark:bg-brand-bg-dark/40 dark:text-brand-text-dark border border-brand-border/45 dark:border-brand-border-dark/40'
                        }`}>
                          {item.event_type_display}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassContainer>
          )}

          {/* Tab 2: Campus Locations Directory */}
          {activeTab === 'directory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.length === 0 ? (
                <div className="col-span-full py-12 text-center text-brand-text/55">No directory entries recorded.</div>
              ) : (
                locations.map((loc) => (
                  <GlassContainer key={loc.id} className="space-y-2 hover:scale-[1.01] transition-transform duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                        {loc.category_display}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-brand-text dark:text-brand-text-dark">{loc.name}</h4>
                    
                    <div className="space-y-1 pt-2 border-t border-brand-border/10 text-xs text-brand-text/75 dark:text-brand-text-dark/80">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <MapPin className="w-4 h-4 text-accent" /> {loc.location}
                      </p>
                      {loc.description && (
                        <p className="text-brand-text/60 dark:text-brand-text-dark/65 pt-1 leading-relaxed">
                          {loc.description}
                        </p>
                      )}
                    </div>
                  </GlassContainer>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Hostel Blocks Directory */}
          {activeTab === 'hostels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hostels.length === 0 ? (
                <div className="col-span-full py-12 text-center text-brand-text/55">No hostel blocks recorded.</div>
              ) : (
                hostels.map((hostel) => (
                  <GlassContainer key={hostel.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border/20 pb-3">
                      <div>
                        <h4 className="text-lg font-black text-brand-text dark:text-brand-text-dark">{hostel.name}</h4>
                        <span className="text-[10px] uppercase font-bold text-brand-text/55 dark:text-brand-text-dark/55">
                          {hostel.type === 'boys' ? "Boys Accommodation" : "Girls Accommodation"}
                        </span>
                      </div>
                      <div className="p-3 bg-accent/15 text-accent rounded-xl">
                        <Home className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-brand-text/85 dark:text-brand-text-dark/80">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent" />
                          <span><strong>Location:</strong> {hostel.location || 'Main Campus'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-accent" />
                          <span><strong>Warden:</strong> {hostel.warden_name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-accent" />
                          <span><strong>Contact:</strong> {hostel.contact}</span>
                        </p>
                      </div>

                      {hostel.rules && (
                        <div className="space-y-1.5 p-3.5 bg-brand-border/10 rounded-xl border border-brand-border/20">
                          <span className="flex items-center gap-1 text-[10px] font-black text-accent uppercase tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5" /> Hostel Rules
                          </span>
                          <p className="text-[11px] leading-relaxed text-brand-text/75 whitespace-pre-line">
                            {hostel.rules}
                          </p>
                        </div>
                      )}
                    </div>
                  </GlassContainer>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default CampusInfoView;
