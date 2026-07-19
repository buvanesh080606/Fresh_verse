import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Bus, Search, Plus, Edit2, Trash2, X, PlusCircle, MinusCircle, 
  MapPin, Clock, Save, Building2, HelpCircle 
} from 'lucide-react';

const AdminTransport = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeNo, setRouteNo] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('FreshVerse Campus');
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [stops, setStops] = useState([{ stop: '', time: '' }]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const campusBlocks = ['RV Block', 'KS Block', 'BD Block', 'Mech Block', 'MBA Block'];

  const fetchRoutes = async () => {
    try {
      const res = await api.get('core/bus-routes/');
      // Sort routes by route_no numerically if possible
      const sorted = res.data.sort((a, b) => {
        const numA = parseInt(a.route_no);
        const numB = parseInt(b.route_no);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.route_no.localeCompare(b.route_no);
      });
      setRoutes(sorted);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openAddModal = () => {
    setEditingRoute(null);
    setRouteNo('');
    setSource('');
    setDestination('FreshVerse Campus');
    setSelectedBlocks(['RV Block', 'KS Block', 'BD Block', 'Mech Block', 'MBA Block']);
    setStops([{ stop: '', time: '08:00 AM' }]);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (route) => {
    setEditingRoute(route);
    setRouteNo(route.route_no);
    setSource(route.source);
    setDestination(route.destination);
    
    // Parse comma separated blocks
    const blocks = route.blocks_served ? route.blocks_served.split(',').map(b => b.trim()) : [];
    setSelectedBlocks(blocks);
    
    // Load stops
    setStops(route.timings_json || [{ stop: '', time: '' }]);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleBlockCheckbox = (block) => {
    if (selectedBlocks.includes(block)) {
      setSelectedBlocks(selectedBlocks.filter(b => b !== block));
    } else {
      setSelectedBlocks([...selectedBlocks, block]);
    }
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  const addStopField = () => {
    setStops([...stops, { stop: '', time: '08:00 AM' }]);
  };

  const removeStopField = (index) => {
    if (stops.length > 1) {
      setStops(stops.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!routeNo.trim()) {
      setErrorMsg("Bus/Route Number is required.");
      setSubmitting(false);
      return;
    }
    if (!source.trim()) {
      setErrorMsg("Start source is required.");
      setSubmitting(false);
      return;
    }

    // Filter out empty stops
    const cleanStops = stops.filter(s => s.stop.trim() !== '');
    if (cleanStops.length === 0) {
      setErrorMsg("At least one dropping point / halt is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      route_no: routeNo.trim(),
      source: source.trim(),
      destination: destination.trim(),
      timings_json: cleanStops
    };

    try {
      if (editingRoute) {
        await api.put(`core/bus-routes/${editingRoute.id}/`, payload);
      } else {
        await api.post('core/bus-routes/', payload);
      }
      fetchRoutes();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.route_no || err.response?.data?.error || "Failed to save route. Check if the Bus/Route Number already exists.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bus route?")) {
      try {
        await api.delete(`core/bus-routes/${id}/`);
        fetchRoutes();
      } catch (err) {
        console.error("Failed to delete route:", err);
      }
    }
  };

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = 
      r.route_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.blocks_served && r.blocks_served.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.timings_json?.some(s => s.stop.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <Bus className="w-8 h-8 text-accent animate-bounce-slow" />
            Manage Bus Routes &amp; Transits
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Configure student transit schedules, add halts, edit timings, and map campus blocks.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Bus Route
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Bus No, dropping points, or blocks..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading transit registry...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Bus className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No transit routes recorded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => (
            <GlassContainer
              key={route.id}
              className="p-5 flex flex-col justify-between border border-brand-border/10 dark:border-brand-border-dark/15 hover:scale-[1.01] hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-4 text-left">
                {/* Route Header */}
                <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent font-black text-sm">
                      #{route.route_no}
                    </div>
                    <div>
                      <h4 className="font-black text-brand-text dark:text-brand-text-dark text-xs uppercase tracking-wide">
                        Bus {route.route_no}
                      </h4>
                      <p className="text-[9px] text-brand-text/45 dark:text-brand-text-dark/45">
                        {route.source} → {route.destination}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(route)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>



                {/* Halts & Timings */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-brand-text/40 dark:text-brand-text-dark/45 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-accent" /> Halts &amp; Dropping Times
                  </span>
                  
                  <div className="relative pl-3 border-l-2 border-brand-border/20 dark:border-brand-border-dark/25 space-y-3">
                    {route.timings_json?.map((stop, sIdx) => (
                      <div key={sIdx} className="relative flex items-center justify-between text-[11px]">
                        {/* Dot indicator */}
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white dark:border-brand-card-dark" />
                        <span className="font-extrabold text-brand-text dark:text-brand-text-dark/85">
                          {stop.stop}
                        </span>
                        <span className="text-[9px] text-accent font-black flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {stop.time}
                        </span>
                      </div>
                    ))}
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
          <div className="relative w-full max-w-lg rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <Bus className="w-5 h-5 text-accent" />
                {editingRoute ? `Edit Bus Route #${routeNo}` : 'Add Bus Route'}
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
                    Bus / Route Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeNo}
                    onChange={(e) => setRouteNo(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Start Source *
                  </label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Trichy Old Stand"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. FreshVerse Campus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>



              {/* Halts & Timings dynamic fields */}
              <div className="space-y-2 pt-2 border-t border-brand-border/10 dark:border-brand-border-dark/10">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75">
                    Dropping Points &amp; Halts
                  </label>
                  <button
                    type="button"
                    onClick={addStopField}
                    className="text-[10px] font-black text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={stop.stop}
                          onChange={(e) => handleStopChange(idx, 'stop', e.target.value)}
                          placeholder="Halt Stop name"
                          className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="text"
                          required
                          value={stop.time}
                          onChange={(e) => handleStopChange(idx, 'time', e.target.value)}
                          placeholder="e.g. 08:00 AM"
                          className="w-full px-3 py-2 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStopField(idx)}
                        disabled={stops.length === 1}
                        className="p-2 text-brand-text/40 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  {submitting ? 'Saving Route...' : 'Save Bus Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransport;
