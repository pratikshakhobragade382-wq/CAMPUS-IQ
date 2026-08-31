import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherTopbar from '../components/TeacherTopbar';
import { getTeacherTimetable, getPeriodSlots } from '../../api/timetable.api';
import './TeacherTimetable.css';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 1 : new Date().getDay());
  const [timetableData, setTimetableData] = useState([]);
  const [periodSlots, setPeriodSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const staffId = user?.staff?.id || user?.staffId || user?.id;

  const loadTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      const [slotsRes, ttRes] = await Promise.all([
        getPeriodSlots().catch(() => ({ data: [] })),
        getTeacherTimetable({ staffId }).catch(() => ({ data: [] })),
      ]);

      const slots = Array.isArray(slotsRes?.data) ? slotsRes.data : Array.isArray(slotsRes) ? slotsRes : [];
      const tt = Array.isArray(ttRes?.data) ? ttRes.data : Array.isArray(ttRes) ? ttRes : [];

      setPeriodSlots(slots);
      setTimetableData(tt);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      setError('Could not load timetable. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [staffId]);

  // Current day periods
  const daySchedule = useMemo(() => {
    const entriesForDay = timetableData.filter((item) => Number(item.dayOfWeek) === Number(selectedDay));
    
    // Merge with period slots if available, or use direct entries
    if (periodSlots.length > 0) {
      return periodSlots
        .slice()
        .sort((a, b) => (a.slotNo || 0) - (b.slotNo || 0))
        .map((slot) => {
          const matchedEntry = entriesForDay.find((e) => Number(e.periodSlotId) === Number(slot.id));
          return {
            slot,
            entry: matchedEntry,
          };
        });
    }

    // If slots are not seeded, show direct entries
    return entriesForDay.map((entry) => ({
      slot: entry.periodSlot || {
        label: `Period ${entry.periodSlotId || 1}`,
        startTime: '08:00',
        endTime: '08:45',
        slotType: 'period',
      },
      entry,
    }));
  }, [timetableData, periodSlots, selectedDay]);

  // Quick stats
  const totalLecturesToday = daySchedule.filter((item) => item.entry).length;
  const weeklyTotalLectures = timetableData.length;

  return (
    <div className="teacher-timetable-page">
      <TeacherTopbar
        searchPlaceholder="Search timetable, subjects, classes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="timetable-header-section">
        <div className="timetable-title-area">
          <h1>My Weekly Timetable</h1>
          <p>View your scheduled lectures, class timings, and period slots</p>
        </div>

        <div className="timetable-header-actions">
          <button type="button" className="btn-timetable-action" onClick={loadTimetable}>
            <i className="fa-solid fa-arrows-rotate"></i>
            Refresh
          </button>
          <button type="button" className="btn-timetable-action btn-timetable-primary" onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i>
            Print Schedule
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="timetable-stats-row">
        <div className="timetable-stat-card">
          <div className="stat-icon-wrapper stat-blue">
            <i className="fa-solid fa-calendar-day"></i>
          </div>
          <div className="stat-info">
            <h3>{totalLecturesToday}</h3>
            <p>Lectures Today ({DAYS.find((d) => d.value === selectedDay)?.label})</p>
          </div>
        </div>

        <div className="timetable-stat-card">
          <div className="stat-icon-wrapper stat-purple">
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <div className="stat-info">
            <h3>{weeklyTotalLectures}</h3>
            <p>Total Weekly Lectures</p>
          </div>
        </div>

        <div className="timetable-stat-card">
          <div className="stat-icon-wrapper stat-green">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{periodSlots.length || 7}</h3>
            <p>Configured Period Slots</p>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="day-selector-card">
        <div className="day-tabs">
          {DAYS.map((day) => {
            const isToday = (new Date().getDay() === 0 ? 7 : new Date().getDay()) === day.value;
            const count = timetableData.filter((item) => Number(item.dayOfWeek) === Number(day.value)).length;
            return (
              <button
                key={day.value}
                type="button"
                className={`day-tab-btn ${selectedDay === day.value ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
                {isToday && <span className="today-indicator-badge">Today</span>}
                {count > 0 && <span style={{ marginLeft: 6, opacity: 0.8 }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Schedule List */}
      <div className="timetable-main-card">
        <div className="card-header-clean">
          <h2>
            <i className="fa-solid fa-timeline text-blue-600"></i>
            Schedule for {DAYS.find((d) => d.value === selectedDay)?.label}
          </h2>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {totalLecturesToday} active classes assigned
          </span>
        </div>

        {loading ? (
          <div className="empty-timetable-state">
            <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl mb-3"></i>
            <p>Loading your timetable...</p>
          </div>
        ) : error ? (
          <div className="empty-timetable-state">
            <div className="empty-icon-circle" style={{ color: '#ef4444', background: '#fee2e2' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3>Unable to load timetable</h3>
            <p>{error}</p>
          </div>
        ) : daySchedule.length === 0 ? (
          <div className="empty-timetable-state">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-mug-hot"></i>
            </div>
            <h3>No classes scheduled for {DAYS.find((d) => d.value === selectedDay)?.label}</h3>
            <p>You have no assigned lecture periods on this day.</p>
          </div>
        ) : (
          <div className="period-list">
            {daySchedule.map((item, index) => {
              const { slot, entry } = item;
              const hasClass = Boolean(entry);

              return (
                <div
                  key={slot?.id || index}
                  className={`period-card ${hasClass ? 'current-active' : ''}`}
                >
                  <div className="period-time-col">
                    <span className="period-badge">{slot?.label || `Period ${index + 1}`}</span>
                    <div className="period-time-range">
                      <i className="fa-regular fa-clock" style={{ fontSize: 12, color: '#64748b' }}></i>
                      {slot?.startTime || '08:00'} - {slot?.endTime || '08:45'}
                    </div>
                  </div>

                  <div className="period-content-col">
                    {hasClass ? (
                      <>
                        <div className="subject-details">
                          <h3>{entry.subject?.name || `Subject #${entry.subjectId}`}</h3>
                          <div className="subject-meta">
                            <span className="meta-item">
                              <i className="fa-solid fa-graduation-cap text-blue-500"></i>
                              Class: {entry.class?.name || `Class #${entry.classId}`}
                              {entry.section?.name ? ` (Sec ${entry.section.name})` : ''}
                            </span>
                            {entry.academicYear?.name && (
                              <span className="meta-item">
                                <i className="fa-solid fa-calendar"></i>
                                {entry.academicYear.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="status-tag status-lecture">
                          <i className="fa-solid fa-chalkboard-user mr-1"></i> Active Lecture
                        </span>
                      </>
                    ) : slot?.slotType === 'recess' || slot?.slotType === 'lunch' ? (
                      <>
                        <div className="subject-details">
                          <h3 style={{ color: '#92400e' }}>{slot.label || 'Break Time'}</h3>
                          <span style={{ fontSize: 13, color: '#b45309' }}>Recess / Lunch Interval</span>
                        </div>
                        <span className="status-tag status-break">Break</span>
                      </>
                    ) : (
                      <>
                        <div className="subject-details">
                          <h3 style={{ color: '#94a3b8' }}>Free Period</h3>
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>No assigned class</span>
                        </div>
                        <span className="status-tag status-free">Available</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
