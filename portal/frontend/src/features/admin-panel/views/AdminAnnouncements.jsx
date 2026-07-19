import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Megaphone, Plus, Trash2, Tag, Calendar } from 'lucide-react';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [targetSection, setTargetSection] = useState('All');
  const [message, setMessage] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('events/announcements/');
      setAnnouncements(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setMessage('');

    const payload = { 
      title, 
      content, 
      category,
      target_department: targetDepartment,
      target_section: targetSection
    };
    try {
      await api.post('events/announcements/', payload);
      setMessage('Circular broadcasted and pushed to student notifications successfully!');
      fetchAnnouncements();
      // Reset form
      setTitle('');
      setContent('');
      setCategory('general');
      setTargetDepartment('All');
      setTargetSection('All');
    } catch (err) {
      setMessage('Failed to broadcast. Review input content.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this circular?")) return;
    try {
      await api.delete(`events/announcements/${id}/`);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
          Broadcast Campus Circulars
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
          Publish news, academic changes, exam schedules, or placement circulars directly to student feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Broadcast Form */}
        <div>
          <GlassContainer className="space-y-4">
            <h3 className="text-base font-bold text-brand-text dark:text-brand-text-dark border-b border-brand-border/20 pb-2 flex items-center gap-1.5">
              <Megaphone className="w-5 h-5 text-accent" /> Publish Circular
            </h3>

            {message && (
              <div className="p-3 bg-accent/10 border border-accent/25 text-accent text-xs font-semibold rounded-xl">
                {message}
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Circular Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. commencement of semester exams"
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                >
                  <option value="academic">Academic Activity</option>
                  <option value="exam">Examinations & Rules</option>
                  <option value="placement">Placement Cell Circular</option>
                  <option value="general">General Campus News</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">
                    Target Department
                  </label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  >
                    <option value="All">All Departments</option>
                    <option value="CSE(AI&ML)">CSE (AI &amp; ML)</option>
                    <option value="CSE">Computer Science &amp; Eng.</option>
                    <option value="ECE">Electronics &amp; Comm.</option>
                    <option value="EEE">Electrical &amp; Electronics</option>
                    <option value="MECH">Mechanical Eng.</option>
                    <option value="CIVIL">Civil Eng.</option>
                    <option value="IT">Information Tech.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Target Section</label>
                  <input
                    type="text"
                    required
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="e.g. A, B, or All"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-text/85 dark:text-brand-text-dark/85 mb-1">Circular Content</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type the announcement details..."
                  rows="4"
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/30 bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/95 text-white font-bold text-xs shadow-md shadow-accent/20 cursor-pointer"
              >
                Broadcast Circular
              </button>
            </form>
          </GlassContainer>
        </div>

        {/* Right Columns: Circulars List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-brand-text dark:text-brand-text-dark">Broadcast History</h3>

          {loading ? (
            <p className="text-sm text-brand-text/50">Fetching circular history...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-brand-text/50">No announcements broadcasted yet.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <GlassContainer key={ann.id} className="relative py-4 px-5 space-y-2">
                  <div className="flex items-center justify-between border-b border-brand-border/10 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                        ann.category === 'academic' ? 'bg-blue-500/10 text-blue-500' :
                        ann.category === 'exam' ? 'bg-rose-500/10 text-rose-500' :
                        ann.category === 'placement' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-brand-text/45 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        Target: {ann.target_department} (Sec: {ann.target_section})
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-brand-text dark:text-brand-text-dark text-base leading-snug">{ann.title}</h4>
                  <p className="text-xs text-brand-text/75 dark:text-brand-text-dark/80 whitespace-pre-line leading-relaxed">{ann.content}</p>
                </GlassContainer>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminAnnouncements;
