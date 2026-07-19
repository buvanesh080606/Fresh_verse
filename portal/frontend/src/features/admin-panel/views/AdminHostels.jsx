import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Building, Search, Plus, Edit2, Trash2, X, 
  Save, AlertCircle, Phone, User, MapPin, AlignLeft
} from 'lucide-react';

const AdminHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'boys', 'girls'
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('boys');
  const [wardenName, setWardenName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [rules, setRules] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHostels = async () => {
    try {
      const res = await api.get('core/hostels/');
      setHostels(res.data);
    } catch (err) {
      console.error("Failed to fetch hostels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const openAddModal = () => {
    setEditingHostel(null);
    setName('');
    setType('boys');
    setWardenName('');
    setContact('');
    setLocation('');
    setRules('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (h) => {
    setEditingHostel(h);
    setName(h.name);
    setType(h.type);
    setWardenName(h.warden_name);
    setContact(h.contact);
    setLocation(h.location || '');
    setRules(h.rules || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!name.trim()) {
      setErrorMsg("Hostel name is required.");
      setSubmitting(false);
      return;
    }
    if (!wardenName.trim()) {
      setErrorMsg("Warden name is required.");
      setSubmitting(false);
      return;
    }
    if (!contact.trim()) {
      setErrorMsg("Contact details are required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      type: type,
      warden_name: wardenName.trim(),
      contact: contact.trim(),
      location: location.trim(),
      rules: rules.trim()
    };

    try {
      if (editingHostel) {
        await api.put(`core/hostels/${editingHostel.id}/`, payload);
      } else {
        await api.post('core/hostels/', payload);
      }
      fetchHostels();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save hostel. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hostel? All student registrations linked to this hostel will lose association.")) {
      try {
        await api.delete(`core/hostels/${id}/`);
        fetchHostels();
      } catch (err) {
        console.error("Failed to delete hostel:", err);
      }
    }
  };

  const filteredHostels = hostels.filter(h => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = h.name.toLowerCase().includes(query) || 
                          h.warden_name.toLowerCase().includes(query) || 
                          (h.location && h.location.toLowerCase().includes(query));
    
    // Tab filter
    if (activeTab === 'boys') return matchesSearch && h.type === 'boys';
    if (activeTab === 'girls') return matchesSearch && h.type === 'girls';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <Building className="w-8 h-8 text-accent animate-bounce-slow" />
            Hostel Management
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Configure residence halls, define warden contact details, list locations, and publish campus residential regulations.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Hostel
        </button>
      </div>

      {/* Tabs and Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-brand-bg/50 dark:bg-brand-border-dark/15 border border-brand-border/30 dark:border-brand-border-dark/30 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-accent text-white shadow-sm shadow-accent/15' 
                : 'text-brand-text/60 dark:text-brand-text-dark/60 hover:text-brand-text dark:hover:text-brand-text-dark'
            }`}
          >
            All Hostels ({hostels.length})
          </button>
          <button
            onClick={() => setActiveTab('boys')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'boys' 
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/15' 
                : 'text-brand-text/60 dark:text-brand-text-dark/60 hover:text-brand-text dark:hover:text-brand-text-dark'
            }`}
          >
            Boys Hostels ({hostels.filter(h => h.type === 'boys').length})
          </button>
          <button
            onClick={() => setActiveTab('girls')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'girls' 
                ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/15' 
                : 'text-brand-text/60 dark:text-brand-text-dark/60 hover:text-brand-text dark:hover:text-brand-text-dark'
            }`}
          >
            Girls Hostels ({hostels.filter(h => h.type === 'girls').length})
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, warden, location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
          />
        </div>
      </div>

      {/* Grid of Hostels */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading hostels data...</p>
        </div>
      ) : filteredHostels.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50 border border-dashed border-brand-border/30 rounded-3xl">
          <Building className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No hostels match the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHostels.map((hostel) => (
            <GlassContainer 
              key={hostel.id} 
              className={`p-5 flex flex-col justify-between border-t-4 transition-all hover:scale-[1.01] ${
                hostel.type === 'boys' ? 'border-t-blue-500' : 'border-t-pink-500'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      hostel.type === 'boys' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      {hostel.type === 'boys' ? "Boys Hostel" : "Girls Hostel"}
                    </span>
                    <h3 className="text-base font-extrabold text-brand-text dark:text-brand-text-dark mt-2">
                      {hostel.name}
                    </h3>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(hostel)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(hostel.id)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-brand-text/80 dark:text-brand-text-dark/85 font-semibold">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                    <span>Location: {hostel.location || 'Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                    <span>Warden: {hostel.warden_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                    <span>Contact: {hostel.contact}</span>
                  </div>
                </div>

                {hostel.rules && (
                  <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10">
                    <span className="text-[10px] font-bold text-brand-text/50 dark:text-brand-text-dark/50 flex items-center gap-1 mb-1">
                      <AlignLeft className="w-3 h-3" /> HOSTEL REGULATION DETAILS:
                    </span>
                    <p className="text-[11px] text-brand-text/70 dark:text-brand-text-dark/70 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {hostel.rules}
                    </p>
                  </div>
                )}
              </div>
            </GlassContainer>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-accent" />
                {editingHostel ? 'Edit Hostel Residence' : 'Add Hostel Residence'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Hostel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ganga Hostel Block"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Hostel Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                  >
                    <option value="boys" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Boys Hostel</option>
                    <option value="girls" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Girls Hostel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Warden Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={wardenName}
                    onChange={(e) => setWardenName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Contact No *
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Location (Campus Location)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near West Gate, Campus North wing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Hostel Rules & Regulations
                </label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Enter hostel curfews, mess timings, rules..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring resize-none"
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
                  {submitting ? 'Saving...' : 'Save Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHostels;
