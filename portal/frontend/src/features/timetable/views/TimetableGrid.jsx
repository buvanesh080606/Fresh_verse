import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Clock, User, CalendarDays, BookOpen, Coffee, Utensils, FlaskConical } from 'lucide-react';

const DAY_ORDER_LABELS = ['I', 'II', 'III', 'IV', 'V'];
const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

const SLOT_CONFIG = {
  class:  { bg: 'bg-accent/12 dark:bg-accent/25 border-accent/25 hover:border-accent/40', badge: 'bg-accent text-white' },
  lab:    { bg: 'bg-blue-500/15 dark:bg-blue-500/25 border-blue-400/35 hover:border-blue-400/60', badge: 'bg-blue-600 text-white' },
  break:  { bg: 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-400/35 hover:border-amber-400/60', badge: 'bg-amber-500 text-white' },
  lunch:  { bg: 'bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-400/35 hover:border-emerald-400/60', badge: 'bg-emerald-600 text-white' },
};

const TimetableGrid = () => {
  const [schedule, setSchedule]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        const response = await api.get('academic/timetable/weekly/');
        setSchedule(response.data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Failed to load timetable. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchWeekly();
  }, []);

  // --- Determine which day system is in use ---
  const usesDayOrder = schedule.some(s => s.day_order);
  const rowKeys = usesDayOrder
    ? DAY_ORDER_LABELS.filter(d => schedule.some(s => s.day_order === d))
    : ['Monday','Tuesday','Wednesday','Thursday','Friday'].filter(d => schedule.some(s => s.day_of_week === d));

  // Determine max period (excluding breaks which use period_number = 0)
  const maxPeriod = schedule.filter(s => s.period_number > 0).length > 0
    ? Math.max(...schedule.filter(s => s.period_number > 0).map(s => s.period_number))
    : 8;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  // Slot getter
  const getSlot = (rowKey, periodNum) => {
    if (usesDayOrder) return schedule.find(s => s.day_order === rowKey && s.period_number === periodNum);
    return schedule.find(s => s.day_of_week === rowKey && s.period_number === periodNum);
  };

  // Break/Lunch getter for a row (period_number === 0 slots)
  const getBreaks = (rowKey) => {
    if (usesDayOrder) return schedule.filter(s => s.day_order === rowKey && s.period_number === 0);
    return schedule.filter(s => s.day_of_week === rowKey && s.period_number === 0);
  };

  // Get representative period time label from any row
  const getPeriodTime = (periodNum) => {
    const slot = schedule.find(s => s.period_number === periodNum && s.period_number > 0);
    if (!slot) return null;
    return `${slot.start_time.substring(0,5)}–${slot.end_time.substring(0,5)}`;
  };

  // Collect all breaks globally (deduplicated by start_time) for column headers.
  // Scan ALL rows — not just the first — so missing breaks in Day I don't hide all break columns.
  const allBreaks = [];
  rowKeys.forEach(rowKey => {
    getBreaks(rowKey).forEach(b => {
      if (!allBreaks.find(x => x.start_time === b.start_time)) {
        allBreaks.push(b);
      }
    });
  });

  const SlotCard = ({ slot }) => {
    if (!slot) return (
      <div className="h-full min-h-14 border border-dashed border-brand-border/15 rounded-xl flex items-center justify-center text-[9px] text-brand-text/20 font-medium">
        —
      </div>
    );

    const cfg = SLOT_CONFIG[slot.slot_type] || SLOT_CONFIG.class;
    const isBreakOrLunch = slot.slot_type === 'break' || slot.slot_type === 'lunch';

    return (
      <div className={`p-2.5 rounded-xl border transition-all duration-150 text-left space-y-1 shadow-sm hover:shadow-md hover:scale-[1.01] cursor-default ${cfg.bg}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md leading-tight ${cfg.badge}`}>
            {slot.slot_type === 'break' ? '☕ Break' :
             slot.slot_type === 'lunch' ? '🍽 Lunch' :
             slot.slot_type === 'lab'   ? '🔬 Lab' :
             `P${slot.period_number}`}
          </span>
        </div>

        {slot.subject_code && slot.subject_code !== 'BREAK' && slot.subject_code !== 'LUNCH' && (
          <div className="text-[9px] font-black text-accent/90 dark:text-brand-text-dark/90 tracking-wide">{slot.subject_code}</div>
        )}

        <div className="font-extrabold text-[10px] leading-tight text-brand-text dark:text-brand-text-dark">
          {slot.subject_name}
        </div>

        {!isBreakOrLunch && (
          <>
            {slot.faculty_detail?.name && (
              <div className="text-[9px] text-brand-text/80 dark:text-brand-text-dark/80 flex items-center gap-1 font-bold">
                <User className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{slot.faculty_detail.name}</span>
              </div>
            )}
            <div className="text-[8px] text-brand-text/60 dark:text-brand-text-dark/65 flex items-center gap-1 font-bold">
              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
              {slot.start_time.substring(0,5)}–{slot.end_time.substring(0,5)}
            </div>
          </>
        )}
        {isBreakOrLunch && (
          <div className="text-[8px] text-brand-text/60 dark:text-brand-text-dark/65 flex items-center gap-1 font-bold">
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            {slot.start_time.substring(0,5)}–{slot.end_time.substring(0,5)}
          </div>
        )}
      </div>
    );
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hrs * 60 + mins;
  };

  // Build columns: periods interleaved with breaks
  // Structure: P1, P2, [B1], P3, P4, [LUNCH], P5, P6, [B2], P7, P8
  // We figure this out dynamically by looking at what a typical row looks like
  const buildColumnLayout = () => {
    // breaks per day are sorted by start_time
    const breaks = allBreaks.slice().sort((a,b) => a.start_time.localeCompare(b.start_time));
    
    // For each period, find if a break follows it (based on timing)
    const cols = [];
    periods.forEach((p, idx) => {
      cols.push({ type: 'period', num: p });
      
      // Check if a break slot falls immediately after this period
      const pEndTime = schedule.find(s => s.period_number === p)?.end_time;
      if (pEndTime) {
        const pEndMin = timeToMinutes(pEndTime);
        const breakAfter = breaks.find(b => {
          const bStartMin = timeToMinutes(b.start_time);
          // Match if break starts within 5 mins of this period ending
          return Math.abs(bStartMin - pEndMin) <= 5 && 
            !cols.find(c => c.type !== 'period' && c.breakData?.start_time === b.start_time);
        });
        if (breakAfter) {
          cols.push({ type: 'break', breakData: breakAfter });
        }
      }
    });
    return cols;
  };

  const columnLayout = rowKeys.length > 0 ? buildColumnLayout() : periods.map(p => ({ type: 'period', num: p }));

  return (
    <div className="space-y-6 text-left p-2 max-w-full mx-auto">
      {/* Header */}
      <div className="border-b border-brand-border/20 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-text tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-accent" />
            Weekly Timetable
          </h2>
          <p className="text-xs text-brand-text/55 mt-1">
            {usesDayOrder
              ? `Day Order system — ${rowKeys.length} day orders × ${periods.length} periods`
              : `${rowKeys.length} days × ${periods.length} periods`}
          </p>
        </div>
        {schedule.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-bold bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
              {schedule.filter(s => s.period_number > 0 && (s.slot_type === 'class' || s.slot_type === 'lab')).length} Classes
            </span>
            {allBreaks.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-200">
                {allBreaks.length} Breaks / Lunch
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold">
        <span className="flex items-center gap-1.5 bg-accent/12 text-accent px-2.5 py-1.5 rounded-lg border border-accent/25">
          <span className="w-2 h-2 rounded-sm bg-accent inline-block"></span> Class
        </span>
        <span className="flex items-center gap-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700/50">
          <span className="w-2 h-2 rounded-sm bg-blue-600 inline-block"></span> Lab
        </span>
        <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/50">
          <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block"></span> Break
        </span>
        <span className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700/50">
          <span className="w-2 h-2 rounded-sm bg-emerald-600 inline-block"></span> Lunch
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl">
          {error}
        </div>
      )}

      <GlassContainer className="p-0">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-brand-text/50 mt-4">Loading your schedule...</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-brand-text/20" />
            <p className="font-bold text-brand-text/50 text-sm">No timetable published yet for your department.</p>
            <p className="text-xs text-brand-text/35">Check back after your admin uploads the schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="border-collapse text-left w-full" style={{ minWidth: `${120 + columnLayout.length * 130}px` }}>
              <thead>
                <tr className="border-b-2 border-brand-border/20 bg-brand-bg/70">
                  <th className="py-3 px-4 text-[10px] font-black uppercase text-brand-text/50 sticky left-0 bg-brand-bg/95 z-10 w-24">
                    {usesDayOrder ? 'Day Order' : 'Day'}
                  </th>
                  {columnLayout.map((col, ci) => (
                    col.type === 'period' ? (
                      <th key={`p${col.num}`} className="py-3 px-2 text-center min-w-32">
                        <div className="text-[10px] font-black text-brand-text">Period {col.num}</div>
                        <div className="text-[8px] text-brand-text/40 mt-0.5">{getPeriodTime(col.num)}</div>
                      </th>
                    ) : (
                      <th key={`b${ci}`} className="py-3 px-2 text-center w-24">
                        <div className="text-[9px] font-black text-amber-600 uppercase">
                          {col.breakData?.slot_type === 'lunch' ? '🍽 Lunch' : '☕ Break'}
                        </div>
                        <div className="text-[8px] text-brand-text/35 mt-0.5">
                          {col.breakData?.start_time?.substring(0,5)}–{col.breakData?.end_time?.substring(0,5)}
                        </div>
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {rowKeys.map((rowKey) => {
                  const breaks = getBreaks(rowKey).sort((a,b) => a.start_time.localeCompare(b.start_time));
                  return (
                    <tr key={rowKey} className="hover:bg-brand-border/5 transition-colors">
                      <td className="py-3 px-4 sticky left-0 bg-brand-bg dark:bg-brand-bg-dark z-10 border-r border-brand-border/10 align-middle">
                        <div className="font-extrabold text-brand-text text-xs">
                          {usesDayOrder ? `Day ${rowKey}` : rowKey}
                        </div>
                        <div className="text-[8px] text-brand-text/35 mt-0.5 font-medium">
                          {(columnLayout.filter(c => c.type === 'period').filter(c => getSlot(rowKey, c.num))).length} classes
                        </div>
                      </td>
                      {columnLayout.map((col, ci) => {
                        if (col.type === 'period') {
                          const slot = getSlot(rowKey, col.num);
                          return (
                            <td key={`p${col.num}`} className="py-2 px-1.5 align-top">
                              <SlotCard slot={slot} />
                            </td>
                          );
                        } else {
                          // Break column — show the matching break for this row
                          const breakSlot = breaks.find(b => 
                            b.start_time === col.breakData?.start_time
                          );
                          return (
                            <td key={`b${ci}`} className="py-2 px-1.5 align-top">
                              <SlotCard slot={breakSlot} />
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassContainer>
    </div>
  );
};

export default TimetableGrid;
