import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SparkleLogo from '../ui/SparkleLogo';
import FreshverseLogo from '../ui/FreshverseLogo';
import { 
  LayoutDashboard, CalendarDays, Trophy, Bus, Users, 
  Landmark, Megaphone, Settings, ChevronDown, Sparkles, Home, LogOut, RefreshCw, MapPin, Building,
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const studentLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/assistant', label: 'AI Assistant', icon: null, useSparkleLogo: true },
    { path: '/timetable', label: 'Timetable', icon: CalendarDays },
    { path: '/events', label: 'Events', icon: Trophy },
    { path: '/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/faculty', label: 'Faculty', icon: Users },
    { path: '/hostel-campus', label: 'Campus Guide', icon: Landmark },
    { path: '/transport', label: 'Transport', icon: Bus },
    { path: '/hostels', label: 'Hostel', icon: Home },
    { path: '/clubs', label: 'Clubs & Committees', icon: Sparkles },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/approvals', label: 'Manage Approvals', icon: Users },
    { path: '/admin/timetable-manage', label: 'Timetable Management', icon: FileSpreadsheet },
    { path: '/admin/events', label: 'Manage Events', icon: Trophy },
    { path: '/admin/announcements', label: 'Circular Publisher', icon: Megaphone },
    { path: '/admin/transport', label: 'Manage Transport', icon: Bus },
    { path: '/admin/campus-directory', label: 'Campus Directory', icon: MapPin },
    { path: '/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
    { path: '/admin/hostels', label: 'Manage Hostels', icon: Building },
    { path: '/admin/clubs', label: 'Manage Clubs', icon: Sparkles },
    { path: '/admin/faculty', label: 'Manage Faculty', icon: Users },
  ];

  const activeStyle = "flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-accent to-[#B88768] text-white font-bold shadow-lg shadow-accent/25 transition-all duration-200";
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-2xl text-amber-50 hover:text-white hover:bg-white/5 transition-all duration-200";

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U';

  const handleResetProfile = () => {
    // Navigate to onboarding to let them rebuild profile
    window.location.href = '/onboard';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-35 bg-black/40 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#8B5E3C] text-white pt-6 px-4 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:h-screen lg:flex lg:flex-col lg:justify-between relative`}>
        
        {/* Top Section: Logo Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <FreshverseLogo size={40} className="flex-shrink-0 drop-shadow-sm" />
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight leading-none text-white">FreshVerse AI</h1>
              <span className="text-[10px] text-amber-100/90 tracking-wider">AI-Powered Campus Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 mt-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {links.map((link) => (
              <NavLink 
                key={link.path} 
                to={link.path}
                onClick={onClose}
                className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
              >
                {link.useSparkleLogo
                  ? <SparkleLogo size={18} className="flex-shrink-0" />
                  : <link.icon className="w-4.5 h-4.5 flex-shrink-0" />
                }
                <span className="text-xs font-semibold">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section: User Profile Profile Card */}
        {user && (
          <div className="border-t border-amber-200/10 pt-4 pb-4 mt-auto relative">
            
            {/* Interactive Dropdown Popover */}
            {showDropdown && (
              <div className="absolute bottom-16 left-0 right-0 bg-[#6F492E] border border-amber-200/10 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="border-b border-amber-200/10 pb-2">
                  <p className="text-xs font-bold text-white">{user.first_name} {user.last_name}</p>
                  <p className="text-[9px] text-amber-100/60 truncate mt-0.5">{user.email}</p>
                </div>

                {user.role === 'student' && profile && (
                  <div className="space-y-1.5 text-[10px] text-amber-100/80">
                    <p><span className="text-amber-200/50">Roll No:</span> {profile.roll_no}</p>
                    <p><span className="text-amber-200/50">Department:</span> {profile.department}</p>
                    <p><span className="text-amber-200/50">Section/Batch:</span> {profile.section} ({profile.batch})</p>
                    <p><span className="text-amber-200/50">Hostel:</span> {profile.hostel_detail?.name || 'Day Scholar'}</p>
                  </div>
                )}

                <div className="border-t border-amber-200/10 pt-2 flex flex-col gap-1">
                  <button 
                    onClick={handleResetProfile}
                    className="flex items-center gap-2 w-full text-left text-[10px] font-bold text-amber-100 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset & Re-onboard
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 w-full text-left text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 p-1.5 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {initials}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    Hi, {user.first_name || 'Student'} 👋
                  </p>
                  <p className="text-[9px] text-amber-100/95 truncate mt-0.5">
                    {user.role === 'admin' ? 'Administrator' : `Student • ${profile?.department || 'CSE'}`}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-amber-100/90 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
