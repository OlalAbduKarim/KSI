import React, { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  AlertSeverity,
  AlertSource,
  AlertStatus,
  KampalaDivision,
} from '../../types/ksis';
import { KAMPALA_DIVISIONS } from '../../utils/intelligenceEngine';
import { AlertStatusLabel, SeverityLabel } from '../common/StatusIndicators';

export const AlertCenter: React.FC = () => {
  const {
    db,
    updateAlert,
    updateThresholds,
    createIntervention,
    setSelectedSchoolId,
    setActiveView,
  } = useKSIS();

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'All' | 'Active'>('Active');
  const [sourceFilter, setSourceFilter] = useState<AlertSource | 'All'>('All');
  const [divisionFilter, setDivisionFilter] = useState<KampalaDivision | 'All'>('All');
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const [draftThresholds, setDraftThresholds] = useState(db.thresholds);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [officerInput, setOfficerInput] = useState('Samuel Okello');

  const filteredAlerts = useMemo(() => {
    return db.alerts.filter((a) => {
      if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
      if (sourceFilter !== 'All' && a.source !== sourceFilter) return false;
      if (divisionFilter !== 'All' && a.division !== divisionFilter) return false;
      if (statusFilter === 'Active' && a.status === 'Resolved') return false;
      if (statusFilter !== 'All' && statusFilter !== 'Active' && a.status !== statusFilter)
        return false;
      return true;
    });
  }, [db.alerts, severityFilter, statusFilter, sourceFilter, divisionFilter]);

  const counts = useMemo(() => {
    const active = db.alerts.filter((a) => a.status !== 'Resolved');
    return {
      totalActive: active.length,
      critical: active.filter((a) => a.severity === 'Critical').length,
      high: active.filter((a) => a.severity === 'High').length,
      systemFlags: active.filter((a) => a.source === 'System Rule Engine').length,
      verifiedInspection: active.filter(
        (a) => a.source === 'Verified Inspection Finding'
      ).length,
    };
  }, [db.alerts]);

  const saveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(draftThresholds);
    setShowThresholdConfig(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Intelligence & Rule-Based Alert Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated system flags and verified inspection findings evaluated dynamically from stored school indicators
          </p>
        </div>

        <button
          onClick={() => {
            setDraftThresholds(db.thresholds);
            setShowThresholdConfig((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Configure Alert Thresholds
        </button>
      </div>

      {showThresholdConfig && (
        <form
          onSubmit={saveThresholds}
          className="bg-white border border-slate-200 rounded-md p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-slate-900">
            Rule Engine Threshold Configuration (Changes Recalculate Active Alerts Immediately)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1 block">
              <span className="text-slate-600">Minimum Learner Attendance (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draftThresholds.minAttendancePct}
                onChange={(e) =>
                  setDraftThresholds({
                    ...draftThresholds,
                    minAttendancePct: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Minimum Pass Rate (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draftThresholds.minPassRatePct}
                onChange={(e) =>
                  setDraftThresholds({
                    ...draftThresholds,
                    minPassRatePct: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Max Teacher : Learner Ratio</span>
              <input
                type="number"
                min={10}
                max={120}
                value={draftThresholds.maxTeacherLearnerRatio}
                onChange={(e) =>
                  setDraftThresholds({
                    ...draftThresholds,
                    maxTeacherLearnerRatio: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Term Decline Trigger (pts)</span>
              <input
                type="number"
                min={1}
                max={50}
                value={draftThresholds.declineDropThresholdPct}
                onChange={(e) =>
                  setDraftThresholds({
                    ...draftThresholds,
                    declineDropThresholdPct: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowThresholdConfig(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md"
            >
              Apply Thresholds & Recalculate
            </button>
          </div>
        </form>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Active Unresolved Alerts</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {counts.totalActive}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Critical Severity</div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-0.5">
            {counts.critical}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">High Severity</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">
            {counts.high}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">System Rule Engine Flags</div>
          <div className="text-2xl font-bold text-[#0B1E3D] font-mono tabular-nums mt-0.5">
            {counts.systemFlags}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Verified Inspection Findings</div>
          <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-0.5">
            {counts.verifiedInspection}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-md p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'All' | 'Active')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
        >
          <option value="Active">Active (Open / Acknowledged / In Progress)</option>
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as AlertSource | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
        >
          <option value="All">All Detection Sources</option>
          <option value="System Rule Engine">System Rule Engine (Automated)</option>
          <option value="Verified Inspection Finding">Verified Inspection Finding</option>
        </select>
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value as KampalaDivision | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
        >
          <option value="All">All Divisions</option>
          {KAMPALA_DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Alert List */}
      <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-200">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No alerts match the current filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const school = db.schools.find((s) => s.id === alert.schoolId);
            const isEditing = activeNoteId === alert.id;
            return (
              <div key={alert.id} className="p-5 space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <SeverityLabel severity={alert.severity} />
                    <button
                      onClick={() => {
                        setSelectedSchoolId(alert.schoolId);
                        setActiveView('directory');
                      }}
                      className="text-sm font-semibold text-[#0B1E3D] hover:underline text-left"
                    >
                      {school?.name ?? alert.schoolId}
                    </button>
                    <span className="text-xs text-slate-500">
                      {alert.division} · Detected{' '}
                      <span className="font-mono">{alert.dateDetected}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span
                      className={`font-medium ${
                        alert.source === 'Verified Inspection Finding'
                          ? 'text-teal-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {alert.source}
                    </span>
                    <span aria-hidden="true">·</span>
                    <AlertStatusLabel status={alert.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-900 font-medium">{alert.issue}</p>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Recommended Action:</span>{' '}
                  {alert.recommendedAction}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500">
                    Assigned Officer:{' '}
                    <span className="font-medium text-slate-800">
                      {alert.assignedOfficer}
                    </span>
                    {alert.resolutionNotes && (
                      <>
                        {' · '}Resolution Note: <span className="text-slate-700">{alert.resolutionNotes}</span>
                      </>
                    )}
                  </div>

                  {alert.status !== 'Resolved' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {alert.status === 'Open' && (
                        <button
                          onClick={() =>
                            updateAlert(alert.id, {
                              status: 'Acknowledged',
                              assignedOfficer: officerInput,
                            })
                          }
                          className="px-2.5 py-1 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveNoteId(isEditing ? null : alert.id);
                          setNoteInput(alert.resolutionNotes || '');
                        }}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm"
                      >
                        Assign / Close
                      </button>
                      <button
                        onClick={() => {
                          createIntervention({
                            schoolId: alert.schoolId,
                            alertId: alert.id,
                            title: `Alert Follow-up: ${alert.category}`,
                            issueCategory: alert.category,
                            identifiedDate: new Date().toISOString().slice(0, 10),
                            responsibleOfficer:
                              alert.assignedOfficer !== 'Unassigned'
                                ? alert.assignedOfficer
                                : 'Samuel Okello',
                            deadline: '2026-12-15',
                            status: 'Ongoing',
                            progressNotes: alert.recommendedAction,
                            outcomeSummary: '',
                            baselineAttendance: 70,
                            baselinePassRate: 50,
                            problemImproved: null,
                          });
                          updateAlert(alert.id, { status: 'In Progress' });
                          setActiveView('interventions');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-sm"
                      >
                        Launch Intervention
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-2 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={officerInput}
                      onChange={(e) => setOfficerInput(e.target.value)}
                      placeholder="Responsible Officer"
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-sm"
                    />
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Follow-up action or resolution summary..."
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateAlert(alert.id, {
                            status: 'In Progress',
                            assignedOfficer: officerInput,
                            resolutionNotes: noteInput,
                          });
                          setActiveNoteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-sm"
                      >
                        Save Progress
                      </button>
                      <button
                        onClick={() => {
                          updateAlert(alert.id, {
                            status: 'Resolved',
                            assignedOfficer: officerInput,
                            resolutionNotes:
                              noteInput || 'Issue verified resolved by division officer.',
                          });
                          setActiveNoteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-teal-700 text-white rounded-sm"
                      >
                        Close Alert
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
