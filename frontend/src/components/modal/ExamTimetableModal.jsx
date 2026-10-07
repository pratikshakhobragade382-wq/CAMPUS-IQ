import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from './Modal';
import { Button } from '../ui/Button';
import { getExamSubjectSchedules } from '../../api/exam.api';

function formatIndianDate(dateVal) {
  if (!dateVal) return '—';
  const clean = String(dateVal).split('T')[0];
  const d = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortWeekday(dateVal) {
  if (!dateVal) return '';
  const clean = String(dateVal).split('T')[0];
  const d = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

function formatFullWeekday(dateVal) {
  if (!dateVal) return '';
  const clean = String(dateVal).split('T')[0];
  const d = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'long' });
}

function formatDayNumber(dateVal) {
  if (!dateVal) return '—';
  const clean = String(dateVal).split('T')[0];
  const d = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.getDate();
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '—';
  const clean = String(timeStr).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return clean;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function ExamTimetableModal({
  isOpen,
  onClose,
  exam,
  studentName = '',
  className = '',
  theme = 'blue', // 'blue' | 'purple' | 'slate'
}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !exam?.id) {
      setSchedules([]);
      return;
    }

    // Pre-populate if exam already has subjectSchedules
    if (Array.isArray(exam.subjectSchedules) && exam.subjectSchedules.length > 0) {
      setSchedules(exam.subjectSchedules);
    }

    // Also fetch fresh from API
    let cancelled = false;
    async function fetchSchedules() {
      setLoading(true);
      try {
        const res = await getExamSubjectSchedules(exam.id);
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (!cancelled) {
          setSchedules(data.length > 0 ? data : (exam.subjectSchedules || []));
        }
      } catch (err) {
        if (!cancelled && (!exam.subjectSchedules || exam.subjectSchedules.length === 0)) {
          setSchedules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSchedules();
    return () => {
      cancelled = true;
    };
  }, [isOpen, exam]);

  if (!exam) return null;

  const resolvedClassName = exam.class?.name || className || 'Class';
  const examTypeFormatted = String(exam.examType || 'Exam')
    .replace(/_/g, ' ')
    .toUpperCase();

  const themeStyles = {
    blue: {
      gradient: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
      dateBox: 'bg-blue-50 border-blue-200 text-blue-700',
      printBtn: 'hover:bg-blue-50 text-blue-700 border-blue-200',
    },
    purple: {
      gradient: 'from-purple-600 to-indigo-700',
      badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
      dateBox: 'bg-purple-50 border-purple-200 text-purple-700',
      printBtn: 'hover:bg-purple-50 text-purple-700 border-purple-200',
    },
    slate: {
      gradient: 'from-slate-800 to-indigo-900',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      dateBox: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      printBtn: 'hover:bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  }[theme] || themeStyles.blue;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📅 Exam Timetable — ${exam.name || 'Examination'}`}
      size="xl"
    >
      <ModalBody>
        {/* Meta summary card */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 mb-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <span className="font-semibold text-gray-900 text-sm">{exam.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[11px]">
                {resolvedClassName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium text-[11px]">
                {examTypeFormatted}
              </span>
            </div>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span>
                🗓️ Window: <strong>{formatIndianDate(exam.startDate)}</strong> to{' '}
                <strong>{formatIndianDate(exam.endDate)}</strong>
              </span>
              {studentName && (
                <>
                  <span>•</span>
                  <span>Student: <strong>{studentName}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Date Sheet
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && schedules.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            Loading exam routine & date sheet...
          </div>
        )}

        {/* Date Sheet Container */}
        {(!loading || schedules.length > 0) && (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header Banner */}
            <div
              className={`bg-gradient-to-r ${themeStyles.gradient} px-4 py-3 text-white flex items-center justify-between`}
            >
              <div>
                <h4 className="font-bold text-sm tracking-wide uppercase">
                  Official Examination Date Sheet
                </h4>
                <p className="text-xs text-white/80">
                  {exam.name} • Class: {resolvedClassName}
                </p>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                {schedules.length} Papers Scheduled
              </span>
            </div>

            {/* Papers list */}
            {schedules.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  No Subject Schedule Published Yet
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  The subject-wise exam dates and timings for this examination will be updated by the administration soon.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white max-h-[420px] overflow-y-auto print:max-h-none print:overflow-visible">
                {schedules.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Date badge */}
                      <div
                        className={`w-12 h-12 rounded-xl ${themeStyles.dateBox} flex flex-col items-center justify-center flex-shrink-0 border`}
                      >
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {formatShortWeekday(item.examDate)}
                        </span>
                        <span className="text-base font-extrabold leading-tight">
                          {formatDayNumber(item.examDate)}
                        </span>
                      </div>

                      {/* Subject info */}
                      <div>
                        <h5 className="font-semibold text-gray-900 text-sm">
                          {item.subject?.name || 'Subject'}
                        </h5>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                          {item.subject?.code && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">
                              Code: {item.subject.code}
                            </span>
                          )}
                          <span>•</span>
                          <span className="font-medium text-gray-700">
                            {formatIndianDate(item.examDate)} ({formatFullWeekday(item.examDate)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timing & Status badge */}
                    <div className="flex items-center gap-3 sm:text-right">
                      <div className="text-xs">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                          Timing
                        </span>
                        <span className="font-medium text-gray-800">
                          {item.startTime ? formatTimeDisplay(item.startTime) : '—'}
                          {item.endTime ? ` - ${formatTimeDisplay(item.endTime)}` : ''}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
export default ExamTimetableModal;
