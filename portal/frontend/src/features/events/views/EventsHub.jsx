import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Trophy, Calendar, MapPin, Users, Hourglass, CheckCircle2, XCircle } from 'lucide-react';

const EventsHub = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [failedPosters, setFailedPosters] = useState({});

  const fetchEvents = async () => {
    try {
      const response = await api.get('events/events/');
      setEvents(response.data);
    } catch (err) {
      console.error("Error fetching campus events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPoster(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRegister = async (eventId) => {
    setSubmittingId(eventId);
    setMsg({ text: '', type: '' });
    try {
      const response = await api.post(`events/events/${eventId}/register/`);
      setMsg({ text: response.data.message || 'Successfully registered!', type: 'success' });
      fetchEvents(); // Reload list to update capacity & registration flag
    } catch (err) {
      const errMsg = err.response?.data?.error || 
                     err.response?.data?.message || 
                     err.response?.data?.detail || 
                     (err.response?.data && typeof err.response.data === 'string' ? err.response.data : null) ||
                     'Registration failed.';
      setMsg({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    setSubmittingId(eventId);
    setMsg({ text: '', type: '' });
    try {
      const response = await api.post(`events/events/${eventId}/cancel-registration/`);
      setMsg({ text: response.data.message || 'Registration cancelled.', type: 'success' });
      fetchEvents();
    } catch (err) {
      const errMsg = err.response?.data?.error || 
                     err.response?.data?.message || 
                     err.response?.data?.detail || 
                     (err.response?.data && typeof err.response.data === 'string' ? err.response.data : null) ||
                     'Cancellation failed.';
      setMsg({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
          Campus Events Hub
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Explore workshops, seminars, and hackathons, and book your tickets instantly.
        </p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
          msg.type === 'success' 
            ? 'bg-secondary/15 border-secondary/35 text-accent dark:text-brand-text-dark' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <XCircle className="w-4.5 h-4.5" />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Discovering campus events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Trophy className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No campus events scheduled at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const hasPassed = new Date() > new Date(event.registration_deadline);
            const showPoster = event.poster_url && !failedPosters[event.id];
            return (
              <GlassContainer 
                key={event.id} 
                className="flex flex-col justify-between overflow-hidden p-0 border border-brand-border/20 dark:border-brand-border-dark/15 hover:shadow-xl transition-all duration-200"
              >
                {/* Visual Header / Poster */}
                <div 
                  onClick={() => {
                    if (showPoster) {
                      const url = getMediaUrl(event.poster_url);
                      setSelectedPoster(url);
                    }
                  }}
                  className={`relative h-48 w-full overflow-hidden group ${showPoster ? 'cursor-pointer' : ''} bg-gradient-to-tr from-accent/90 to-primary/45 flex items-end p-4 text-white`}
                >
                  {showPoster ? (
                    <>
                      <img 
                        src={getMediaUrl(event.poster_url)} 
                        alt={event.title} 
                        onError={() => setFailedPosters(prev => ({ ...prev, [event.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent z-10" />
                      
                      {/* Interactive Zoom Hover Prompt */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider scale-90 group-hover:scale-100 transition-all duration-300">
                          Click to expand
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                      <Trophy className="w-8 h-8 text-white drop-shadow-md mb-2 opacity-80" />
                    </div>
                  )}

                  <div className="relative z-10 w-full">
                    <h3 className="font-black text-lg leading-snug drop-shadow-md text-white line-clamp-2">{event.title}</h3>
                  </div>
                  
                  {event.is_registered_by_me && (
                    <span className="absolute top-3 right-3 bg-secondary text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Booked
                    </span>
                  )}
                </div>

                {/* Event Description & Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/15">
                        Dept: {event.target_department} (Sec: {event.target_section})
                      </span>
                    </div>
                    <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/80 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-brand-text/70 dark:text-brand-text-dark/75">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>{new Date(event.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-brand-text dark:text-brand-text-dark">
                          {event.available_seats} seats remaining (capacity: {event.max_seats})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-red-500/90 font-medium">
                        <Hourglass className="w-4 h-4" />
                        <span>Deadline: {new Date(event.registration_deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-brand-border/10">
                    {event.is_registered_by_me ? (
                      <button
                        onClick={() => handleCancelRegistration(event.id)}
                        disabled={submittingId === event.id}
                        className="w-full py-2.5 rounded-xl border border-red-500/25 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all duration-150 cursor-pointer"
                      >
                        {submittingId === event.id ? 'Processing...' : 'Cancel Reservation'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={submittingId === event.id || hasPassed || event.available_seats === 0}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 cursor-pointer ${
                          hasPassed
                            ? 'bg-brand-border/20 text-brand-text/40 cursor-not-allowed shadow-none'
                            : event.available_seats === 0
                            ? 'bg-brand-border/20 text-brand-text/40 cursor-not-allowed shadow-none'
                            : 'bg-accent hover:bg-accent/95 text-white shadow-accent/20'
                        }`}
                      >
                        {submittingId === event.id 
                          ? 'Booking Ticket...' 
                          : hasPassed 
                          ? 'Registration Closed' 
                          : event.available_seats === 0 
                          ? 'Event Full' 
                          : 'Book Free Ticket'}
                      </button>
                    )}
                  </div>
                </div>
              </GlassContainer>
            );
          })}
        </div>
      )}
      {/* Fullscreen Poster Modal */}
      {selectedPoster && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPoster(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-brand-bg-dark/80 backdrop-blur-xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedPoster} 
              alt="Event Poster" 
              className="max-w-full max-h-[80vh] object-contain rounded-t-2xl"
            />
            <div className="w-full p-4 bg-white/5 dark:bg-black/40 text-center border-t border-white/10 flex justify-between items-center px-6 gap-4">
              <span className="text-white/60 text-xs font-medium">Press ESC or click outside to close</span>
              <button 
                onClick={() => setSelectedPoster(null)}
                className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-black hover:bg-accent/90 transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsHub;
