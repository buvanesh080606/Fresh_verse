import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Sparkles, Mail, User, Check, Send, Award, Users } from 'lucide-react';

const ClubsHub = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await api.get('core/clubs/');
        setClubs(response.data);
      } catch (err) {
        console.error("Failed to load clubs:", err);
        setError("Unable to retrieve clubs directory.");
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const handleApply = (clubId, clubName) => {
    setApplyingId(clubId);
    setTimeout(() => {
      setJoinedClubs(prev => [...prev, clubId]);
      setApplyingId(null);
      alert(`Application to join the ${clubName} was submitted successfully!`);
    }, 800);
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-brand-text dark:text-brand-text-dark tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> Clubs & Committees
        </h2>
        <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/60 mt-0.5">
          Explore student societies, interest groups, and administrative committees inside the campus.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-brand-border/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl">
          {error}
        </div>
      ) : clubs.length === 0 ? (
        <GlassContainer className="py-12 text-center text-brand-text/50">
          <Users className="w-12 h-12 mx-auto opacity-30 mb-2" />
          <p className="text-sm font-semibold">No clubs or committees currently listed.</p>
        </GlassContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const isApplied = joinedClubs.includes(club.id);
            const isApplying = applyingId === club.id;

            return (
              <GlassContainer 
                key={club.id} 
                className="bg-white dark:bg-brand-card-dark border border-brand-border/20 dark:border-brand-border-dark/20 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-200"
              >
                <div>
                  {/* Card Header Logo / Initial placeholder */}
                  <div className="flex items-center gap-3 pb-3 border-b border-brand-border/10 dark:border-brand-border-dark/10 mb-4">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white overflow-hidden font-black text-xs uppercase select-none relative"
                      style={{
                        background: club.logo_url ? 'transparent' : 'linear-gradient(135deg, #4E220F, #8C5233)'
                      }}
                    >
                      {club.logo_url ? (
                        <img 
                          src={club.logo_url} 
                          alt={club.name} 
                          className="w-full h-full object-cover rounded-2xl animate-fade-in"
                          onError={(e) => { 
                            e.target.style.display = 'none'; 
                            e.target.parentElement.style.background = 'linear-gradient(135deg, #4E220F, #8C5233)';
                            e.target.parentElement.innerText = club.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
                          }}
                        />
                      ) : (
                        club.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-brand-text dark:text-brand-text-dark leading-tight">{club.name}</h4>
                      <span className="text-[10px] text-brand-text/45 dark:text-brand-text-dark/45 font-bold uppercase tracking-wider mt-0.5 block">Student Club</span>
                    </div>
                  </div>

                  <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/75 leading-relaxed min-h-12 line-clamp-3">
                    {club.description}
                  </p>
                </div>

                {/* Coordinator Meta Info */}
                <div className="mt-4 pt-4 border-t border-brand-border/10 dark:border-brand-border-dark/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-brand-text/65 dark:text-brand-text-dark/65">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-accent" />
                      {club.coordinator_name}
                    </span>
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${club.contact_email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <Mail className="w-3 h-3" />
                      {club.contact_email}
                    </a>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApply(club.id, club.name)}
                    disabled={isApplied || isApplying}
                    className={`w-full py-2 px-4 rounded-xl font-bold text-xs text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isApplied 
                        ? 'bg-secondary/15 text-accent border border-secondary/25 dark:text-brand-text-dark' 
                        : 'bg-accent hover:bg-accent/95 text-white shadow-md shadow-accent/15'
                    }`}
                  >
                    {isApplying ? (
                      <span className="animate-pulse">Submitting application...</span>
                    ) : isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Application Submitted
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Apply to Join
                      </>
                    )}
                  </button>
                </div>

              </GlassContainer>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClubsHub;
