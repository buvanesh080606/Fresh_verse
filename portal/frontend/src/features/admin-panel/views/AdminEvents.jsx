import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Trophy, Plus, Users, Calendar, MapPin, Download, X, Trash2, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState('');
  const [failedPosters, setFailedPosters] = useState({});

  // Form states
  const [editingEventId, setEditingEventId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxSeats, setMaxSeats] = useState(100);
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [targetSection, setTargetSection] = useState('All');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deletingEventTitle, setDeletingEventTitle] = useState('');
  const [showBannerMaker, setShowBannerMaker] = useState(false);
  const [bannerGradient, setBannerGradient] = useState('brown');
  const [bannerSlogan, setBannerSlogan] = useState('All Students Welcome');

  const fetchEvents = async () => {
    try {
      const response = await api.get('events/events/');
      setEvents(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openEditEvent = (event) => {
    setEditingEventId(event.id);
    setTitle(event.title || '');
    setDescription(event.description || '');
    setVenue(event.venue || '');
    if (event.date_time) {
      const dt = new Date(event.date_time);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
      setDateTime(localISOTime);
    }
    if (event.registration_deadline) {
      const dl = new Date(event.registration_deadline);
      const tzOffset = dl.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dl.getTime() - tzOffset)).toISOString().slice(0, 16);
      setDeadline(localISOTime);
    }
    setMaxSeats(event.max_seats || 100);
    setTargetDepartment(event.target_department || 'All');
    setTargetSection(event.target_section || 'All');
    if (event.poster_url) {
      setPosterPreview(getMediaUrl(event.poster_url));
    } else {
      setPosterPreview(null);
    }
    setPoster(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    setVenue('');
    setDateTime('');
    setDeadline('');
    setMaxSeats(100);
    setPoster(null);
    setPosterPreview(null);
    setTargetDepartment('All');
    setTargetSection('All');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('venue', venue);
    formData.append('date_time', dateTime);
    formData.append('registration_deadline', deadline);
    formData.append('max_seats', parseInt(maxSeats));
    formData.append('target_department', targetDepartment);
    formData.append('target_section', targetSection);
    if (poster) {
      formData.append('poster_url', poster);
    }

    try {
      if (editingEventId) {
        await api.put(`events/events/${editingEventId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setMessage({ text: 'Event updated successfully!', type: 'success' });
      } else {
        await api.post('events/events/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setMessage({ text: 'Event published successfully!', type: 'success' });
      }
      fetchEvents();
      resetForm();
    } catch (err) {
      setMessage({ text: editingEventId ? 'Failed to update event. Please check inputs.' : 'Failed to publish event. Please check inputs.', type: 'error' });
    }
  };
  const generateBannerImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Draw Gradient
    let gradient = ctx.createLinearGradient(0, 0, 800, 450);
    if (bannerGradient === 'brown') {
      gradient.addColorStop(0, '#4E220F');
      gradient.addColorStop(1, '#8C5233');
    } else if (bannerGradient === 'sunset') {
      gradient.addColorStop(0, '#F97316');
      gradient.addColorStop(1, '#E11D48');
    } else if (bannerGradient === 'indigo') {
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(1, '#06B6D4');
    } else if (bannerGradient === 'emerald') {
      gradient.addColorStop(0, '#059669');
      gradient.addColorStop(1, '#10B981');
    } else {
      gradient.addColorStop(0, '#7C3AED');
      gradient.addColorStop(1, '#DB2777');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);

    // Decorative Shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(100, 100, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(700, 350, 200, 0, Math.PI * 2);
    ctx.fill();

    // Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, 770, 420);

    // Text details
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = '900 44px Inter, sans-serif';
    ctx.fillText((title.trim() || 'CAMPUS EVENT').toUpperCase(), 400, 150);

    // Slogan
    ctx.font = 'italic 500 24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(bannerSlogan || 'All Students Welcome', 400, 220);

    // Divider Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(300, 255, 200, 2);

    // Venue & Date
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillText(venue.trim() ? `Venue: ${venue}` : 'Venue: Campus Auditorium', 400, 300);

    const displayDate = dateTime ? new Date(dateTime).toLocaleString() : 'Date: To Be Announced';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(displayDate, 400, 345);

    // Convert to Blob and apply
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'banner.png', { type: 'image/png' });
        setPoster(file);
        setPosterPreview(URL.createObjectURL(file));
        setShowBannerMaker(false);
      }
    }, 'image/png');
  };
  const viewAttendees = async (eventId, name) => {
    setSelectedEventName(name);
    try {
      const response = await api.get(`events/events/${eventId}/attendees/`);
      setAttendees(response.data);
      setShowAttendeesModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = (eventId, eventTitle) => {
    setDeletingEventId(eventId);
    setDeletingEventTitle(eventTitle);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEventId) return;
    const targetId = deletingEventId;
    const targetTitle = deletingEventTitle;
    
    setDeletingEventId(null);
    setDeletingEventTitle('');
    
    try {
      await api.delete(`events/events/${targetId}/`);
      setEvents(prev => prev.filter(e => e.id !== targetId));
      setMessage({ text: `Event "${targetTitle}" has been deleted.`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete event. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto relative">
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
          Manage Campus Events
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Publish events and monitor student registrations.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-[#4E220F]/10 border-[#4E220F]/25 text-[#4E220F] dark:bg-[#E6CCB2]/10 dark:border-[#E6CCB2]/25 dark:text-[#E6CCB2]' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Create Event Form */}
        <div>
          <GlassContainer className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/20 pb-2">
              <h3 className="text-base font-bold text-brand-text dark:text-brand-text-dark flex items-center gap-1.5">
                {editingEventId ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
                {editingEventId ? 'Edit Event Details' : 'Publish New Event'}
              </h3>
              {editingEventId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. hackverse 2026"
                  className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85">Event Poster</label>
                  <button
                    type="button"
                    onClick={() => setShowBannerMaker(!showBannerMaker)}
                    className="text-[10px] font-extrabold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    🎨 {showBannerMaker ? "Hide Banner Maker" : "Open Banner Maker"}
                  </button>
                </div>

                {/* Banner Maker Tool Panel */}
                {showBannerMaker && (
                  <div className="p-3 bg-brand-bg/15 dark:bg-brand-border-dark/10 border border-brand-border/40 dark:border-brand-border-dark/30 rounded-2xl space-y-3 mb-3 text-left">
                    <div className="text-[10px] font-black uppercase text-brand-text/50 dark:text-brand-text-dark/50">Banner Live Preview</div>
                    
                    {/* Live Canvas Mock */}
                    <div 
                      className="w-full aspect-[16/9] rounded-xl flex flex-col justify-center items-center text-center p-4 text-white shadow-inner select-none relative overflow-hidden"
                      style={{
                        background: 
                          bannerGradient === 'brown' ? 'linear-gradient(135deg, #4E220F, #8C5233)' :
                          bannerGradient === 'sunset' ? 'linear-gradient(135deg, #F97316, #E11D48)' :
                          bannerGradient === 'indigo' ? 'linear-gradient(135deg, #4F46E5, #06B6D4)' :
                          bannerGradient === 'emerald' ? 'linear-gradient(135deg, #059669, #10B981)' :
                          'linear-gradient(135deg, #7C3AED, #DB2777)'
                      }}
                    >
                      <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none"></div>
                      <div className="font-black text-sm uppercase px-2 line-clamp-1">{title.trim() || 'EVENT TITLE'}</div>
                      <div className="text-[10px] opacity-80 italic mt-1 line-clamp-1">{bannerSlogan || 'All Students Welcome'}</div>
                      <div className="w-12 h-0.5 bg-white/20 my-2"></div>
                      <div className="text-[9px] font-bold opacity-90 line-clamp-1">{venue.trim() || 'Venue: Campus Auditorium'}</div>
                      <div className="text-[8px] opacity-75 mt-0.5">{dateTime ? new Date(dateTime).toLocaleString() : 'Date: To Be Announced'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block font-bold mb-0.5 text-brand-text/60 dark:text-brand-text-dark/65">Banner Slogan</label>
                        <input
                          type="text"
                          value={bannerSlogan}
                          onChange={(e) => setBannerSlogan(e.target.value)}
                          placeholder="e.g. All Welcome"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-[10px] text-brand-text dark:text-brand-text-dark input-focus-ring"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-0.5 text-brand-text/60 dark:text-brand-text-dark/65">Theme/Gradient</label>
                        <select
                          value={bannerGradient}
                          onChange={(e) => setBannerGradient(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-[10px] text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                        >
                          <option value="brown">Deep Brown</option>
                          <option value="sunset">Sunset Orange</option>
                          <option value="indigo">Midnight Indigo</option>
                          <option value="emerald">Forest Emerald</option>
                          <option value="purple">Royal Purple</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={generateBannerImage}
                      className="w-full py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-black text-[11px] transition shadow-md shadow-accent/20 cursor-pointer"
                    >
                      Generate &amp; Apply Banner
                    </button>
                  </div>
                )}

                {posterPreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-brand-border/90 dark:border-brand-border-dark/70 h-32 bg-black/10">
                    <img 
                      src={posterPreview} 
                      alt="Poster Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPoster(null);
                          setPosterPreview(null);
                        }}
                        className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-brand-border/90 dark:border-brand-border-dark/70 hover:border-accent dark:hover:border-accent rounded-xl p-4 transition-colors duration-200 bg-brand-bg/5 dark:bg-brand-bg-dark/5 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPoster(file);
                          setPosterPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Plus className="w-6 h-6 text-brand-text/40 dark:text-brand-text-dark/40 mb-1" />
                    <span className="text-[11px] font-medium text-brand-text/60 dark:text-brand-text-dark/60">
                      Upload Poster Image
                    </span>
                    <span className="text-[9px] text-brand-text/40 dark:text-brand-text-dark/40 mt-0.5">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Auditorium"
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Max Seats</label>
                  <input
                    type="number"
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Deadline Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">
                    Target Department
                  </label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                  >
                    <option value="All" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">All Departments</option>
                    <option value="CSE(AI&ML)" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">CSE (AI &amp; ML)</option>
                    <option value="CSE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Computer Science &amp; Eng.</option>
                    <option value="ECE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Electronics &amp; Comm.</option>
                    <option value="EEE" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Electrical &amp; Electronics</option>
                    <option value="MECH" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Mechanical Eng.</option>
                    <option value="CIVIL" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Civil Eng.</option>
                    <option value="IT" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Information Tech.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Target Section</label>
                  <input
                    type="text"
                    required
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="e.g. A, B, or All"
                    className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {editingEventId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-1/3 py-2.5 rounded-xl bg-brand-border/20 text-brand-text dark:text-brand-text-dark font-bold text-xs hover:bg-brand-border/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingEventId ? 'w-2/3' : 'w-full'} py-2.5 rounded-xl bg-accent hover:bg-accent/95 text-white font-bold text-xs shadow-md shadow-accent/20 cursor-pointer transition`}
                >
                  {editingEventId ? 'Save Event Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </GlassContainer>
        </div>

        {/* Right Columns: Active Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-brand-text dark:text-brand-text-dark">Active Campus Listings</h3>
          
          {loading ? (
            <p className="text-sm text-brand-text/50">Fetching events...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-brand-text/50">No events active.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <GlassContainer key={event.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-5">
                  <div className="flex items-center gap-4">
                    {event.poster_url && !failedPosters[event.id] ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-brand-border/20 dark:border-brand-border-dark/15">
                        <img 
                          src={getMediaUrl(event.poster_url)} 
                          alt="" 
                          onError={() => setFailedPosters(prev => ({ ...prev, [event.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-accent/90 to-primary/45 flex items-center justify-center text-white flex-shrink-0 border border-brand-border/20 dark:border-brand-border-dark/15">
                        <Trophy className="w-6 h-6 opacity-75" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-brand-text dark:text-brand-text-dark text-base leading-snug">{event.title}</h4>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                          Target: {event.target_department} (Sec: {event.target_section})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-text/60 dark:text-brand-text-dark/65">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(event.date_time).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.venue}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.registrations_count} / {event.max_seats} seats booked</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditEvent(event)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-xs font-bold text-accent border border-accent/20 cursor-pointer transition"
                      title="Edit event details"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => viewAttendees(event.id, event.title)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-border/25 dark:bg-brand-border-dark/20 text-xs font-bold text-brand-text/80 dark:text-brand-text-dark/80 hover:bg-brand-border/40 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-accent" /> Attendees
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.title)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-500 border border-rose-500/20 cursor-pointer transition"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </GlassContainer>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <GlassContainer className="w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4 p-6 bg-white dark:bg-brand-card-dark shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border/20 pb-3">
              <div>
                <h3 className="font-black text-brand-text dark:text-brand-text-dark text-lg">Event Attendees List</h3>
                <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 mt-0.5">{selectedEventName}</p>
              </div>
              <button 
                onClick={() => setShowAttendeesModal(false)}
                className="p-1 rounded-full hover:bg-brand-border/25 text-brand-text/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {attendees.length === 0 ? (
              <p className="text-sm text-center py-8 text-brand-text/55">No student has registered for this event yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border/20">
                      <th className="py-2 px-1 text-brand-text/60">Student Name</th>
                      <th className="py-2 px-1 text-brand-text/60">Roll No</th>
                      <th className="py-2 px-1 text-brand-text/60">Department</th>
                      <th className="py-2 px-1 text-brand-text/60">Registered At</th>
                      <th className="py-2 px-1 text-brand-text/60">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {attendees.map((att) => (
                      <tr key={att.id}>
                        <td className="py-2.5 px-1 font-bold text-brand-text dark:text-brand-text-dark">
                          {att.student_detail?.user?.first_name} {att.student_detail?.user?.last_name}
                        </td>
                        <td className="py-2.5 px-1 font-medium">{att.student_detail?.roll_no}</td>
                        <td className="py-2.5 px-1">{att.student_detail?.department}</td>
                        <td className="py-2.5 px-1 text-brand-text/60">
                          {new Date(att.registered_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            att.status === 'registered' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassContainer>
        </div>
      )}

      {deletingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <GlassContainer className="w-full max-w-md p-6 bg-white dark:bg-brand-card-dark shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-brand-text dark:text-brand-text-dark border-b border-brand-border/20 pb-2">
              Confirm Delete Event
            </h3>
            <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/75 leading-relaxed">
              Are you sure you want to permanently delete the event <span className="font-extrabold text-rose-500">"{deletingEventTitle}"</span>?
              <br /><br />
              All student registrations for this event will also be removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeletingEventId(null);
                  setDeletingEventTitle('');
                }}
                className="px-4 py-2 rounded-xl border border-brand-border dark:border-brand-border-dark/45 text-xs font-bold text-brand-text dark:text-brand-text-dark hover:bg-brand-border/20 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white cursor-pointer transition shadow-md shadow-rose-500/20"
              >
                Delete Event
              </button>
            </div>
          </GlassContainer>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
