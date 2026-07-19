import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Landmark, Search, Plus, Edit2, Trash2, X, MapPin, 
  Save, Building, HelpCircle, GraduationCap, School 
} from 'lucide-react';

const AdminCampusDirectory = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('classroom');
  const [locationStr, setLocationStr] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'classroom', label: 'Classroom / Block' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'office', label: 'Administrative Office' },
    { value: 'canteen', label: 'Canteen/Cafeteria' },
    { value: 'facility', label: 'Campus Facility' },
    { value: 'library', label: 'Library' }
  ];

  const fetchLocations = async () => {
    try {
      const res = await api.get('core/campus-info/');
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch campus locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openAddModal = () => {
    setEditingLocation(null);
    setName('');
    setCategory('classroom');
    setLocationStr('');
    setDescription('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (loc) => {
    setEditingLocation(loc);
    setName(loc.name);
    setCategory(loc.category);
    setLocationStr(loc.location);
    setDescription(loc.description || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!name.trim()) {
      setErrorMsg("Name is required.");
      setSubmitting(false);
      return;
    }
    if (!locationStr.trim()) {
      setErrorMsg("Location / Campus Spot is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      category: category,
      location: locationStr.trim(),
      description: description.trim()
    };

    try {
      if (editingLocation) {
        await api.put(`core/campus-info/${editingLocation.id}/`, payload);
      } else {
        await api.post('core/campus-info/', payload);
      }
      fetchLocations();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save location. Please check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this campus location?")) {
      try {
        await api.delete(`core/campus-info/${id}/`);
        fetchLocations();
      } catch (err) {
        console.error("Failed to delete location:", err);
      }
    }
  };

  const filteredLocations = locations.filter(loc => {
    const query = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(query) ||
      loc.location.toLowerCase().includes(query) ||
      loc.category_display?.toLowerCase().includes(query) ||
      (loc.description && loc.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <Landmark className="w-8 h-8 text-accent animate-bounce-slow" />
            Campus Directory Manager
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Create and edit blocks, academic offices, laboratories, and other student campus guide spots.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Campus Location
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by block name, labs, facilities..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
        />
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading directory index...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Landmark className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No campus locations matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <GlassContainer
              key={loc.id}
              className="p-5 flex flex-col justify-between border border-brand-border/10 dark:border-brand-border-dark/15 hover:scale-[1.01] hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-3.5 text-left">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
                  <div>
                    <span className="text-[9px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      {loc.category_display}
                    </span>
                    <h4 className="text-sm font-black text-brand-text dark:text-brand-text-dark mt-1 leading-snug">
                      {loc.name}
                    </h4>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(loc)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-brand-text/75 dark:text-brand-text-dark/80">
                  <p className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-accent" /> {loc.location}
                  </p>
                  {loc.description && (
                    <p className="text-[11px] leading-relaxed text-brand-text/60 dark:text-brand-text-dark/65 pt-1">
                      {loc.description}
                    </p>
                  )}
                </div>
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
                <Landmark className="w-5 h-5 text-accent" />
                {editingLocation ? 'Edit Location' : 'Add Campus Location'}
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
                  Location / Block Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RV Block (Research & Vision)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Campus Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    placeholder="e.g. West Campus Gate 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Description / Labs Inside
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Houses the Computer Vision Laboratory, Data Science Lab, etc."
                  rows={3}
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
                  {submitting ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampusDirectory;
