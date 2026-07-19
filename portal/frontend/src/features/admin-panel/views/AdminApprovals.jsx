import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Users, Check, X, ShieldAlert, ShieldCheck, UserMinus, Search, RefreshCw, Crown
} from 'lucide-react';

const AdminApprovals = () => {
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('auth/admin/users/');
      setStudents(res.data.students || []);
      setAdmins(res.data.admins || []);
      setIsSuperadmin(res.data.is_superadmin || false);
    } catch (err) {
      console.error("Failed to load users for approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    setProcessingId(userId);
    try {
      await api.post(`auth/admin/users/${userId}/approve/`);
      // Update local state instead of full reload for snappy feedback
      setStudents(prev => prev.map(u => u.id === userId ? { ...u, is_approved: !u.is_approved } : u));
      setAdmins(prev => prev.map(u => u.id === userId ? { ...u, is_approved_admin: !u.is_approved_admin } : u));
    } catch (err) {
      console.error("Failed to toggle user approval status:", err);
      alert(err.response?.data?.error || "Failed to update approval status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClick = (userId) => {
    if (confirmDeleteId === userId) {
      performDelete(userId);
    } else {
      setConfirmDeleteId(userId);
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === userId ? null : prev);
      }, 4000);
    }
  };

  const performDelete = async (userId) => {
    setProcessingId(userId);
    try {
      await api.delete(`auth/admin/users/${userId}/delete/`);
      setStudents(prev => prev.filter(u => u.id !== userId));
      setAdmins(prev => prev.filter(u => u.id !== userId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete user account:", err);
      alert(err.response?.data?.error || "Failed to delete user account.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    const role = activeTab === 'students' ? 'student' : 'admin';
    const roleName = role === 'student' ? 'students' : 'administrators';
    if (window.confirm(`Are you sure you want to approve all registered ${roleName}?`)) {
      setLoading(true);
      try {
        await api.post('auth/admin/users/approve-all/', { role });
        await fetchUsers();
      } catch (err) {
        console.error("Failed to approve all users:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleSuperadmin = async (userId) => {
    setProcessingId(userId);
    try {
      const res = await api.post(`auth/admin/users/${userId}/toggle-superadmin/`);
      setAdmins(prev => prev.map(u => u.id === userId ? { ...u, ...res.data.user } : u));
    } catch (err) {
      console.error("Failed to toggle superadmin status:", err);
      alert(err.response?.data?.error || "Operation failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter lists based on search term
  const filteredStudents = students.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(a => 
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#4E220F] dark:text-[#E6CCB2] flex items-center gap-2.5">
            <Users className="w-8 h-8 text-accent" />
            Access Controls & Approvals
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Approve or revoke login access for registered students and administrators to secure your portal.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/50 hover:bg-brand-border/10 text-brand-text dark:text-brand-text-dark text-xs font-bold transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
        </button>
      </div>

      {/* Tabs, Search Row, and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {isSuperadmin && (
            <div className="flex gap-1.5 p-1 bg-brand-bg/25 border border-brand-border/20 rounded-2xl">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-5 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-brand-text/60 dark:text-brand-text-dark/65 hover:text-brand-text dark:hover:text-brand-text-dark'
                }`}
              >
                Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-5 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-accent text-white shadow-md'
                    : 'text-brand-text/60 dark:text-brand-text-dark/65 hover:text-brand-text dark:hover:text-brand-text-dark'
                }`}
              >
                Administrators ({admins.length})
              </button>
            </div>
          )}

          {/* Approve All Button */}
          {((activeTab === 'students' && students.some(s => !s.is_approved)) ||
            (activeTab === 'admins' && admins.some(a => !a.is_approved_admin))) && (
            <button
              onClick={handleApproveAll}
              className="px-4 py-2.5 rounded-xl bg-[#4E220F] hover:bg-[#3F2C22] text-white text-xs font-black transition cursor-pointer shadow-md shadow-[#4E220F]/20 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Approve All Eligible {activeTab === 'students' ? 'Students' : 'Admins'}
            </button>
          )}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/45" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
          />
        </div>
      </div>

      {/* User Lists (Ordered Lists) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading directory...</p>
        </div>
      ) : activeTab === 'students' ? (
        filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50 border border-dashed border-brand-border/30 rounded-3xl">
            <Users className="w-12 h-12 mx-auto opacity-35 mb-2" />
            <p className="font-semibold text-sm">No registered student accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-brand-border/30 dark:border-brand-border-dark/30 bg-white/70 dark:bg-brand-card-dark/60 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/20 dark:border-brand-border-dark/20 text-[10px] uppercase font-black text-brand-text/50 dark:text-brand-text-dark/50 tracking-wider">
                  <th className="py-4 px-5 w-12 text-center">#</th>
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Email Address</th>
                  <th className="py-4 px-5">Registered Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-brand-border-dark/10 text-xs">
                {filteredStudents.map((s, index) => {
                  const nameLabel = s.first_name || s.last_name 
                    ? `${s.first_name || ''} ${s.last_name || ''}`.trim()
                    : 'Not Onboarded Yet';
                  return (
                    <tr key={s.id} className="hover:bg-brand-border/5 dark:hover:bg-brand-border-dark/5 transition-colors">
                      <td className="py-4 px-5 text-center font-bold text-brand-text/50 dark:text-brand-text-dark/50">
                        {index + 1}
                      </td>
                      <td className="py-4 px-5 font-bold text-brand-text dark:text-brand-text-dark">
                        {nameLabel}
                      </td>
                      <td className="py-4 px-5 text-brand-text/75 dark:text-brand-text-dark/75 font-medium">
                        {s.email}
                      </td>
                      <td className="py-4 px-5 text-brand-text/60 dark:text-brand-text-dark/60 font-semibold">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                          s.is_approved 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {s.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(s.id)}
                            disabled={processingId === s.id}
                            className={`py-1.5 px-3.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all border ${
                              s.is_approved
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                            }`}
                          >
                            {s.is_approved ? (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" /> Revoke
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" /> Approve
                              </>
                            )}
                          </button>

                          {confirmDeleteId === s.id ? (
                            <button
                              onClick={() => handleDeleteClick(s.id)}
                              disabled={processingId === s.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer transition-all border border-transparent animate-pulse"
                              title="Click again to confirm deletion"
                            >
                              Confirm?
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteClick(s.id)}
                              disabled={processingId === s.id}
                              className="p-1.5 rounded-xl border border-brand-border/40 hover:bg-rose-500/10 hover:text-rose-500 text-brand-text/60 dark:text-brand-text-dark/60 cursor-pointer transition-all"
                              title="Delete student account"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filteredAdmins.length === 0 ? (
          <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50 border border-dashed border-brand-border/30 rounded-3xl">
            <Users className="w-12 h-12 mx-auto opacity-35 mb-2" />
            <p className="font-semibold text-sm">No secondary admin accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-brand-border/30 dark:border-brand-border-dark/30 bg-white/70 dark:bg-brand-card-dark/60 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/20 dark:border-brand-border-dark/20 text-[10px] uppercase font-black text-brand-text/50 dark:text-brand-text-dark/50 tracking-wider">
                  <th className="py-4 px-5 w-12 text-center">#</th>
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Email Address</th>
                  <th className="py-4 px-5">Registered Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-brand-border-dark/10 text-xs">
                {filteredAdmins.map((a, index) => {
                  const nameLabel = a.first_name || a.last_name 
                    ? `${a.first_name || ''} ${a.last_name || ''}`.trim()
                    : 'Not Onboarded Yet';
                  return (
                    <tr key={a.id} className="hover:bg-brand-border/5 dark:hover:bg-brand-border-dark/5 transition-colors">
                      <td className="py-4 px-5 text-center font-bold text-brand-text/50 dark:text-brand-text-dark/50">
                        {index + 1}
                      </td>
                      <td className="py-4 px-5 font-bold text-brand-text dark:text-brand-text-dark">
                        {nameLabel}
                      </td>
                      <td className="py-4 px-5 text-brand-text/75 dark:text-brand-text-dark/75 font-medium">
                        {a.email}
                      </td>
                      <td className="py-4 px-5 text-brand-text/60 dark:text-brand-text-dark/60 font-semibold">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border w-max ${
                            a.is_approved_admin 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {a.is_approved_admin ? 'Access Granted' : 'Access Restricted'}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border w-max flex items-center gap-1 mt-0.5 ${
                            a.is_superadmin
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
                          }`}>
                            {a.is_superadmin ? (
                              <>
                                <Crown className="w-2.5 h-2.5 text-purple-500" /> Superadmin
                              </>
                            ) : (
                              'Normal Admin'
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2 justify-end items-center">
                          {isSuperadmin && a.email !== 'vsbuvaneshraj06@gmail.com' && (
                            <button
                              onClick={() => handleToggleSuperadmin(a.id)}
                              disabled={processingId === a.id}
                              className={`py-1.5 px-3 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                                a.is_superadmin
                                  ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-500/20'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent'
                              }`}
                            >
                              {a.is_superadmin ? (
                                <>
                                  Demote Admin
                                </>
                              ) : (
                                <>
                                  <Crown className="w-3 h-3" /> Make Superadmin
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleApprove(a.id)}
                            disabled={processingId === a.id || a.email === 'vsbuvaneshraj06@gmail.com'}
                            className={`py-1.5 px-3.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all border ${
                              a.is_approved_admin
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                            }`}
                          >
                            {a.is_approved_admin ? (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" /> Restrict
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" /> Approve
                              </>
                            )}
                          </button>

                          {confirmDeleteId === a.id ? (
                            <button
                              onClick={() => handleDeleteClick(a.id)}
                              disabled={processingId === a.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer transition-all border border-transparent animate-pulse"
                              title="Click again to confirm deletion"
                            >
                              Confirm?
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteClick(a.id)}
                              disabled={processingId === a.id || a.email === 'vsbuvaneshraj06@gmail.com'}
                              className="p-1.5 rounded-xl border border-brand-border/40 hover:bg-rose-500/10 hover:text-rose-500 text-brand-text/60 dark:text-brand-text-dark/60 cursor-pointer transition-all"
                              title="Delete admin account"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default AdminApprovals;
