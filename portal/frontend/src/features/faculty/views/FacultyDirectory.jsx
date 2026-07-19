import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Users, Mail, Phone, MapPin, Search, Calendar } from 'lucide-react';

const FacultyDirectory = () => {
  const { profile } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default to student's department if there's a match, otherwise 'all'
  const [selectedDept, setSelectedDept] = useState('all');
  
  // Default to student's current semester if available, otherwise 'all'
  const [selectedSem, setSelectedSem] = useState(profile?.semester || 'all');

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await api.get('academic/faculty/');
        setFaculty(response.data);
      } catch (err) {
        console.error("Error loading faculty directory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  // Update selectedDept and selectedSem if profile loads later
  useEffect(() => {
    if (profile?.semester) {
      setSelectedSem(profile.semester);
    }
  }, [profile]);

  const departments = ['all', ...new Set(faculty.map(f => f.department).filter(Boolean))];

  const filteredFaculty = faculty.filter(
    (f) => {
      // Department Filter (including AIML/CSE department aliases matching student side)
      let matchesDept = selectedDept === 'all';
      if (selectedDept !== 'all') {
        const d1 = selectedDept.toLowerCase().replace(/[^a-z]/g, '');
        const d2 = f.department.toLowerCase().replace(/[^a-z]/g, '');
        
        // Handle CSE(AIML) and AIML department equivalence
        const isAiml1 = d1.includes('aiml') || d1.includes('ai');
        const isAiml2 = d2.includes('aiml') || d2.includes('ai');
        
        if (isAiml1 && isAiml2) {
          matchesDept = true;
        } else {
          matchesDept = f.department === selectedDept;
        }
      }

      // Semester Rotation Filter
      let matchesSem = true;
      if (selectedSem !== 'all') {
        const semVal = f.semesters || 'All';
        if (semVal.toLowerCase() !== 'all') {
          const activeSems = semVal.split(',').map(s => s.trim());
          matchesSem = activeSems.includes(selectedSem);
        }
      }

      // Search Query Filter
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.cabin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.designation.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDept && matchesSem && matchesSearch;
    }
  );

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
            Faculty Directory
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Search cabin locations, contact details, and rotational semester assignments.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/45" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty name, cabin..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
            />
          </div>

          {/* Department filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          {/* Semester rotation filter */}
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring cursor-pointer"
          >
            <option value="all" className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">All Rotations (Any Semester)</option>
            {profile?.semester && (
              <option value={profile.semester} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">My Current Sem (Sem {profile.semester})</option>
            )}
            {['1', '2', '3', '4', '5', '6', '7', '8'].map(sem => (
              sem !== profile?.semester && (
                <option key={sem} value={sem} className="bg-brand-card dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark">Semester {sem}</option>
              )
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading faculty directory...</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Users className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No faculty members matched your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((fac) => {
            const initials = fac.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            return (
              <GlassContainer 
                key={fac.id} 
                className="flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 p-5 rounded-3xl bg-[#FDF8F5] dark:bg-[#2A1A12] text-[#4E220F] dark:text-[#E6CCB2] border border-brand-border/40 shadow-lg"
              >
                <div className="flex gap-4 items-start w-full">
                  {/* Initials Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-[#4E220F]/10 dark:bg-white/10 border border-[#4E220F]/20 dark:border-white/20 text-[#4E220F] dark:text-[#E6CCB2] font-black flex items-center justify-center text-sm flex-shrink-0">
                    {initials.toUpperCase()}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      <h3 className="font-extrabold text-[#4E220F] dark:text-white text-base truncate leading-snug">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-[#6F4E37] dark:text-[#D4A373] truncate mt-0.5 font-semibold">
                        {fac.designation} • {fac.department}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4E220F]/90 dark:text-[#E6CCB2] pt-2 border-t border-brand-border/10 dark:border-white/10">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#6F4E37] dark:text-[#D4A373] flex-shrink-0" />
                        <span className="truncate font-semibold text-[#4E220F] dark:text-[#E6CCB2]">Cabin: {fac.cabin}</span>
                      </span>
                      <a 
                        href={`mailto:${fac.email}`}
                        className="flex items-center gap-2 text-left hover:text-[#6F4E37] dark:hover:text-[#F5EBE0] transition-colors duration-150 bg-transparent border-0 p-0 text-xs text-[#4E220F]/90 dark:text-[#E6CCB2] cursor-pointer font-medium"
                      >
                        <Mail className="w-4 h-4 text-[#6F4E37] dark:text-[#D4A373] flex-shrink-0" />
                        <span className="truncate">{fac.email}</span>
                      </a>
                      {fac.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#6F4E37] dark:text-[#D4A373] flex-shrink-0" />
                          <span className="text-[#4E220F]/90 dark:text-[#E6CCB2]">{fac.phone}</span>
                        </span>
                      )}

                      {/* Semester Rotation Badge */}
                      <div className="flex items-center gap-2 pt-2 border-t border-dashed border-brand-border/10 dark:border-white/10">
                        <Calendar className="w-4 h-4 text-[#6F4E37] dark:text-[#D4A373] flex-shrink-0" />
                        <span className="text-[10px] font-bold text-[#4E220F]/80 dark:text-[#E6CCB2]/80">
                          Rotation: {' '}
                          <span className="px-1.5 py-0.5 rounded font-black bg-[#4E220F]/10 dark:bg-white/15 text-[#4E220F] dark:text-[#E6CCB2] border border-[#4E220F]/20 dark:border-white/20">
                            {fac.semesters || 'All'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reach buttons at the bottom - Styled as dark brown and appealing green */}
                <div className="flex gap-2.5 mt-4 pt-3 border-t border-brand-border/10 dark:border-white/10 w-full">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${fac.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-[#4E220F] hover:bg-[#3F2C22] text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#4E220F]/20 cursor-pointer border-0 text-center"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                  <a
                    href={fac.phone ? `https://wa.me/${fac.phone.replace(/[^0-9]/g, '')}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!fac.phone) {
                        e.preventDefault();
                        alert("No phone number registered for WhatsApp for this faculty.");
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border-0 text-center ${
                      fac.phone 
                        ? 'bg-[#128C7E] hover:bg-[#075E54] shadow-[#128C7E]/10' 
                        : 'bg-brand-border/20 text-brand-text/40 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              </GlassContainer>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FacultyDirectory;
