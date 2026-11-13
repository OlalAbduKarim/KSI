import React, { useState } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  Lock,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  computeSchoolMonitoringStatus,
  getSchoolTermRecord,
  getTeacherLearnerRatio,
  VALID_TERMS,
} from '../../utils/intelligenceEngine';
import { TermLineChart } from '../charts/Charts';
import {
  AlertStatusLabel,
  MonitoringStatusLabel,
  SeverityLabel,
  SubmissionStatusLabel,
} from '../common/StatusIndicators';

type ProfileTab =
  | 'overview'
  | 'academic'
  | 'enrolment'
  | 'attendance'
  | 'staffing'
  | 'infrastructure'
  | 'inspections'
  | 'history'
  | 'interventions';

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'academic', label: 'Academic Performance' },
  { id: 'enrolment', label: 'Enrolment' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'staffing', label: 'Staffing' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'inspections', label: 'Inspections & Compliance' },
  { id: 'history', label: 'Reporting History' },
  { id: 'interventions', label: 'Interventions' },
];

export const SchoolProfileView: React.FC<{
  schoolId: string;
  onBack?: () => void;
  embeddedInPortal?: boolean;
}> = ({ schoolId, onBack, embeddedInPortal = false }) => {
  const {
    db,
    currentUser,
    markDemoStep,
    setActiveView,
    setPortalSchoolId,
    createIntervention,
    updateIntervention,
  } = useKSIS();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [showQuickIntervention, setShowQuickIntervention] = useState(false);
  const [intTitle, setIntTitle] = useState('');
  const [intCategory, setIntCategory] = useState('Academic & Attendance');
  const [intOfficer, setIntOfficer] = useState('Samuel Okello');
  const [intDeadline, setIntDeadline] = useState('2026-12-15');

  const school = db.schools.find((s) => s.id === schoolId);
  if (!school) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-600">
        School record not found.
      </div>
    );
  }

  const termSeries = VALID_TERMS.map((t) => ({
    term: t,
    record: getSchoolTermRecord(db.termRecords, school.id, t),
  }));
  const latestRecord = getSchoolTermRecord(db.termRecords, school.id, db.activeTerm);
  const schoolSubmissions = db.submissions.filter((s) => s.schoolId === school.id);
  const schoolAlerts = db.alerts.filter((a) => a.schoolId === school.id);
  const schoolInspections = db.inspections.filter((i) => i.schoolId === school.id);
  const schoolInterventions = db.interventions.filter((i) => i.schoolId === school.id);

  const monitoringStatus = computeSchoolMonitoringStatus(
    school.id,
    latestRecord,
    db.alerts,
    db.submissions,
    db.interventions,
    db.activeTerm
  );

  const canViewFinancial =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'KCCA Education Officer' ||
    (currentUser.role === 'School Administrator' &&
      currentUser.assignedSchoolId === school.id);

  const canManageInterventions =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'KCCA Education Officer' ||
    currentUser.role === 'Education Monitoring Officer';

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (tab === 'academic' || tab === 'attendance' || tab === 'enrolment') {
      markDemoStep('inspectedHistory');
    }
  };

  const handleCreateQuickIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intTitle.trim()) return;
    createIntervention({
      schoolId: school.id,
      title: intTitle.trim(),
      issueCategory: intCategory,
      identifiedDate: new Date().toISOString().slice(0, 10),
      responsibleOfficer: intOfficer,
      deadline: intDeadline,
      status: 'Ongoing',
      progressNotes: 'Initiated directly from School Intelligence Profile.',
      outcomeSummary: '',
      baselineAttendance: latestRecord?.learnerAttendanceRate ?? 0,
      baselinePassRate: latestRecord?.overallPassRate ?? 0,
      problemImproved: null,
    });
    setIntTitle('');
    setShowQuickIntervention(false);
    setActiveTab('interventions');
  };

  const latestSub = schoolSubmissions.find((s) => s.term === db.activeTerm);
  const tlRatio = getTeacherLearnerRatio(latestRecord);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            {onBack && !embeddedInPortal && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to School Directory
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {school.name}
              </h2>
              <MonitoringStatusLabel status={monitoringStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono text-slate-700">{school.id}</span>
              <span aria-hidden="true">·</span>
              <span>{school.division}</span>
              <span aria-hidden="true">·</span>
              <span>{school.parish} Parish</span>
              <span aria-hidden="true">·</span>
              <span>{school.ownership}</span>
              <span aria-hidden="true">·</span>
              <span>{school.level}</span>
              <span aria-hidden="true">·</span>
              <span>Head Teacher: {school.headTeacher}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 font-medium">Simulated Record</span>
            </div>
          </div>

          {!embeddedInPortal && canManageInterventions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setPortalSchoolId(school.id);
                  setActiveView('portal');
                }}
                className="px-3 py-2 text-xs font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md whitespace-nowrap"
              >
                Open in Submission Portal
              </button>
              <button
                onClick={() => setShowQuickIntervention((v) => !v)}
                className="px-3 py-2 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md whitespace-nowrap"
              >
                Create Intervention
              </button>
            </div>
          )}
        </div>

        {showQuickIntervention && (
          <form
            onSubmit={handleCreateQuickIntervention}
            className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <input
              type="text"
              required
              placeholder="Intervention title (e.g. Attendance Recovery Plan)"
              value={intTitle}
              onChange={(e) => setIntTitle(e.target.value)}
              className="md:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-md"
            />
            <select
              value={intCategory}
              onChange={(e) => setIntCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
            >
              <option value="Academic & Attendance">Academic & Attendance</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Staffing">Staffing</option>
              <option value="Health & Sanitation">Health & Sanitation</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={intDeadline}
                onChange={(e) => setIntDeadline(e.target.value)}
                className="flex-1 px-2 py-2 text-xs border border-slate-300 rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Key Headline Metrics Strip */}
        {latestRecord && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-5 border-t border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Enrolment ({db.activeTerm})</div>
              <div className="text-lg font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {latestRecord.totalEnrolment.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Learner Attendance</div>
              <div
                className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${
                  latestRecord.learnerAttendanceRate < db.thresholds.minAttendancePct
                    ? 'text-red-700'
                    : 'text-slate-900'
                }`}
              >
                {latestRecord.learnerAttendanceRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Overall Pass Rate</div>
              <div
                className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${
                  latestRecord.overallPassRate < db.thresholds.minPassRatePct
                    ? 'text-red-700'
                    : 'text-slate-900'
                }`}
              >
                {latestRecord.overallPassRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Teacher : Learner</div>
              <div
                className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${
                  tlRatio > db.thresholds.maxTeacherLearnerRatio
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                1:{tlRatio}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Classroom Condition</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {latestRecord.classroomCondition}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Reporting Status</div>
              <div className="mt-1">
                <SubmissionStatusLabel status={latestSub ? latestSub.status : 'Missing'} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9 Profile Tabs */}
      <div className="bg-white border border-slate-200 rounded-md">
        <div className="border-b border-slate-200 px-4 overflow-x-auto">
          <nav className="flex items-center gap-1" aria-label="School profile tabs">
            {PROFILE_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#0B1E3D] text-[#0B1E3D]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && latestRecord && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    3-Term Academic & Attendance Trajectory
                  </h3>
                  <TermLineChart
                    data={termSeries.map((s) => ({
                      label: s.term,
                      value: s.record?.overallPassRate ?? 0,
                      secondaryValue: s.record?.learnerAttendanceRate ?? 0,
                    }))}
                    primaryLabel="Pass Rate (%)"
                    secondaryLabel="Learner Attendance (%)"
                    minY={30}
                    maxY={100}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Operational Context & Verification
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {latestRecord.operationalChallenges}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    Data Verification Status:{' '}
                    <span className="font-semibold text-slate-800">
                      {latestRecord.verificationStatus}
                    </span>{' '}
                    · Last updated {latestRecord.updatedAt}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Active Alerts ({schoolAlerts.filter((a) => a.status !== 'Resolved').length})
                </h3>
                {schoolAlerts.filter((a) => a.status !== 'Resolved').length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 border border-dashed border-slate-200 rounded-md px-4">
                    No active intelligence alerts for this school.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                    {schoolAlerts
                      .filter((a) => a.status !== 'Resolved')
                      .map((alert) => (
                        <div key={alert.id} className="p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <SeverityLabel severity={alert.severity} />
                            <span className="text-[11px] text-slate-500">
                              {alert.source}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-900">
                            {alert.issue}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Recommended: {alert.recommendedAction}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC PERFORMANCE */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Pass Rate Trend (3 Terms)
                  </h3>
                  <TermLineChart
                    data={termSeries.map((s) => ({
                      label: s.term,
                      value: s.record?.overallPassRate ?? 0,
                      secondaryValue: s.record?.examParticipationRate ?? 0,
                    }))}
                    primaryLabel="Overall Pass Rate (%)"
                    secondaryLabel="Exam Participation (%)"
                    minY={30}
                    maxY={100}
                  />
                </div>
                {latestRecord && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Core Subject Breakdown ({db.activeTerm})
                    </h3>
                    {[
                      { name: 'Mathematics', val: latestRecord.mathScore },
                      { name: 'English Language', val: latestRecord.englishScore },
                      { name: 'Integrated Science', val: latestRecord.scienceScore },
                      { name: 'Overall Pass Rate', val: latestRecord.overallPassRate },
                      {
                        name: 'Examination Participation',
                        val: latestRecord.examParticipationRate,
                      },
                    ].map((sub) => (
                      <div key={sub.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700 font-medium">{sub.name}</span>
                          <span className="font-mono text-slate-900 tabular-nums">
                            {sub.val.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${
                              sub.val < 50
                                ? 'bg-red-600'
                                : sub.val < 70
                                ? 'bg-amber-600'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${sub.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Term</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Overall Pass</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Mathematics</th>
                      <th className="py-2.5 px-4 font-semibold text-right">English</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Science</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Exam Participation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {termSeries.map(({ term, record }) => (
                      <tr key={term} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                          {term}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.overallPassRate.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.mathScore.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.englishScore.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.scienceScore.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.examParticipationRate.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ENROLMENT */}
          {activeTab === 'enrolment' && (
            <div className="space-y-6">
              <TermLineChart
                data={termSeries.map((s) => ({
                  label: s.term,
                  value: s.record?.totalEnrolment ?? 0,
                }))}
                unit=""
                primaryLabel="Total Enrolled Learners"
                primaryColor="#1D4ED8"
              />
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Term</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Enrolled</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Male</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Female</th>
                      <th className="py-2.5 px-4 font-semibold text-right">New Admissions</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Withdrawals</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {termSeries.map(({ term, record }, idx) => {
                      const prev = idx > 0 ? termSeries[idx - 1].record : undefined;
                      const delta =
                        record && prev
                          ? record.totalEnrolment - prev.totalEnrolment
                          : null;
                      return (
                        <tr key={term} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                            {term}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {record?.totalEnrolment.toLocaleString() ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {record?.maleEnrolment.toLocaleString() ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {record?.femaleEnrolment.toLocaleString() ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {record?.newAdmissions ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {record?.withdrawals ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {delta === null ? '—' : delta >= 0 ? `+${delta}` : delta}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <TermLineChart
                data={termSeries.map((s) => ({
                  label: s.term,
                  value: s.record?.learnerAttendanceRate ?? 0,
                  secondaryValue: s.record?.teacherAttendanceRate ?? 0,
                }))}
                primaryLabel="Learner Attendance (%)"
                secondaryLabel="Teacher Attendance (%)"
                minY={45}
                maxY={100}
              />
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Term</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Learner Attendance</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Teacher Attendance</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Chronic Absenteeism</th>
                      <th className="py-2.5 px-4 font-semibold">Threshold Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {termSeries.map(({ term, record }) => (
                      <tr key={term} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                          {term}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.learnerAttendanceRate.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.teacherAttendanceRate.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.chronicAbsenteeismRate.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {record &&
                          record.learnerAttendanceRate < db.thresholds.minAttendancePct ? (
                            <span className="text-red-700 font-medium">
                              Below {db.thresholds.minAttendancePct}% standard
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Within standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: STAFFING */}
          {activeTab === 'staffing' && (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Term</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Teaching Staff</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Teacher:Learner Ratio</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Qualified (%)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Vacancies</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Staff Turnover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {termSeries.map(({ term, record }) => {
                    const ratio = getTeacherLearnerRatio(record);
                    return (
                      <tr key={term} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                          {term}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record?.totalTeachers ?? '—'}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-semibold ${
                            ratio > db.thresholds.maxTeacherLearnerRatio
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {record ? `1:${ratio}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record ? `${record.qualifiedTeachersPct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record?.teacherVacancies ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record?.staffTurnoverCount ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: INFRASTRUCTURE */}
          {activeTab === 'infrastructure' && latestRecord && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: 'Permanent Classrooms',
                  value: `${latestRecord.classroomsCount} rooms`,
                },
                {
                  label: 'Classroom Condition',
                  value: latestRecord.classroomCondition,
                  alert: latestRecord.classroomCondition === 'Critical',
                },
                {
                  label: 'Desk Availability',
                  value: `${latestRecord.deskAvailabilityPct}% of learners seated`,
                },
                {
                  label: 'Toilet Facilities',
                  value: latestRecord.toiletCondition,
                  alert: latestRecord.toiletCondition === 'Critical',
                },
                {
                  label: 'Clean Water Availability',
                  value: latestRecord.waterAvailable ? 'Available' : 'Unavailable / Disrupted',
                  alert: !latestRecord.waterAvailable,
                },
                {
                  label: 'Electricity Supply',
                  value: latestRecord.electricityAvailable ? 'Connected' : 'Unavailable',
                },
                {
                  label: 'Accessibility Facilities',
                  value: latestRecord.accessibilityFacilities
                    ? 'Ramps & accessible latrines present'
                    : 'Not installed',
                },
                {
                  label: 'Learning Materials',
                  value: latestRecord.learningMaterialAvailability,
                },
                {
                  label: 'Sanitation Rating',
                  value: latestRecord.sanitationRating,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 border border-slate-200 rounded-md bg-slate-50/60"
                >
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div
                    className={`text-sm font-semibold mt-1 ${
                      item.alert ? 'text-red-700' : 'text-slate-900'
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: INSPECTIONS & COMPLIANCE + SAFEGUARDING + FINANCIAL (RESTRICTED) */}
          {activeTab === 'inspections' && latestRecord && (
            <div className="space-y-6">
              {/* Health, Safety & Safeguarding (Aggregated & Restricted) */}
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50/70">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#0B1E3D]" />
                    Health, Safety & Safeguarding (Aggregated Indicators)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Confidential case identities withheld per safeguarding policy
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500">First Aid Readiness</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {latestRecord.firstAidAvailable ? 'Available' : 'Missing / Restock'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Sanitation Status</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {latestRecord.sanitationRating}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Safety Inspection</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {latestRecord.safetyInspectionStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Safety Incidents (Count)</div>
                    <div className="font-semibold font-mono text-slate-900 mt-0.5">
                      {latestRecord.safetyIncidentsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Safeguarding Referral</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {canViewFinancial
                        ? latestRecord.safeguardingReferralStatus
                        : 'Restricted Access'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Operational Indicators (Access-Controlled) */}
              <div className="border border-slate-200 rounded-md p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-600" />
                    Financial & Operational Indicators (Access-Controlled)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Role: {currentUser.role}
                  </span>
                </div>
                {canViewFinancial ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500">Fee Collection Rate (where applicable)</div>
                      <div className="font-semibold font-mono text-slate-900 mt-0.5">
                        {latestRecord.feeCollectionRate !== null
                          ? `${latestRecord.feeCollectionRate}%`
                          : 'N/A (Universal Primary/Govt Capitation)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Learning Material Availability</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {latestRecord.learningMaterialAvailability}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Resource Constraints</div>
                      <div className="font-medium text-slate-800 mt-0.5">
                        {latestRecord.resourceConstraints}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Financial indicators are restricted to KCCA Education Officers, System Administrators, and the school&apos;s own Administrator.
                  </p>
                )}
              </div>

              {/* Inspections History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#0B1E3D]" />
                  Inspection & Compliance Records ({schoolInspections.length})
                </h3>
                {schoolInspections.length === 0 ? (
                  <p className="text-xs text-slate-500 border border-dashed border-slate-200 rounded-md p-4">
                    No inspection records recorded yet for this school.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {schoolInspections.map((insp) => (
                      <div
                        key={insp.id}
                        className="border border-slate-200 rounded-md p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="font-semibold text-slate-900">
                            {insp.id} · Inspected {insp.inspectionDate} by {insp.inspectorName}
                          </div>
                          <div className="flex items-center gap-3">
                            <span>Status: <strong>{insp.status}</strong></span>
                            <span>Compliance: <strong>{insp.complianceStatus}</strong></span>
                            <span>Next Due: <strong className="font-mono">{insp.nextScheduledDate}</strong></span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700">{insp.findingsSummary}</p>
                        {insp.recommendations.length > 0 && (
                          <div className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">Recommendations:</span>{' '}
                            {insp.recommendations.join('; ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: REPORTING HISTORY */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Submission ID</th>
                    <th className="py-2.5 px-4 font-semibold">Period</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Completeness</th>
                    <th className="py-2.5 px-4 font-semibold">Submitted Date</th>
                    <th className="py-2.5 px-4 font-semibold">Reviewer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schoolSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No submissions logged yet.
                      </td>
                    </tr>
                  ) : (
                    schoolSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-800">{sub.id}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{sub.term}</td>
                        <td className="py-2.5 px-4">
                          <SubmissionStatusLabel status={sub.status} />
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {sub.completenessPct}%
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {sub.submittedAt || 'Not submitted'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-md">
                          {sub.reviewerComments || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 9: INTERVENTIONS */}
          {activeTab === 'interventions' && (
            <div className="space-y-4">
              {schoolInterventions.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-md p-6 text-center text-xs text-slate-500">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  No interventions recorded for this school.
                </div>
              ) : (
                schoolInterventions.map((intv) => (
                  <div
                    key={intv.id}
                    className="border border-slate-200 rounded-md p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {intv.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {intv.id} · {intv.issueCategory} · Officer: {intv.responsibleOfficer} · Deadline:{' '}
                          <span className="font-mono">{intv.deadline}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        {canManageInterventions && intv.status !== 'Completed' && (
                          <button
                            onClick={() =>
                              updateIntervention(intv.id, {
                                status: 'Completed',
                                outcomeAttendance: latestRecord?.learnerAttendanceRate,
                                outcomePassRate: latestRecord?.overallPassRate,
                                outcomeSummary:
                                  'Intervention milestones verified completed by KCCA monitoring team.',
                                problemImproved: true,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-sm"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{intv.progressNotes}</p>
                    <div className="flex flex-wrap gap-6 text-xs text-slate-600 pt-1 border-t border-slate-100 font-mono tabular-nums">
                      <span>
                        Baseline: {intv.baselineAttendance}% att · {intv.baselinePassRate}% pass
                      </span>
                      {intv.status === 'Completed' && (
                        <span className="text-emerald-700 font-medium">
                          Outcome: {intv.outcomeAttendance ?? latestRecord?.learnerAttendanceRate}% att ·{' '}
                          {intv.outcomePassRate ?? latestRecord?.overallPassRate}% pass{' '}
                          {intv.problemImproved ? '(Improved)' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
