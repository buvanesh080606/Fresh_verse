import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  CalendarDays, Search, Plus, Edit2, Trash2, X, 
  Save, AlertCircle, Calendar, GraduationCap, Users,
  Upload, RefreshCcw, CheckCircle2, AlertTriangle
} from 'lucide-react';

const AdminAcademicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual Add/Edit Form state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('academic_activity');
  const [dayOrder, setDayOrder] = useState('');
  const [department, setDepartment] = useState('All');
  const [section, setSection] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Upload Parser state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedGrid, setParsedGrid] = useState([]);
  const [targetDept, setTargetDept] = useState('All');
  const [targetSection, setTargetSection] = useState('All');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [importing, setImporting] = useState(false);

  const eventTypes = [
    { value: 'academic_activity', label: 'Academic Activity' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'exam', label: 'Examination' }
  ];

  const fetchEvents = async () => {
    try {
      const res = await api.get('core/calendar/');
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAddModal = () => {
    setEditingEvent(null);
    setEventDate('');
    setDescription('');
    setEventType('academic_activity');
    setDayOrder('');
    setDepartment('All');
    setSection('All');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (evt) => {
    setEditingEvent(evt);
    setEventDate(evt.event_date);
    setDescription(evt.description);
    setEventType(evt.event_type);
    setDayOrder(evt.day_order || '');
    setDepartment(evt.department || 'All');
    setSection(evt.section || 'All');
    setErrorMsg('');
    setShowModal(true);
  };

  const openUploadModal = () => {
    setFile(null);
    setParsedGrid([]);
    setTargetDept('All');
    setTargetSection('All');
    setUploadError('');
    setUploadSuccess('');
    setShowUploadModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!eventDate) {
      setErrorMsg("Event date is required.");
      setSubmitting(false);
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Description is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      event_date: eventDate,
      description: description.trim(),
      event_type: eventType,
      day_order: dayOrder ? dayOrder.trim() : null,
      department: department,
      section: section
    };

    try {
      if (editingEvent) {
        await api.put(`core/calendar/${editingEvent.id}/`, payload);
      } else {
        await api.post('core/calendar/', payload);
      }
      fetchEvents();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save event. Verify inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError('');
      setUploadSuccess('');
    }
  };

  const handleParsePlanner = async () => {
    if (!file) {
      setUploadError('Please select a file first.');
      return;
    }

    setParsing(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('ai/parse-document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      let extracted = res.data.extracted_data || [];
      if (!Array.isArray(extracted)) {
        extracted = [extracted];
      }

      // Normalize row schemas and map empty departments/sections to the chosen modal target dropdowns
      const normalized = extracted.map(row => ({
        event_date: row.event_date || '',
        description: row.description || '',
        event_type: row.event_type || 'academic_activity',
        day_order: row.day_order || '',
        department: row.department && row.department !== 'All' ? row.department : targetDept,
        section: row.section && row.section !== 'All' ? row.section : targetSection
      }));

      setParsedGrid(normalized);
      setUploadSuccess(`Planner parsed successfully! Extracted ${normalized.length} entries. Review them in the preview grid below.`);
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || 'AI Parsing failed. Check file format (PDF, Excel, or high quality image).');
    } finally {
      setParsing(false);
    }
  };

  const handleCellChange = (index, key, val) => {
    const updated = [...parsedGrid];
    updated[index][key] = val;
    setParsedGrid(updated);
  };

  const handleImportToCalendar = async () => {
    setImporting(true);
    setUploadError('');
    try {
      const promises = parsedGrid.map(row => {
        const payload = {
          event_date: row.event_date,
          description: row.description.trim(),
          event_type: row.event_type,
          day_order: row.day_order && row.day_order.trim() !== '' ? row.day_order.trim() : null,
          department: row.department || targetDept,
          section: row.section || targetSection
        };
        return api.post('core/calendar/', payload);
      });
      await Promise.all(promises);
      fetchEvents();
      setShowUploadModal(false);
      alert(`Successfully imported ${parsedGrid.length} events into the Academic Calendar!`);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to import one or more calendar entries. Double check event date formatting.');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this calendar milestone?")) {
      try {
        await api.delete(`core/calendar/${id}/`);
        fetchEvents();
      } catch (err) {
        console.error("Failed to delete calendar event:", err);
      }
    }
  };

  const handleClearAllCalendar = async () => {
    const first = window.confirm(
      "⚠️ WARNING: This will permanently delete the ENTIRE Academic Calendar.\n\nAll events, holidays, exam schedules, and milestones will be erased.\n\nAre you absolutely sure?"
    );
    if (!first) return;
    const second = window.confirm(
      "🔴 FINAL CONFIRMATION\n\nYou are about to delete ALL academic calendar data. This CANNOT be undone.\n\nClick OK to proceed."
    );
    if (!second) return;
    try {
      await api.delete('core/calendar/clear-all/');
      fetchEvents();
      alert('Academic Calendar has been completely cleared.');
    } catch (err) {
      console.error('Failed to clear academic calendar:', err);
      alert(err.response?.data?.error || 'Failed to clear calendar. Please try again.');
    }
  };

  const filteredEvents = events.filter(evt => {
    const query = searchQuery.toLowerCase();
    return (
      evt.description.toLowerCase().includes(query) ||
      evt.event_type_display?.toLowerCase().includes(query) ||
      (evt.day_order && evt.day_order.toLowerCase().includes(query)) ||
      (evt.department && evt.department.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <CalendarDays className="w-8 h-8 text-accent animate-bounce-slow" />
            Academic Planner Calendar
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Publish academic calendar milestones, exams, day orders, and targeted holidays per department/section.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/45 hover:bg-brand-border/25 text-brand-text dark:text-brand-text-dark text-xs font-black transition-all cursor-pointer shadow-sm shadow-black/5"
          >
            <Upload className="w-4 h-4" /> Upload Planner PDF/Image
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Calendar Event
          </button>
          {events.length > 0 && (
            <button
              onClick={handleClearAllCalendar}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-rose-600/25 flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4" /> Delete Whole Calendar
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events, day orders, target departments..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
        />
      </div>

      {/* Events Table / List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading calendar planner...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <CalendarDays className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No calendar milestones registered.</p>
        </div>
      ) : (
        <GlassContainer className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-brand-border/25 dark:border-brand-border-dark/25 bg-brand-bg/50 dark:bg-brand-border-dark/10">
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">Date</th>
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">Description</th>
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">Type</th>
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">Day Order</th>
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">Target Scope</th>
                  <th className="py-3.5 px-5 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-brand-border-dark/10">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-brand-border/5 dark:hover:bg-brand-border-dark/5 transition-all">
                    <td className="py-4 px-5 text-xs font-bold text-brand-text dark:text-brand-text-dark">
                      {new Date(evt.event_date).toLocaleDateString([], { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-5 text-xs text-brand-text/80 dark:text-brand-text-dark/85 font-semibold">
                      {evt.description}
                    </td>
                    <td className="py-4 px-5 text-xs">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        evt.event_type === 'holiday' ? 'bg-red-500/10 text-red-500' :
                        evt.event_type === 'exam' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-brand-bg/30 text-brand-text dark:bg-brand-bg-dark/40 dark:text-brand-text-dark border border-brand-border/45 dark:border-brand-border-dark/40'
                      }`}>
                        {evt.event_type_display}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs">
                      {evt.day_order ? (
                        <span className="px-1.5 py-0.5 rounded bg-brand-bg/30 text-brand-text dark:bg-brand-bg-dark/40 dark:text-brand-text-dark border border-brand-border/45 dark:border-brand-border-dark/40 text-[9px] font-bold">
                          Day Order {evt.day_order}
                        </span>
                      ) : (
                        <span className="text-brand-text/30 dark:text-brand-text-dark/30">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs font-extrabold text-brand-text/70 dark:text-brand-text-dark/70">
                      {evt.department === 'All' && evt.section === 'All' ? (
                        <span className="text-accent dark:text-brand-text-dark/90 font-bold">Global (All Students)</span>
                      ) : (
                        <span>Dept: {evt.department} | Sec: {evt.section}</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(evt)}
                        className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt.id)}
                        className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassContainer>
      )}

      {/* Manual Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                {editingEvent ? 'Edit Calendar Milestone' : 'Add Calendar Event'}
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
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  >
                    {eventTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                  Description / Event Details *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Commencement of Mid-Term Examinations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Day Order
                  </label>
                  <select
                    value={dayOrder}
                    onChange={(e) => setDayOrder(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  >
                    <option value="">None</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Target Dept
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  >
                    <option value="All">All</option>
                    <option value="CSE(AI&ML)">CSE (AI &amp; ML)</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="IT">IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Target Sec
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  >
                    <option value="All">All</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
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
                  {submitting ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Upload & Parsing Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-6 text-left my-8 animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-accent" />
                Upload Academic Planner (PDF / Image / Excel)
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl hover:bg-brand-bg dark:hover:bg-brand-border-dark/20 text-brand-text/60 dark:text-brand-text-dark/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-4 bg-secondary/15 border border-secondary/35 text-accent dark:text-brand-text-dark text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
                {uploadSuccess}
              </div>
            )}

            {/* Target Options and File Input */}
            {parsedGrid.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4 md:col-span-1">
                  <h4 className="text-xs font-black uppercase text-brand-text/50 dark:text-brand-text-dark/50">1. Target Scope</h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">Target Department</label>
                    <select
                      value={targetDept}
                      onChange={(e) => setTargetDept(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                    >
                      <option value="All">All Departments</option>
                      <option value="CSE(AI&ML)">CSE (AI &amp; ML)</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-brand-text/75 dark:text-brand-text-dark/80 mb-1">Target Section</label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                    >
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-black uppercase text-brand-text/50 dark:text-brand-text-dark/50">2. Select Planner File</h4>
                  <div className="border-2 border-dashed border-brand-border/40 dark:border-brand-border-dark/35 rounded-2xl p-8 text-center hover:border-accent/40 transition">
                    <Upload className="w-10 h-10 text-accent mx-auto mb-3 opacity-75" />
                    <p className="text-xs font-bold text-brand-text dark:text-brand-text-dark mb-1">Academic Planner Document</p>
                    <p className="text-[10px] text-brand-text/50 dark:text-brand-text-dark/50 mb-4">Supports PNG, JPG, PDF, or Excel sheets.</p>
                    
                    <input
                      type="file"
                      id="modal-file-upload"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="modal-file-upload"
                      className="px-4 py-2 rounded-xl border border-brand-border dark:border-brand-border-dark/45 text-xs font-extrabold text-brand-text dark:text-brand-text-dark hover:bg-brand-border/20 transition cursor-pointer inline-block"
                    >
                      {file ? file.name : 'Choose File'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Preview Spreadsheet Grid */}
            {parsedGrid.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-brand-text/50 dark:text-brand-text-dark/50">
                    Preview Extracted Planner Milestones
                  </h4>
                  <p className="text-[10px] text-brand-text/40 dark:text-brand-text-dark/45">
                    Double-click cell to modify value. Unsaved calendar rows default to: <span className="font-extrabold text-accent">{targetDept} - {targetSection}</span>
                  </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto border border-brand-border/20 dark:border-brand-border-dark/25 rounded-2xl">
                  <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                    <thead className="bg-brand-bg/50 dark:bg-brand-border-dark/15 sticky top-0">
                      <tr className="border-b border-brand-border/20">
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Date (YYYY-MM-DD)</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Event Description</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Event Type</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Day Order</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Target Dept</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-brand-text/65 dark:text-brand-text-dark/70">Target Sec</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/10 dark:divide-brand-border-dark/10">
                      {parsedGrid.map((row, index) => (
                        <tr key={index} className="hover:bg-brand-border/5">
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.event_date}
                              onChange={(e) => handleCellChange(index, 'event_date', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-transparent border border-transparent hover:border-brand-border/40 focus:border-accent text-xs text-brand-text dark:text-brand-text-dark"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleCellChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-brand-border/40 focus:border-accent text-xs text-brand-text dark:text-brand-text-dark"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={row.event_type}
                              onChange={(e) => handleCellChange(index, 'event_type', e.target.value)}
                              className="px-2 py-1 rounded border border-brand-border bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark"
                            >
                              <option value="academic_activity">Academic Activity</option>
                              <option value="holiday">Holiday</option>
                              <option value="exam">Examination</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.day_order || ''}
                              onChange={(e) => handleCellChange(index, 'day_order', e.target.value)}
                              placeholder="None"
                              className="w-16 px-2 py-1 bg-transparent border border-transparent hover:border-brand-border/40 focus:border-accent text-center text-xs text-brand-text dark:text-brand-text-dark"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.department}
                              onChange={(e) => handleCellChange(index, 'department', e.target.value)}
                              className="w-16 px-2 py-1 bg-transparent border border-transparent hover:border-brand-border/40 focus:border-accent text-xs text-brand-text dark:text-brand-text-dark"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.section}
                              onChange={(e) => handleCellChange(index, 'section', e.target.value)}
                              className="w-16 px-2 py-1 bg-transparent border border-transparent hover:border-brand-border/40 focus:border-accent text-xs text-brand-text dark:text-brand-text-dark"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              onClick={() => setParsedGrid(parsedGrid.filter((_, i) => i !== index))}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-brand-border/50 text-brand-text dark:text-brand-text-dark/80 text-xs font-black transition cursor-pointer"
              >
                Cancel
              </button>

              {parsedGrid.length === 0 ? (
                <button
                  onClick={handleParsePlanner}
                  disabled={parsing || !file}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/95 disabled:opacity-50 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex items-center gap-1.5"
                >
                  {parsing ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Parsing Planner...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-4 h-4" />
                      Process with AI OCR
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleImportToCalendar}
                  disabled={importing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {importing ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Confirm & Import events
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicCalendar;
