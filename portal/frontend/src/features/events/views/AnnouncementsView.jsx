import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Megaphone, Search, Calendar, Tag, ChevronRight, X } from 'lucide-react';

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState(null);
  
  // Filtering & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('events/announcements/');
      setAnnouncements(response.data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedAnn(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = [
    { value: 'all', label: 'All Announcements' },
    { value: 'academic', label: 'Academic' },
    { value: 'exam', label: 'Examinations' },
    { value: 'placement', label: 'Placement' },
    { value: 'general', label: 'General' },
  ];

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesCategory = selectedCategory === 'all' || ann.category === selectedCategory;
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
          <Megaphone className="w-8 h-8 text-accent animate-pulse" />
          Campus Circulars &amp; Notices
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Stay up to date with official college circulars, exams, placement postings, and general news.
        </p>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'bg-white dark:bg-brand-card-dark text-brand-text dark:text-brand-text-dark/80 hover:bg-brand-bg/50 dark:hover:bg-brand-border-dark/20 border border-brand-border/10 dark:border-brand-border-dark/25'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-text/40 dark:text-brand-text-dark/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Retrieving campus board...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Megaphone className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No circulars match your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map((ann) => (
            <GlassContainer
              key={ann.id}
              onClick={() => setSelectedAnn(ann)}
              className="p-5 flex flex-col justify-between hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg border border-brand-border/20 dark:border-brand-border-dark/15 transition-all duration-250 cursor-pointer text-left group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-2.5">
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md ${
                    ann.category === 'academic' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/15' :
                    ann.category === 'exam' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15' :
                    ann.category === 'placement' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
                    'bg-purple-500/10 text-purple-500 border border-purple-500/15'
                  }`}>
                    {ann.category}
                  </span>
                  <span className="text-[10px] text-brand-text/45 dark:text-brand-text-dark/45 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-brand-text dark:text-brand-text-dark text-base leading-snug group-hover:text-accent transition-colors duration-150">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/80 line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex items-center justify-between text-[10px] text-accent font-bold">
                <span className="text-brand-text/45 dark:text-brand-text-dark/45 font-medium">
                  Target: {ann.target_department} (Sec: {ann.target_section})
                </span>
                <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Read Full Notice <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </GlassContainer>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedAnn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedAnn(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl border border-brand-border/20 dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark p-6 space-y-4 text-left animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-brand-border-dark/10 pb-3">
              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                selectedAnn.category === 'academic' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                selectedAnn.category === 'exam' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                selectedAnn.category === 'placement' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                'bg-purple-500/10 text-purple-500 border border-purple-500/20'
              }`}>
                {selectedAnn.category} Circular
              </span>
              <span className="text-[10px] text-brand-text/45 dark:text-brand-text-dark/45 font-medium">
                {new Date(selectedAnn.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-brand-text dark:text-brand-text-dark leading-snug">
                {selectedAnn.title}
              </h3>
              <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/85 whitespace-pre-line leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
                {selectedAnn.content}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-border/10 dark:border-brand-border-dark/10 flex items-center justify-between">
              <span className="text-[9px] text-brand-text/40 dark:text-brand-text-dark/45">
                Target: {selectedAnn.target_department} (Sec: {selectedAnn.target_section})
              </span>
              <button
                onClick={() => setSelectedAnn(null)}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-accent/20"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;
