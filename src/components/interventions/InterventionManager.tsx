import React, { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Plus, Wrench } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  ComplianceStatus,
  InspectionStatus,
  InterventionStatus,
} from '../../types/ksis';
import { getSchoolTermRecord } from '../../utils/intelligenceEngine';

export const InterventionManager: React.FC = () => {
  const {
    db,
    currentUser,
    createInspection,
    updateInspection,
    createIntervention,
    updateIntervention,
    setSelectedSchoolId,
    setActiveView,
  } = useKSIS();

  const [subView, setSubView] = useState<'interventions' | 'inspections'>('interventions');
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | 'All'>('All');
  const [showNewIntervention, setShowNewIntervention] = useState(false);
  const [showNewInspection, setShowNewInspection] = useState(false);

  // New Intervention form state
  const [intSchoolId, setIntSchoolId] = useState('KSIS-CEN-002');
  const [intTitle, setIntTitle] = useState('');
  const [intCategory, setIntCategory] = useState('Academic & Attendance');
  const [intOfficer, setIntOfficer] = useState('Samuel Okello');
  const [intDeadline, setIntDeadline] = useState('2026-12-20');
  const [intNotes, setIntNotes] = useState('');

  // New Inspection form state
  const [inspSchoolId, setInspSchoolId] = useState('KSIS-CEN-002');
  const [inspDate, setInspDate] = useState('2026-11-12');
  const [inspInspector, setInspInspector] = useState(currentUser.name);
  const [inspCompliance, setInspCompliance] = useState<ComplianceStatus>('Conditional');
  const [inspSummary, setInspSummary] = useState('');
  const [inspIssues, setInspIssues] = useState('');
  const [inspRecs, setInspRecs] = useState('');
  const [inspNextDate, setInspNextDate] = useState('2027-02-15');

  // Completion modal/inline state
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [outcomeAtt, setOutcomeAtt] = useState('');
  const [outcomePass, setOutcomePass] = useState('');
  const [improvedFlag, setImprovedFlag] = useState(true);

  const counts = useMemo(
    () => ({
      pending: db.interventions.filter((i) => i.status === 'Pending').length,
      ongoing: db.interventions.filter((i) => i.status === 'Ongoing').length,
      completed: db.interventions.filter((i) => i.status === 'Completed').length,
      improved: db.interventions.filter((i) => i.problemImproved === true).length,
    }),
    [db.interventions]
  );

  const filteredInterventions = useMemo(() => {
    if (statusFilter === 'All') return db.interventions;
    return db.interventions.filter((i) => i.status === statusFilter);
  }, [db.interventions, statusFilter]);

  const handleCreateIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intTitle.trim()) return;
    const rec = getSchoolTermRecord(db.termRecords, intSchoolId, db.activeTerm);
    createIntervention({
      schoolId: intSchoolId,
      title: intTitle.trim(),
      issueCategory: intCategory,
      identifiedDate: new Date().toISOString().slice(0, 10),
      responsibleOfficer: intOfficer.trim() || currentUser.name,
      deadline: intDeadline,
      status: 'Ongoing',
      progressNotes: intNotes.trim() || 'Intervention plan opened for school follow-up.',
      outcomeSummary: '',
      baselineAttendance: rec?.learnerAttendanceRate ?? 0,
      baselinePassRate: rec?.overallPassRate ?? 0,
      problemImproved: null,
    });
    setIntTitle('');
    setIntNotes('');
    setShowNewIntervention(false);
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspSummary.trim()) return;
    createInspection({
      schoolId: inspSchoolId,
      inspectionDate: inspDate,
      inspectorName: inspInspector.trim() || currentUser.name,
      status: 'Completed',
      complianceStatus: inspCompliance,
      findingsSummary: inspSummary.trim(),
      issuesIdentified: inspIssues
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      recommendations: inspRecs
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      nextScheduledDate: inspNextDate,
      correctiveProgressPct: inspCompliance === 'Compliant' ? 100 : 15,
    });
    setInspSummary('');
    setInspIssues('');
    setInspRecs('');
    setShowNewInspection(false);
  };

  const openCompletePanel = (id: string, schoolId: string) => {
    const rec = getSchoolTermRecord(db.termRecords, schoolId, db.activeTerm);
    setCompletingId(id);
    setOutcomeAtt(String(rec?.learnerAttendanceRate ?? 80));
    setOutcomePass(String(rec?.overallPassRate ?? 60));
    setOutcomeNotes('Follow-up monitoring verified corrective actions completed.');
    setImprovedFlag(true);
  };

  const submitCompletion = (id: string) => {
    updateIntervention(id, {
      status: 'Completed',
      outcomeAttendance: Number(outcomeAtt) || undefined,
      outcomePassRate: Number(outcomePass) || undefined,
      outcomeSummary: outcomeNotes.trim(),
      problemImproved: improvedFlag,
    });
    setCompletingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inspections & Intervention Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule division inspections, record recommendations, assign corrective interventions, and verify school improvement outcomes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSubView('inspections');
              setShowNewInspection((v) => !v);
              setShowNewIntervention(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md whitespace-nowrap"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Create Inspection Record
          </button>
          <button
            onClick={() => {
              setSubView('interventions');
              setShowNewIntervention((v) => !v);
              setShowNewInspection(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Intervention
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Pending Interventions</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {counts.pending}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Ongoing Interventions</div>
          <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums mt-1">
            {counts.ongoing}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Completed Interventions</div>
          <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-1">
            {counts.completed}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Verified School Improvements</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {counts.improved}
            <span className="text-sm font-normal text-slate-400">
              /{counts.completed || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Create Intervention Form */}
      {showNewIntervention && (
        <form
          onSubmit={handleCreateIntervention}
          className="bg-white border border-slate-200 rounded-md p-5 space-y-4"
        >
          <div className="text-sm font-semibold text-slate-900">
            New School Intervention Plan
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1 block">
              <span className="text-slate-600">Target School</span>
              <select
                value={intSchoolId}
                onChange={(e) => setIntSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              >
                {db.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.division.replace(' Division', '')})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Intervention Title</span>
              <input
                type="text"
                required
                value={intTitle}
                onChange={(e) => setIntTitle(e.target.value)}
                placeholder="e.g. Attendance & Numeracy Recovery Plan"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Issue Category</span>
              <select
                value={intCategory}
                onChange={(e) => setIntCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              >
                <option value="Academic & Attendance">Academic & Attendance</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Health & Sanitation">Health & Sanitation</option>
                <option value="Staffing">Staffing</option>
                <option value="Compliance">Compliance</option>
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Responsible Officer</span>
              <input
                type="text"
                required
                value={intOfficer}
                onChange={(e) => setIntOfficer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Follow-up Deadline</span>
              <input
                type="date"
                required
                value={intDeadline}
                onChange={(e) => setIntDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Action Plan & Progress Notes</span>
              <input
                type="text"
                value={intNotes}
                onChange={(e) => setIntNotes(e.target.value)}
                placeholder="Key milestones and support deployed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewIntervention(false)}
              className="px-3 py-1.5 text-xs text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md"
            >
              Launch Intervention
            </button>
          </div>
        </form>
      )}

      {/* Create Inspection Form */}
      {showNewInspection && (
        <form
          onSubmit={handleCreateInspection}
          className="bg-white border border-slate-200 rounded-md p-5 space-y-4"
        >
          <div className="text-sm font-semibold text-slate-900">
            Record School Inspection & Recommendations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1 block md:col-span-2">
              <span className="text-slate-600">School Inspected</span>
              <select
                value={inspSchoolId}
                onChange={(e) => setInspSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              >
                {db.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.division.replace(' Division', '')})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Inspection Date</span>
              <input
                type="date"
                required
                value={inspDate}
                onChange={(e) => setInspDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Compliance Determination</span>
              <select
                value={inspCompliance}
                onChange={(e) => setInspCompliance(e.target.value as ComplianceStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              >
                <option value="Compliant">Compliant</option>
                <option value="Conditional">Conditional</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Inspector Name</span>
              <input
                type="text"
                required
                value={inspInspector}
                onChange={(e) => setInspInspector(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-slate-600">Next Scheduled Inspection</span>
              <input
                type="date"
                required
                value={inspNextDate}
                onChange={(e) => setInspNextDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </label>
            <label className="space-y-1 block md:col-span-2">
              <span className="text-slate-600">Issues Identified (separate with semicolons)</span>
              <input
                type="text"
                value={inspIssues}
                onChange={(e) => setInspIssues(e.target.value)}
                placeholder="e.g. Sanitation block blockage; Unverified registers"
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="space-y-1 block md:col-span-2">
              <span className="text-slate-600">Findings Summary</span>
              <textarea
                rows={2}
                required
                value={inspSummary}
                onChange={(e) => setInspSummary(e.target.value)}
                placeholder="Summary of verified physical and academic inspection findings..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
            <label className="space-y-1 block md:col-span-2">
              <span className="text-slate-600">Recommendations (separate with semicolons)</span>
              <textarea
                rows={2}
                value={inspRecs}
                onChange={(e) => setInspRecs(e.target.value)}
                placeholder="Actionable recommendations for school & division office..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewInspection(false)}
              className="px-3 py-1.5 text-xs text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md"
            >
              Save Inspection Record
            </button>
          </div>
        </form>
      )}

      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-md">
          <button
            onClick={() => setSubView('interventions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
              subView === 'interventions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interventions Tracking ({db.interventions.length})
          </button>
          <button
            onClick={() => setSubView('inspections')}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
              subView === 'inspections'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inspection Records ({db.inspections.length})
          </button>
        </div>

        {subView === 'interventions' && (
          <div className="inline-flex items-center gap-1">
            {(['All', 'Pending', 'Ongoing', 'Completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-sm border ${
                  statusFilter === st
                    ? 'bg-[#0B1E3D] text-white border-[#0B1E3D]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interventions List */}
      {subView === 'interventions' && (
        <div className="space-y-3">
          {filteredInterventions.map((intv) => {
            const school = db.schools.find((s) => s.id === intv.schoolId);
            const currentRec = getSchoolTermRecord(
              db.termRecords,
              intv.schoolId,
              db.activeTerm
            );
            const isCompleting = completingId === intv.id;

            return (
              <div
                key={intv.id}
                className="bg-white border border-slate-200 rounded-md p-5 space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs text-slate-500">{intv.id}</span>
                      <h3 className="text-sm font-bold text-slate-900">{intv.title}</h3>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-sm border ${
                          intv.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : intv.status === 'Ongoing'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {intv.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <button
                        onClick={() => {
                          setSelectedSchoolId(intv.schoolId);
                          setActiveView('directory');
                        }}
                        className="font-medium text-[#0B1E3D] hover:underline"
                      >
                        {school?.name ?? intv.schoolId}
                      </button>
                      {' · '}
                      {intv.issueCategory}
                      {' · '}Officer: {intv.responsibleOfficer}
                      {' · '}Deadline: <span className="font-mono">{intv.deadline}</span>
                    </div>
                  </div>

                  {intv.status !== 'Completed' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {intv.status === 'Pending' && (
                        <button
                          onClick={() =>
                            updateIntervention(intv.id, { status: 'Ongoing' })
                          }
                          className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm"
                        >
                          Start Progress
                        </button>
                      )}
                      <button
                        onClick={() =>
                          isCompleting
                            ? setCompletingId(null)
                            : openCompletePanel(intv.id, intv.schoolId)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Completed
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700">{intv.progressNotes}</p>

                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
                  <span className="text-slate-600">
                    Baseline: {intv.baselineAttendance}% attendance · {intv.baselinePassRate}% pass
                  </span>
                  {currentRec && intv.status !== 'Completed' && (
                    <span className="text-slate-800">
                      Current ({db.activeTerm}): {currentRec.learnerAttendanceRate}% attendance ·{' '}
                      {currentRec.overallPassRate}% pass
                    </span>
                  )}
                  {intv.status === 'Completed' && (
                    <span className="text-emerald-700 font-semibold font-sans">
                      Outcome: {intv.outcomeSummary || 'Completed'}{' '}
                      {intv.outcomeAttendance !== undefined &&
                        `(${intv.outcomeAttendance}% att / ${intv.outcomePassRate}% pass)`}{' '}
                      · {intv.problemImproved ? 'Problem Improved' : 'Monitoring Continues'}
                    </span>
                  )}
                </div>

                {isCompleting && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-sm">
                    <label className="space-y-1 block">
                      <span className="text-slate-600">Verified Attendance (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={outcomeAtt}
                        onChange={(e) => setOutcomeAtt(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm bg-white font-mono"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-slate-600">Verified Pass Rate (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={outcomePass}
                        onChange={(e) => setOutcomePass(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm bg-white font-mono"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-slate-600">Did Problem Improve?</span>
                      <select
                        value={improvedFlag ? 'yes' : 'no'}
                        onChange={(e) => setImprovedFlag(e.target.value === 'yes')}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-sm bg-white"
                      >
                        <option value="yes">Yes — Measurable Improvement</option>
                        <option value="no">No — Further Action Needed</option>
                      </select>
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => submitCompletion(intv.id)}
                        className="flex-1 px-3 py-1.5 font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-sm"
                      >
                        Confirm Completion
                      </button>
                    </div>
                    <input
                      type="text"
                      value={outcomeNotes}
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      placeholder="Outcome summary..."
                      className="md:col-span-4 px-2.5 py-1.5 border border-slate-300 rounded-sm bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inspections Table */}
      {subView === 'inspections' && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Inspection ID</th>
                  <th className="py-2.5 px-4 font-semibold">School</th>
                  <th className="py-2.5 px-4 font-semibold">Date & Inspector</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Compliance</th>
                  <th className="py-2.5 px-4 font-semibold">Findings & Recommendations</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {db.inspections.map((insp) => {
                  const school = db.schools.find((s) => s.id === insp.schoolId);
                  return (
                    <tr key={insp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {insp.id}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#0B1E3D]">
                        <button
                          onClick={() => {
                            setSelectedSchoolId(insp.schoolId);
                            setActiveView('directory');
                          }}
                          className="hover:underline text-left"
                        >
                          {school?.name ?? insp.schoolId}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="font-mono">{insp.inspectionDate}</span> ·{' '}
                        {insp.inspectorName}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-medium">
                        <span
                          className={
                            insp.status === 'Overdue'
                              ? 'text-red-700'
                              : insp.status === 'Pending'
                              ? 'text-amber-700'
                              : 'text-slate-800'
                          }
                        >
                          {insp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            insp.complianceStatus === 'Compliant'
                              ? 'text-emerald-700'
                              : insp.complianceStatus === 'Conditional'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {insp.complianceStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-md">
                        {insp.findingsSummary}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {insp.status !== 'Completed' && (
                          <button
                            onClick={() =>
                              updateInspection(insp.id, {
                                status: 'Completed' as InspectionStatus,
                                correctiveProgressPct: 100,
                              })
                            }
                            className="text-xs font-medium text-teal-700 hover:underline"
                          >
                            Mark Inspected
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
