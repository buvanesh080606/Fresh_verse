import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Sparkles, Search, Plus, Edit2, Trash2, X, 
  Save, AlertCircle, Mail, User, Award, Link
} from 'lucide-react';

const AdminClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLogoGenerator, setShowLogoGenerator] = useState(false);
  const [logoInitials, setLogoInitials] = useState('');
  const [logoGradient, setLogoGradient] = useState('brown');

  const fetchClubs = async () => {
    try {
      const res = await api.get('core/clubs/');
      setClubs(res.data);
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const openAddModal = () => {
    setEditingClub(null);
    setName('');
    setDescription('');
    setLogoUrl('');
    setCoordinatorName('');
    setContactEmail('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (club) => {
    setEditingClub(club);
    setName(club.name);
    setDescription(club.description);
    setLogoUrl(club.logo_url || '');
    setCoordinatorName(club.coordinator_name);
    setContactEmail(club.contact_email);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!name.trim()) {
      setErrorMsg("Club name is required.");
      setSubmitting(false);
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Description is required.");
      setSubmitting(false);
      return;
    }
    if (!coordinatorName.trim()) {
      setErrorMsg("Coordinator name is required.");
      setSubmitting(false);
      return;
    }
    if (!contactEmail.trim()) {
      setErrorMsg("Contact email is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      logo_url: logoUrl.trim() || null,
      coordinator_name: coordinatorName.trim(),
      contact_email: contactEmail.trim()
    };

    try {
      if (editingClub) {
        await api.put(`core/clubs/${editingClub.id}/`, payload);
      } else {
        await api.post('core/clubs/', payload);
      }
      fetchClubs();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save club. Please verify your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateAndDownloadLogo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw Gradient
    let gradient = ctx.createLinearGradient(0, 0, 256, 256);
    if (logoGradient === 'brown') {
      gradient.addColorStop(0, '#4E220F');
      gradient.addColorStop(1, '#8C5233');
    } else if (logoGradient === 'sunset') {
      gradient.addColorStop(0, '#F97316');
      gradient.addColorStop(1, '#E11D48');
    } else if (logoGradient === 'indigo') {
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(1, '#06B6D4');
    } else if (logoGradient === 'emerald') {
      gradient.addColorStop(0, '#059669');
      gradient.addColorStop(1, '#10B981');
    } else {
      gradient.addColorStop(0, '#D97706');
      gradient.addColorStop(1, '#F59E0B');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Decorative inner borders
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(128, 128, 102, 0, Math.PI * 2);
    ctx.stroke();

    // Initials
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 80px Inter, sans-serif';
    
    const initials = logoInitials.trim() || name.split(' ').map(w => w[0]).join('').substring(0, 3) || 'CLB';
    ctx.fillText(initials.toUpperCase(), 128, 128);

    const logoDataUrl = canvas.toDataURL();
    setLogoUrl(logoDataUrl);
    setShowLogoGenerator(false);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `${initials.toLowerCase()}_logo.png`;
    link.href = logoDataUrl;
    link.click();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) {
      try {
        await api.delete(`core/clubs/${id}/`);
        fetchClubs();
      } catch (err) {
        console.error("Failed to delete club:", err);
      }
    }
  };

  const filteredClubs = clubs.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || 
           c.coordinator_name.toLowerCase().includes(query) || 
           c.description.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-accent" />
            Clubs &amp; Committees Management
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Create student societies, interest groups, and administrative committees, and modify their coordinators and profiles.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Club / Committee
        </button>
      </div>

      {/* Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm font-bold text-brand-text/75 dark:text-brand-text-dark/75">
          Active Organizations ({clubs.length})
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs, coordinators..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
          />
        </div>
      </div>

      {/* Grid of Clubs */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading campus clubs...</p>
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50 border border-dashed border-brand-border/30 rounded-3xl">
          <Award className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No student clubs or committees listed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <GlassContainer 
              key={club.id} 
              className="p-5 flex flex-col justify-between border border-brand-border/20 rounded-3xl hover:scale-[1.01] transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white overflow-hidden font-black text-sm uppercase select-none relative"
                      style={{
                        background: club.logo_url ? 'transparent' : 'linear-gradient(135deg, #4E220F, #8C5233)'
                      }}
                    >
                      {club.logo_url ? (
                        <img 
                          src={club.logo_url} 
                          alt={club.name} 
                          className="w-full h-full object-cover animate-fade-in"
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
                      <h3 className="text-sm font-extrabold text-brand-text dark:text-brand-text-dark leading-tight">
                        {club.name}
                      </h3>
                      <span className="text-[10px] text-brand-text/45 font-bold uppercase tracking-wider block mt-0.5">Student Society</span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(club)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                      title="Edit club details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(club.id)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                      title="Remove club"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/80 min-h-12 line-clamp-3 leading-relaxed">
                  {club.description}
                </p>

                <div className="pt-4 border-t border-brand-border/10 dark:border-brand-border-dark/10 space-y-2 text-xs font-semibold text-brand-text/80 dark:text-brand-text-dark/85">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                    <span>Coordinator: {club.coordinator_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${club.contact_email}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {club.contact_email}
                    </a>
                  </div>
                </div>
              </div>
            </GlassContainer>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up scrollbar-thin scrollbar-thumb-brand-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {editingClub ? 'Edit Club Profile' : 'Add Club Profile'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-brand-bg dark:hover:bg-brand-border-dark/20 text-brand-text/60 dark:text-brand-text-dark/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs rounded-xl font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fine Arts & Drama Club"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75">
                    Logo Image URL (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLogoGenerator(!showLogoGenerator)}
                    className="text-[10px] font-extrabold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    🎨 {showLogoGenerator ? "Hide Logo Maker" : "Open Logo Maker"}
                  </button>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="e.g. https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring mb-3"
                />

                {/* Logo Generator Panel */}
                {showLogoGenerator && (
                  <div className="p-3 bg-brand-bg/15 dark:bg-brand-border-dark/10 border border-brand-border/40 dark:border-brand-border-dark/30 rounded-2xl space-y-3 mb-3 text-left">
                    <div className="text-[10px] font-black uppercase text-brand-text/50 dark:text-brand-text-dark/50">Logo Preview</div>
                    
                    {/* Live Canvas Mock */}
                    <div className="flex justify-center py-2">
                      <div 
                        className="w-24 h-24 rounded-2xl flex flex-col justify-center items-center text-center p-2 text-white shadow-inner select-none relative overflow-hidden font-black text-3xl uppercase"
                        style={{
                          background: 
                            logoGradient === 'brown' ? 'linear-gradient(135deg, #4E220F, #8C5233)' :
                            logoGradient === 'sunset' ? 'linear-gradient(135deg, #F97316, #E11D48)' :
                            logoGradient === 'indigo' ? 'linear-gradient(135deg, #4F46E5, #06B6D4)' :
                            logoGradient === 'emerald' ? 'linear-gradient(135deg, #059669, #10B981)' :
                            'linear-gradient(135deg, #D97706, #F59E0B)'
                        }}
                      >
                        <div className="absolute inset-1.5 border border-white/10 rounded-xl pointer-events-none"></div>
                        {logoInitials.trim() || name.split(' ').map(w => w[0]).join('').substring(0, 3) || 'CLB'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block font-bold mb-0.5 text-brand-text/60 dark:text-brand-text-dark/65">Logo Initials</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={logoInitials}
                          onChange={(e) => setLogoInitials(e.target.value)}
                          placeholder="e.g. ACM"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-[10px] text-brand-text dark:text-brand-text-dark input-focus-ring"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-0.5 text-brand-text/60 dark:text-brand-text-dark/65">Theme/Gradient</label>
                        <select
                          value={logoGradient}
                          onChange={(e) => setLogoGradient(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-[10px] text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                        >
                          <option value="brown">Deep Brown</option>
                          <option value="sunset">Sunset Orange</option>
                          <option value="indigo">Midnight Indigo</option>
                          <option value="emerald">Forest Emerald</option>
                          <option value="gold">Gold Rush</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={generateAndDownloadLogo}
                      className="w-full py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-black text-[11px] transition shadow-md shadow-accent/20 cursor-pointer"
                    >
                      Generate &amp; Apply Logo
                    </button>
                    <p className="text-[9px] text-brand-text/50 dark:text-brand-text-dark/50 leading-snug">
                      💡 This will automatically apply the logo to the input field above and save a copy to your computer!
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="e.g. Prof. Alan Turing"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. clubs@freshverse.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Club Description &amp; Objectives *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter club purpose, upcoming events, and membership eligibility details..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-brand-border/50 text-brand-text dark:text-brand-text-dark/80 text-xs font-black transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/95 disabled:opacity-50 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClubs;
