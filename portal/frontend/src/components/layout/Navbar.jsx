import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Sun, Moon, LogOut, CheckCheck, Menu, Search } from 'lucide-react';
import api from '../../utils/api';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('core/notifications/');
      setNotifications(response.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.post('core/notifications/mark_all_read/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.post(`core/notifications/${id}/mark_read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markSingleRead(notif.id);
    }
    // Redirect to Gmail Inbox of the logged in user
    window.open('https://mail.google.com/', '_blank');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-transparent border-b border-brand-border/10 dark:border-brand-border-dark/10">
      {/* Mobile Drawer Trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onMenuClick} className="p-2 text-brand-text dark:text-brand-text-dark">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar (Centered/Left in desktop) */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2 w-80 bg-white/70 dark:bg-brand-card-dark/70 border border-brand-border/40 dark:border-brand-border-dark/30 rounded-full">
        <Search className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/40" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="bg-transparent border-none text-xs text-brand-text dark:text-brand-text-dark outline-none w-full"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-brand-border/20 dark:hover:bg-brand-border-dark/20 text-brand-text/75 dark:text-brand-text-dark/80 transition-all duration-200 cursor-pointer"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-full hover:bg-brand-border/20 dark:hover:bg-brand-border-dark/20 text-brand-text/75 dark:text-brand-text-dark/80 transition-all duration-200 relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-accent text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-2xl glass-effect shadow-2xl border border-brand-border/30 dark:border-brand-border-dark/25 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-brand-border/20 dark:border-brand-border-dark/25 pb-2 mb-2">
                <span className="font-bold text-brand-text dark:text-brand-text-dark text-xs">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-accent flex items-center gap-1 hover:underline font-semibold"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-center text-brand-text/50 dark:text-brand-text-dark/50 py-6">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                        notif.is_read
                          ? 'opacity-65 hover:bg-brand-border/10 dark:hover:bg-brand-border-dark/10'
                          : 'bg-primary/10 border-l-4 border-accent pl-2 hover:bg-primary/15'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-brand-text dark:text-brand-text-dark">
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-brand-text/70 dark:text-brand-text-dark/70 mt-1 whitespace-pre-line">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Account / Avatar Dropdown */}
        <div className="flex items-center gap-2.5 border-l border-brand-border/30 dark:border-brand-border-dark/30 pl-4">
          <div className="w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center text-xs">
            {initials}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
