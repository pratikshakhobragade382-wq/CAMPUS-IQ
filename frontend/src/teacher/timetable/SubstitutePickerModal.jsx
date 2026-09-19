import React, { useState, useEffect } from 'react';
import { getAvailableSubstitutes, assignSubstitute } from '../../api/substitution.api';

export default function SubstitutePickerModal({ timetableId, date, subjectName, className, onClose, onAssigned }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [substitutes, setSubstitutes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [remark, setRemark] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAvailableSubstitutes(timetableId, date);
        const list = res?.data?.availableSubstitutes || [];
        if (!cancelled) setSubstitutes(list);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Could not load available teachers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [timetableId, date]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    setError('');
    try {
      await assignSubstitute({
        timetableId,
        date,
        substituteStaffId: Number(selectedId),
        remark: remark || undefined,
      });
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not assign substitute.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="substitute-modal-overlay" onClick={onClose}>
      <div className="substitute-modal" onClick={(e) => e.stopPropagation()}>
        <div className="substitute-modal-header">
          <h3>Find a Substitute</h3>
          <button type="button" className="substitute-modal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="substitute-modal-subtitle">
          {subjectName ? `${subjectName} — ${className || ''}` : 'Select a class'} on {date}
        </p>

        {loading ? (
          <div className="substitute-modal-state">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            <span>Checking who's free...</span>
          </div>
        ) : error ? (
          <div className="substitute-modal-state substitute-modal-error">{error}</div>
        ) : substitutes.length === 0 ? (
          <div className="substitute-modal-state">No qualified, free teachers found for this period.</div>
        ) : (
          <>
            <div className="substitute-modal-list">
              {substitutes.map((s) => (
                <label key={s.id} className={`substitute-option ${String(selectedId) === String(s.id) ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="substitute"
                    value={s.id}
                    checked={String(selectedId) === String(s.id)}
                    onChange={() => setSelectedId(s.id)}
                  />
                  <div className="substitute-option-info">
                    <span className="substitute-option-name">{s.name}</span>
                    <span className="substitute-option-meta">{s.employeeId}</span>
                  </div>
                </label>
              ))}
            </div>

            <textarea
              className="substitute-remark-input"
              placeholder="Optional note (e.g. reason for absence)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
            />

            <div className="substitute-modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={assigning}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAssign}
                disabled={!selectedId || assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Substitute'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
