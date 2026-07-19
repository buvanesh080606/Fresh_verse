import React, { useState, useEffect, useRef } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { 
  Upload, FileSpreadsheet, Plus, Trash2, 
  Save, AlertCircle, CheckCircle2, RefreshCcw,
  HelpCircle, CalendarRange
} from 'lucide-react';

// Image compression helper to avoid HTTP 413 Payload Too Large on high-res mobile photos
const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile.size < file.size ? compressedFile : file);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const AdminParser = () => {
  const fileInputRef = useRef(null);
  
  // Session storage state initialization to prevent data loss on tab navigation
  const [gridData, setGridData] = useState(() => {
    const saved = sessionStorage.getItem('ocr_grid_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [documentType, setDocumentType] = useState(() => {
    const saved = sessionStorage.getItem('ocr_document_type');
    return saved || 'timetable';
  });
  const [message, setMessage] = useState(() => {
    const saved = sessionStorage.getItem('ocr_message');
    return saved ? JSON.parse(saved) : { text: '', type: '' };
  });

  // Target assignment inputs
  const [selectedDept, setSelectedDept] = useState(() => {
    return sessionStorage.getItem('ocr_selected_dept') || 'CSE(AI&ML)';
  });
  const [selectedSemester, setSelectedSemester] = useState(() => {
    return sessionStorage.getItem('ocr_selected_semester') || '1';
  });
  const [selectedSection, setSelectedSection] = useState(() => {
    return sessionStorage.getItem('ocr_selected_section') || 'A';
  });
  const [selectedBatch, setSelectedBatch] = useState(() => {
    return sessionStorage.getItem('ocr_selected_batch') || '2024-2028';
  });

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);

  // Active database timetables list
  const [activeSchedules, setActiveSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Sync to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem('ocr_grid_data', JSON.stringify(gridData));
  }, [gridData]);

  useEffect(() => {
    sessionStorage.setItem('ocr_document_type', documentType);
  }, [documentType]);

  useEffect(() => {
    sessionStorage.setItem('ocr_message', JSON.stringify(message));
  }, [message]);

  useEffect(() => {
    sessionStorage.setItem('ocr_selected_dept', selectedDept);
  }, [selectedDept]);

  useEffect(() => {
    sessionStorage.setItem('ocr_selected_semester', selectedSemester);
  }, [selectedSemester]);

  useEffect(() => {
    sessionStorage.setItem('ocr_selected_section', selectedSection);
  }, [selectedSection]);

  useEffect(() => {
    sessionStorage.setItem('ocr_selected_batch', selectedBatch);
  }, [selectedBatch]);

  // Fetch all existing timetables and group them by department/section/batch
  const fetchActiveSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const res = await api.get('academic/timetable/');
      
      const groups = {};
      res.data.forEach(slot => {
        const dept = slot.department || 'All';
        const sem = slot.semester || '1';
        const sect = slot.section || 'All';
        const batch = slot.batch || 'All';
        const key = `${dept} - Sem ${sem} - ${sect} - ${batch}`;
        
        if (!groups[key]) {
          groups[key] = {
            department: dept,
            semester: sem,
            section: sect,
            batch: batch,
            count: 0
          };
        }
        groups[key].count += 1;
      });
      
      setActiveSchedules(Object.values(groups));
    } catch (err) {
      console.error("Failed to load active timetables:", err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchActiveSchedules();
  }, []);

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Trigger parsing
  const handleParse = async () => {
    if (!file) {
      setMessage({ text: 'Please select a file to parse first.', type: 'error' });
      return;
    }

    setParsing(true);
    setMessage({ text: 'Compressing image for optimal upload...', type: '' });
    
    try {
      const fileToUpload = await compressImage(file);
      setMessage({ text: 'Uploading and parsing document...', type: '' });

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await api.post('ai/parse-document/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const parsedType = response.data.document_type || 'timetable';
      setDocumentType(parsedType);

      let data = response.data.extracted_data;
      if (!Array.isArray(data)) {
        data = [data];
      }
      if (parsedType === 'calendar') {
        data = data.map(item => ({
          event_date: item.event_date || '',
          description: item.description || '',
          event_type: item.event_type || 'academic_activity',
          day_order: item.day_order || '',
          department: item.department || '',
          section: item.section || ''
        }));
      }
      setGridData(data);
      setMessage({ text: `Document parsed successfully as "${parsedType}"! Review and edit the grid below.`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Document parsing failed.', type: 'error' });
    } finally {
      setParsing(false);
    }
  };

  // Grid Cell edit handler
  const handleCellChange = (rowIndex, key, value) => {
    const updated = [...gridData];
    updated[rowIndex][key] = value;
    setGridData(updated);
  };

  // Add row
  const addRow = () => {
    if (gridData.length === 0) {
      const template = {
        day_of_week: 'Monday',
        period_number: '1',
        start_time: '09:00:00',
        end_time: '09:50:00',
        subject_name: '',
        faculty_email: ''
      };
      setGridData([template]);
      return;
    }
    const template = { ...gridData[0] };
    Object.keys(template).forEach(k => {
      if (k !== 'id') template[k] = '';
    });
    setGridData([...gridData, template]);
  };

  // Delete row
  const removeRow = (idx) => {
    setGridData(gridData.filter((_, i) => i !== idx));
  };

  // Clear session state
  const handleClearAll = () => {
    sessionStorage.removeItem('ocr_grid_data');
    sessionStorage.removeItem('ocr_document_type');
    sessionStorage.removeItem('ocr_message');
    setGridData([]);
    setFile(null);
    setMessage({ text: '', type: '' });
  };

  // Save to Database
  const handleSaveToDB = async () => {
    setMessage({ text: '', type: '' });
    try {
      if (documentType === 'timetable') {
        // Enrich rows with selected department, semester, section, and batch before committing
        const enrichedGrid = gridData.map(row => ({
          ...row,
          department: selectedDept,
          semester: selectedSemester,
          section: selectedSection,
          batch: selectedBatch
        }));

        const response = await api.post('academic/timetable/bulk-save/', enrichedGrid);
        setMessage({ text: response.data.message || 'Timetable saved successfully!', type: 'success' });
        fetchActiveSchedules();
      } else if (documentType === 'faculty') {
        const promises = gridData.map(fac => api.post('academic/faculty/', fac));
        await Promise.all(promises);
        setMessage({ text: `Successfully saved ${gridData.length} faculty entries.`, type: 'success' });
      } else if (documentType === 'calendar') {
        const enrichedGrid = gridData.map(row => ({
          ...row,
          day_order: row.day_order || null,
          department: row.department || selectedDept,
          section: row.section || selectedSection
        }));
        const promises = enrichedGrid.map(cal => api.post('core/calendar/', cal));
        await Promise.all(promises);
        setMessage({ text: `Successfully saved ${gridData.length} academic calendar events.`, type: 'success' });
      } else if (documentType === 'event') {
        await api.post('events/events/', gridData[0]);
        setMessage({ text: 'Campus Event published successfully!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'Failed to save parsed data to DB.';
      if (err.response?.data) {
        if (err.response.data.errors) {
          errMsg = `Validation failed: ${err.response.data.errors.map(e => `Row ${e.index + 1}: ${JSON.stringify(e.errors)}`).join('; ')}`;
        } else if (typeof err.response.data === 'object') {
          errMsg = JSON.stringify(err.response.data);
        } else {
          errMsg = err.response.data;
        }
      }
      setMessage({ text: errMsg, type: 'error' });
    }
  };

  // Clear specific timetable
  const handleClearTimetable = async (dept, sem, sect, batch) => {
    if (window.confirm(`Are you sure you want to completely remove the timetable for ${dept} (Sem: ${sem}, Section: ${sect}, Batch: ${batch})? This action is permanent.`)) {
      try {
        await api.delete('academic/timetable/clear/', {
          params: {
            department: dept,
            semester: sem,
            section: sect,
            batch: batch
          }
        });
        setMessage({ text: `Successfully deleted timetable slots for ${dept} Sem ${sem} Section ${sect}.`, type: 'success' });
        fetchActiveSchedules();
      } catch (err) {
        console.error("Failed to delete timetable:", err);
        setMessage({ text: 'Failed to clear timetable records.', type: 'error' });
      }
    }
  };

  // Column Headers mapping helper
  const getColumnHeaders = () => {
    if (gridData.length === 0) return [];
    if (documentType === 'calendar') {
      return Object.keys(gridData[0]).filter(k => k !== 'id');
    }
    return Object.keys(gridData[0]).filter(k => k !== 'id' && k !== 'department' && k !== 'section' && k !== 'batch');
  };

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark flex items-center gap-2.5">
            <FileSpreadsheet className="w-8 h-8 text-accent animate-bounce-slow" />
            Timetable Management & Parser
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Upload PDF/image class timetables to extract data, manage active schedules, and clear/delete timetables by department.
          </p>
        </div>
        {gridData.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 hover:bg-red-500/5 text-red-500 text-xs font-bold transition cursor-pointer"
          >
            Clear Upload
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-[#4E220F]/10 border-[#4E220F]/25 text-[#4E220F] dark:bg-[#E6CCB2]/10 dark:border-[#E6CCB2]/25 dark:text-[#E6CCB2]' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
          {message.text}
        </div>
      )}

      {/* Grid: Upload Zone (Left) & Active Timetables list (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Container */}
        <div className="lg:col-span-2 space-y-6">
          <GlassContainer className="p-8 text-center border-2 border-dashed border-brand-border/40 dark:border-brand-border-dark/30 hover:border-accent/40 transition-colors">
            <Upload className="w-12 h-12 mx-auto text-accent mb-4 opacity-75" />
            
            <h3 className="font-extrabold text-brand-text dark:text-brand-text-dark text-base mb-1">
              Upload Timetables, Staff Lists, or Circulars
            </h3>
            <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 max-w-sm mx-auto mb-6">
              Supports Image uploads (PNG, JPEG), Excel, Word, or PDF documents.
            </p>

            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-3 md:py-2.5 rounded-xl border border-brand-border dark:border-brand-border-dark/45 text-xs font-bold text-brand-text dark:text-brand-text-dark hover:bg-brand-border/20 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                {file ? file.name : 'Select File from Computer / Device'}
              </button>

              {file && (
                <button
                  onClick={handleParse}
                  disabled={parsing}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/95 text-white font-bold text-xs shadow-md shadow-accent/20 transition-all cursor-pointer"
                >
                  {parsing ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" /> Processing OCR...
                    </>
                  ) : (
                    <>
                      Parse Document with Gemini AI
                    </>
                  )}
                </button>
              )}
            </div>
          </GlassContainer>
        </div>

        {/* Active Timetables Management Side Panel */}
        <div className="lg:col-span-1">
          <GlassContainer className="p-5 space-y-4 border border-brand-border/10 dark:border-brand-border-dark/15 h-full">
            <div>
              <h3 className="text-sm font-black text-brand-text dark:text-brand-text-dark flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-accent" />
                Active College Timetables
              </h3>
              <p className="text-[10px] text-brand-text/50 dark:text-brand-text-dark/50 mt-0.5">
                Lists all departments with saved timetables in the system. Use "Delete" to overwrite or wipe records.
              </p>
            </div>

            {loadingSchedules ? (
              <div className="py-10 text-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] text-brand-text/45 mt-2">Loading active schedules...</p>
              </div>
            ) : activeSchedules.length === 0 ? (
              <div className="py-10 text-center text-brand-text/40 dark:text-brand-text-dark/45 border border-dashed border-brand-border/20 rounded-2xl">
                <HelpCircle className="w-8 h-8 mx-auto opacity-35 mb-2" />
                <p className="text-xs font-semibold">No timetable files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {activeSchedules.map((sched, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl border border-brand-border/20 dark:border-brand-border-dark/25 bg-brand-bg/30 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-brand-text dark:text-brand-text-dark">
                        {sched.department}
                      </p>
                      <p className="text-[9px] text-brand-text/50 dark:text-brand-text-dark/50 mt-0.5">
                        Sem: <span className="font-semibold">{sched.semester}</span> | Sec: <span className="font-semibold">{sched.section}</span> | Batch: <span className="font-semibold">{sched.batch}</span>
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-black text-accent bg-secondary/15 border border-secondary/25 dark:text-brand-text-dark px-1.5 py-0.5 rounded">
                        {sched.count} periods
                      </span>
                    </div>
                    <button
                      onClick={() => handleClearTimetable(sched.department, sched.semester, sched.section, sched.batch)}
                      className="p-3 md:p-1.5 rounded-xl md:rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                      title="Clear this schedule completely"
                    >
                      <Trash2 className="w-5 h-5 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassContainer>
        </div>

      </div>

      {/* Spreadsheet Edit Grid */}
      {gridData.length > 0 && (
        <GlassContainer className="space-y-4">
          
          {/* Target Assignment selector details (Show only for Timetable documents) */}
          {(documentType === 'timetable' || documentType === 'calendar') && (
            <div className="bg-brand-bg/50 border border-brand-border/20 dark:border-brand-border-dark/20 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text/60 dark:text-brand-text-dark/65 uppercase tracking-wider mb-1">Target Department *</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark outline-none"
                >
                  <option value="CSE(AI&ML)">CSE (AI &amp; ML)</option>
                  <option value="CSE">Computer Science &amp; Engineering (CSE)</option>
                  <option value="ECE">Electronics &amp; Communication (ECE)</option>
                  <option value="EEE">Electrical &amp; Electronics (EEE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                  <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  <option value="IT">Information Technology (IT)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text/60 dark:text-brand-text-dark/65 uppercase tracking-wider mb-1">Target Semester *</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark outline-none"
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text/60 dark:text-brand-text-dark/65 uppercase tracking-wider mb-1">Target Section *</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark outline-none"
                >
                  <option value="All">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text/60 dark:text-brand-text-dark/65 uppercase tracking-wider mb-1">{documentType === 'timetable' ? 'Target Batch Year *' : 'Target Batch Year (Optional)'}</label>
                <input
                  type="text"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  placeholder="e.g. 2024-2028"
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white dark:bg-brand-card-dark text-xs text-brand-text dark:text-brand-text-dark outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/20 dark:border-brand-border-dark/25 pb-3">
            <div>
              <h3 className="text-lg font-bold text-brand-text dark:text-brand-text-dark">
                Extracted Data Spreadsheet
              </h3>
              <p className="text-xs text-brand-text/50 dark:text-brand-text-dark/50 mt-0.5">
                Review, modify, or add items before committing to database. Type: <span className="font-bold text-accent uppercase">{documentType}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-border dark:border-brand-border-dark/45 text-xs font-bold text-brand-text dark:text-brand-text-dark hover:bg-brand-border/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
              <button
                onClick={handleSaveToDB}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/20 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Commit to Database
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-brand-border/20 dark:border-brand-border-dark/25">
                  {getColumnHeaders().map((head) => (
                    <th key={head} className="py-2.5 px-3 text-xs font-black uppercase text-brand-text/60 dark:text-brand-text-dark/60">
                      {head.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-brand-border-dark/10">
                {gridData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-brand-border/5">
                    {getColumnHeaders().map((col) => (
                      <td key={col} className="py-2 px-1">
                        <input
                          type="text"
                          value={row[col] === null ? '' : row[col]}
                          onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-brand-border dark:hover:border-brand-border-dark/30 focus:border-accent focus:bg-white bg-transparent text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => removeRow(rIdx)}
                        className="p-3 md:p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl md:rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 mx-auto"
                      >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassContainer>
      )}
    </div>
  );
};

export default AdminParser;
