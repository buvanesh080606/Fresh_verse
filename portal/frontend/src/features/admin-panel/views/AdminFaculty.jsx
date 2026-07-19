import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Users, Search, Plus, Edit2, Trash2, X, 
  Save, Mail, Phone, MapPin, Briefcase, Calendar
} from 'lucide-react';

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedSemFilter, setSelectedSemFilter] = useState('all');

  // Form / Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [cabin, setCabin] = useState('');
  const [phone, setPhone] = useState('');
  
  // Semester rotations (1 to 8)
  const [selectedSemesters, setSelectedSemesters] = useState([]); // Array of strings like ['1', '3']
  const [isAllSemesters, setIsAllSemesters] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculty = async () => {
    try {
      const res = await api.get('academic/faculty/');
      setFaculty(res.data);
    } catch (err) {
      console.error("Failed to fetch faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const departments = ['CSE', 'CSE(AI&ML)', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
  const semesterOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Get unique departments present in loaded data for filter dropdown
  const filterDepts = ['all', ...new Set(faculty.map(f => f.department).filter(Boolean))];

  const openAddModal = () => {
    setEditingFaculty(null);
    setName('');
    setEmail('');
    setDepartment('CSE');
    setDesignation('Assistant Professor');
    setCabin('');
    setPhone('');
    setSelectedSemesters([]);
    setIsAllSemesters(true);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setName(f.name);
    setEmail(f.email);
    setDepartment(f.department || 'CSE');
    setDesignation(f.designation || 'Assistant Professor');
    setCabin(f.cabin || '');
    setPhone(f.phone || '');
    
    const semVal = f.semesters || 'All';
    if (semVal.toLowerCase() === 'all') {
      setIsAllSemesters(true);
      setSelectedSemesters([]);
    } else {
      setIsAllSemesters(false);
      setSelectedSemesters(semVal.split(',').map(s => s.trim()));
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSemesterCheckboxChange = (sem) => {
    if (selectedSemesters.includes(sem)) {
      setSelectedSemesters(prev => prev.filter(s => s !== sem));
    } else {
      setSelectedSemesters(prev => [...prev, sem]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!name.trim()) {
      setErrorMsg("Faculty name is required.");
      setSubmitting(false);
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email address is required.");
      setSubmitting(false);
      return;
    }
    if (!cabin.trim()) {
      setErrorMsg("Cabin location is required.");
      setSubmitting(false);
      return;
    }

    let semestersString = 'All';
    if (!isAllSemesters) {
      if (selectedSemesters.length === 0) {
        setErrorMsg("Please select at least one semester for rotation or choose 'All Semesters'.");
        setSubmitting(false);
        return;
      }
      semestersString = selectedSemesters.sort().join(',');
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      department: department,
      designation: designation.trim(),
      cabin: cabin.trim(),
      phone: phone.trim() || null,
      semesters: semestersString
    };

    try {
      if (editingFaculty) {
        await api.put(`academic/faculty/${editingFaculty.id}/`, payload);
      } else {
        await api.post('academic/faculty/', payload);
      }
      fetchFaculty();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.email?.[0] || "Failed to save faculty details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this faculty member from the directory?")) {
      try {
        await api.delete(`academic/faculty/${id}/`);
        fetchFaculty();
      } catch (err) {
        console.error("Failed to delete faculty:", err);
      }
    }
  };

  // Filter faculty based on search, department, and semester rotation
  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (f.cabin && f.cabin.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = selectedDeptFilter === 'all' || f.department === selectedDeptFilter;
    
    let matchesSem = true;
    if (selectedSemFilter !== 'all') {
      const semVal = f.semesters || 'All';
      if (semVal.toLowerCase() !== 'all') {
        const activeSems = semVal.split(',').map(s => s.trim());
        matchesSem = activeSems.includes(selectedSemFilter);
      }
    }

    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <Users className="w-8 h-8 text-accent" />
            Faculty Management
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Edit designations, cabin locations, contact cards, and manage rotational semester assignments for each department.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Faculty Member
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-brand-text/50 dark:text-brand-text-dark/50 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, cabin..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-brand-text/50 dark:text-brand-text-dark/50 mb-1">
            Department Filter
          </label>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
          >
            {filterDepts.map(d => (
              <option key={d} value={d} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-brand-text/50 dark:text-brand-text-dark/50 mb-1">
            Semester Rotation Filter
          </label>
          <select
            value={selectedSemFilter}
            onChange={(e) => setSelectedSemFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
          >
            <option value="all" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">All Rotations (Any Semester)</option>
            {semesterOptions.map(sem => (
              <option key={sem} value={sem} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Active in Sem {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading faculty directory...</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50 border border-dashed border-brand-border/30 rounded-3xl">
          <Users className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No faculty members found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((fac) => {
            const initials = fac.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            return (
              <GlassContainer 
                key={fac.id} 
                className="p-5 flex flex-col justify-between border border-brand-border/20 rounded-3xl hover:scale-[1.01] transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-black text-sm flex-shrink-0">
                        {initials.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-brand-text dark:text-brand-text-dark leading-tight">
                          {fac.name}
                        </h3>
                        <span className="text-[10px] text-brand-text/45 font-bold uppercase tracking-wider block mt-0.5">
                          {fac.department} • {fac.designation}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(fac)}
                        className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-accent/10 hover:text-accent border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                        title="Edit details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fac.id)}
                        className="p-1.5 rounded-lg bg-brand-bg dark:bg-brand-border-dark/25 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent text-brand-text/60 dark:text-brand-text-dark/65 transition cursor-pointer"
                        title="Delete faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10 space-y-2.5 text-xs font-semibold text-brand-text/80 dark:text-brand-text-dark/85">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                      <span>Cabin Location: {fac.cabin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                      <a href={`mailto:${fac.email}`} className="text-accent hover:underline">{fac.email}</a>
                    </div>
                    {fac.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                        <span>Phone No: {fac.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-dashed border-brand-border/10">
                      <Calendar className="w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45 flex-shrink-0" />
                      <span>
                        Rotation Sems: {' '}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          (fac.semesters || 'All').toLowerCase() === 'all'
                            ? 'bg-secondary/15 text-accent border border-secondary/25 dark:text-brand-text-dark' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {fac.semesters || 'All'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </GlassContainer>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <h3 className="font-black text-brand-text dark:text-brand-text-dark text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                {editingFaculty ? 'Edit Faculty Details' : 'Add Faculty Member'}
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
                    Faculty Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Alan Turing"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. turing@freshverse.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Cabin Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={cabin}
                    onChange={(e) => setCabin(e.target.value)}
                    placeholder="e.g. RV-302, KS-205"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9999988888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              {/* Semester Rotations Selection */}
              <div className="pt-2 border-t border-brand-border/10 dark:border-brand-border-dark/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-text/70 dark:text-brand-text-dark/75">
                    Semester Assignment (sem) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="all_semesters"
                      checked={isAllSemesters}
                      onChange={(e) => setIsAllSemesters(e.target.checked)}
                      className="rounded border-brand-border/30 accent-accent cursor-pointer"
                    />
                    <label htmlFor="all_semesters" className="text-[11px] font-semibold text-brand-text/80 cursor-pointer">
                      All Semesters
                    </label>
                  </div>
                </div>

                {!isAllSemesters && (
                  <div className="grid grid-cols-4 gap-2 bg-brand-bg/30 p-2.5 rounded-xl border border-brand-border/20">
                    {semesterOptions.map(sem => (
                      <label key={sem} className="flex items-center gap-2 text-xs font-bold text-brand-text/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSemesters.includes(sem)}
                          onChange={() => handleSemesterCheckboxChange(sem)}
                          className="rounded border-brand-border/30 accent-accent cursor-pointer"
                        />
                        Sem {sem}
                      </label>
                    ))}
                  </div>
                )}
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
                  {submitting ? 'Saving...' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaculty;
