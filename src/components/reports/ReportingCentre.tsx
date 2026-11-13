import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import { KampalaDivision, ReportingTerm } from '../../types/ksis';
import { downloadCSV, generateReportPDF } from '../../utils/exportUtils';
import {
  computeDashboardAnalytics,
  KAMPALA_DIVISIONS,
  VALID_TERMS,
} from '../../utils/intelligenceEngine';
import { DivisionPerformanceChart, TermLineChart } from '../charts/Charts';

type ReportType =
  | 'citywide'
  | 'division'
  | 'school'
  | 'attendance'
  | 'academic'
  | 'infrastructure'
  | 'compliance'
  | 'intervention';

const REPORT_TYPES: { id: ReportType; title: string; subtitle: string }[] = [
  {
    id: 'citywide',
    title: 'Kampala-Wide Education Performance Report',
    subtitle: 'Executive synthesis across all 5 divisions and 30 simulated institutions',
  },
  {
    id: 'division',
    title: 'Division-Level Performance Report',
    subtitle: 'Targeted administrative division breakdown and school comparison',
  },
  {
    id: 'school',
    title: 'Individual School Performance Report',
    subtitle: 'Comprehensive 3-term institutional intelligence dossier',
  },
  {
    id: 'attendance',
    title: 'Learner & Teacher Attendance Report',
    subtitle: 'Attendance trends, chronic absenteeism, and sub-75% watchlist',
  },
  {
    id: 'academic',
    title: 'Academic Performance Report',
    subtitle: 'Overall pass rates, Mathematics, English, Science, and exam participation',
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & Compliance Report',
    subtitle: 'Classroom condition, WASH facilities, safety status, and inspection compliance',
  },
  {
    id: 'compliance',
    title: 'Data Submission Compliance Report',
    subtitle: 'Reporting timeliness, completeness percentages, and overdue submissions',
  },
  {
    id: 'intervention',
    title: 'Schools Requiring Intervention Report',
    subtitle: 'High-priority watchlist, active alerts, and open corrective actions',
  },
];

export const ReportingCentre: React.FC = () => {
  const { db, currentUser } = useKSIS();
  const [reportType, setReportType] = useState<ReportType>('citywide');
  const [selectedDivision, setSelectedDivision] =
    useState<KampalaDivision>('Central Division');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    db.schools[1]?.id || db.schools[0]?.id
  );
  const [selectedTerm, setSelectedTerm] = useState<ReportingTerm>(db.activeTerm);

  const cityAnalytics = useMemo(
    () =>
      computeDashboardAnalytics(db, {
        division: 'All',
        ownership: 'All',
        level: 'All',
        term: selectedTerm,
        search: '',
      }),
    [db, selectedTerm]
  );

  const divAnalytics = useMemo(
    () =>
      computeDashboardAnalytics(db, {
        division: selectedDivision,
        ownership: 'All',
        level: 'All',
        term: selectedTerm,
        search: '',
      }),
    [db, selectedDivision, selectedTerm]
  );

  const reportMeta = REPORT_TYPES.find((r) => r.id === reportType)!;

  const builtReport = useMemo(() => {
    const activeSet =
      reportType === 'division'
        ? divAnalytics.schoolSummaries
        : reportType === 'school'
        ? cityAnalytics.schoolSummaries.filter((s) => s.school.id === selectedSchoolId)
        : cityAnalytics.schoolSummaries;

    let headers: string[] = [];
    let rows: string[][] = [];
    let findings: string[] = [];
    let recommendations: string[] = [];
    let kpis: { label: string; value: string }[] = [];

    if (reportType === 'citywide' || reportType === 'division') {
      const stats = reportType === 'division' ? divAnalytics : cityAnalytics;
      kpis = [
        { label: 'Schools Covered', value: String(stats.kpis.totalRegisteredSchools) },
        {
          label: 'Total Enrolment',
          value: stats.kpis.totalLearnerEnrolment.toLocaleString(),
        },
        {
          label: 'Mean Attendance',
          value: `${stats.kpis.avgLearnerAttendance.toFixed(1)}%`,
        },
        {
          label: 'Mean Pass Rate',
          value: `${stats.kpis.avgAcademicPassRate.toFixed(1)}%`,
        },
      ];
      headers = [
        'School ID',
        'School Name',
        'Division',
        'Enrolment',
        'Attendance %',
        'Pass Rate %',
        'Status',
      ];
      rows = activeSet.map(({ school, record, monitoringStatus }) => [
        school.id,
        school.name,
        school.division.replace(' Division', ''),
        String(record?.totalEnrolment ?? 0),
        `${record?.learnerAttendanceRate.toFixed(1) ?? 0}%`,
        `${record?.overallPassRate.toFixed(1) ?? 0}%`,
        monitoringStatus,
      ]);
      findings = [
        `Mean academic pass rate across ${stats.kpis.totalRegisteredSchools} evaluated schools in ${selectedTerm} stands at ${stats.kpis.avgAcademicPassRate.toFixed(1)}%.`,
        `${stats.kpis.schoolsRequiringIntervention} institution(s) currently require critical intervention due to attendance, pass rate, or infrastructure triggers.`,
        `Reporting compliance reached ${stats.kpis.schoolsReportingThisTerm}/${stats.kpis.totalRegisteredSchools} schools (${Math.round((stats.kpis.schoolsReportingThisTerm / Math.max(1, stats.kpis.totalRegisteredSchools)) * 100)}%).`,
      ];
      recommendations = [
        'Prioritise division monitoring visits to schools below 75% attendance and 50% pass rate thresholds.',
        'Follow up on overdue or returned termly submissions to achieve 100% verified coverage.',
      ];
    } else if (reportType === 'school') {
      const target = activeSet[0];
      const rec = target?.record;
      kpis = [
        { label: 'Enrolment', value: String(rec?.totalEnrolment ?? 0) },
        {
          label: 'Learner Attendance',
          value: `${rec?.learnerAttendanceRate.toFixed(1) ?? 0}%`,
        },
        {
          label: 'Overall Pass Rate',
          value: `${rec?.overallPassRate.toFixed(1) ?? 0}%`,
        },
        { label: 'Monitoring Status', value: target?.monitoringStatus ?? '—' },
      ];
      headers = ['Term', 'Enrolment', 'Attendance %', 'Pass Rate %', 'Math %', 'English %', 'Science %'];
      rows = VALID_TERMS.map((t) => {
        const r = db.termRecords.find(
          (x) => x.schoolId === selectedSchoolId && x.term === t
        );
        return [
          t,
          String(r?.totalEnrolment ?? 0),
          `${r?.learnerAttendanceRate.toFixed(1) ?? 0}%`,
          `${r?.overallPassRate.toFixed(1) ?? 0}%`,
          `${r?.mathScore.toFixed(1) ?? 0}%`,
          `${r?.englishScore.toFixed(1) ?? 0}%`,
          `${r?.scienceScore.toFixed(1) ?? 0}%`,
        ];
      });
      findings = [
        `${target?.school.name} (${target?.school.division}) recorded ${rec?.overallPassRate.toFixed(1) ?? 0}% pass rate and ${rec?.learnerAttendanceRate.toFixed(1) ?? 0}% attendance in ${selectedTerm}.`,
        `Teacher-to-learner ratio stands at 1:${target?.teacherLearnerRatio ?? 0} with ${rec?.classroomCondition ?? 'Unknown'} classroom condition.`,
        `Operational note: ${rec?.operationalChallenges ?? 'No operational notes filed.'}`,
      ];
      recommendations = [
        'Align division support interventions with lowest-scoring core subjects and attendance barriers.',
        'Confirm scheduled safety and infrastructure verification dates.',
      ];
    } else if (reportType === 'attendance') {
      const belowFloor = activeSet.filter(
        (s) => (s.record?.learnerAttendanceRate ?? 100) < db.thresholds.minAttendancePct
      );
      kpis = [
        {
          label: 'Mean Learner Attendance',
          value: `${cityAnalytics.kpis.avgLearnerAttendance.toFixed(1)}%`,
        },
        { label: 'Below 75% Floor', value: `${belowFloor.length} schools` },
        {
          label: 'Total Learners',
          value: cityAnalytics.kpis.totalLearnerEnrolment.toLocaleString(),
        },
        { label: 'Reporting Period', value: selectedTerm },
      ];
      headers = ['School', 'Division', 'Learner Att %', 'Teacher Att %', 'Chronic Abs %', 'Threshold'];
      rows = [...activeSet]
        .sort(
          (a, b) =>
            (a.record?.learnerAttendanceRate ?? 0) -
            (b.record?.learnerAttendanceRate ?? 0)
        )
        .map(({ school, record }) => [
          school.name,
          school.division.replace(' Division', ''),
          `${record?.learnerAttendanceRate.toFixed(1) ?? 0}%`,
          `${record?.teacherAttendanceRate.toFixed(1) ?? 0}%`,
          `${record?.chronicAbsenteeismRate.toFixed(1) ?? 0}%`,
          (record?.learnerAttendanceRate ?? 0) < db.thresholds.minAttendancePct
            ? 'Below Floor'
            : 'Nominal',
        ]);
      findings = [
        `${belowFloor.length} school(s) reported learner attendance below the ${db.thresholds.minAttendancePct}% policy floor.`,
        `Lowest attendance recorded at ${rows[0]?.[0] ?? 'N/A'} (${rows[0]?.[2] ?? '0%'}).`,
      ];
      recommendations = [
        'Initiate division attendance verification audits and PTA outreach for sub-75% schools.',
      ];
    } else if (reportType === 'academic') {
      const belowPass = activeSet.filter(
        (s) => (s.record?.overallPassRate ?? 100) < db.thresholds.minPassRatePct
      );
      kpis = [
        {
          label: 'Citywide Pass Rate',
          value: `${cityAnalytics.kpis.avgAcademicPassRate.toFixed(1)}%`,
        },
        { label: 'Below 50% Floor', value: `${belowPass.length} schools` },
        {
          label: 'High Performing (≥75%)',
          value: `${cityAnalytics.performanceCategories[0]?.count ?? 0} schools`,
        },
        { label: 'Reporting Period', value: selectedTerm },
      ];
      headers = ['School', 'Level', 'Overall Pass %', 'Math %', 'English %', 'Science %', 'Exam Part. %'];
      rows = [...activeSet]
        .sort((a, b) => (a.record?.overallPassRate ?? 0) - (b.record?.overallPassRate ?? 0))
        .map(({ school, record }) => [
          school.name,
          school.level,
          `${record?.overallPassRate.toFixed(1) ?? 0}%`,
          `${record?.mathScore.toFixed(1) ?? 0}%`,
          `${record?.englishScore.toFixed(1) ?? 0}%`,
          `${record?.scienceScore.toFixed(1) ?? 0}%`,
          `${record?.examParticipationRate.toFixed(1) ?? 0}%`,
        ]);
      findings = [
        `${belowPass.length} school(s) fell below the ${db.thresholds.minPassRatePct}% overall pass rate threshold.`,
        'Mathematics remains the lowest-scoring core subject across underperforming primary schools.',
      ];
      recommendations = [
        'Deploy division master trainers and structured numeracy/literacy remedial clinics.',
      ];
    } else if (reportType === 'infrastructure') {
      const criticalInfra = activeSet.filter(
        (s) =>
          s.record?.classroomCondition === 'Critical' ||
          s.record?.toiletCondition === 'Critical'
      );
      kpis = [
        { label: 'Critical Infra/WASH', value: `${criticalInfra.length} schools` },
        {
          label: 'Pending Inspections',
          value: String(cityAnalytics.kpis.inspectionsPending),
        },
        {
          label: 'No Water Access',
          value: `${activeSet.filter((s) => !s.record?.waterAvailable).length} schools`,
        },
        { label: 'Reporting Period', value: selectedTerm },
      ];
      headers = ['School', 'Division', 'Classrooms', 'Classroom Cond.', 'Toilets', 'Water', 'Safety Insp.'];
      rows = activeSet.map(({ school, record }) => [
        school.name,
        school.division.replace(' Division', ''),
        String(record?.classroomsCount ?? 0),
        record?.classroomCondition ?? '—',
        record?.toiletCondition ?? '—',
        record?.waterAvailable ? 'Yes' : 'No',
        record?.safetyInspectionStatus ?? '—',
      ]);
      findings = [
        `${criticalInfra.length} school(s) flagged critical classroom or sanitation conditions requiring rapid engineering remediation.`,
        `${cityAnalytics.kpis.inspectionsPending} school inspections remain pending, scheduled, or overdue.`,
      ];
      recommendations = [
        'Fast-track emergency WASH and structural safety inspections for critical-rated schools.',
      ];
    } else if (reportType === 'compliance') {
      kpis = [
        {
          label: 'Schools Reporting',
          value: `${cityAnalytics.kpis.schoolsReportingThisTerm}/${cityAnalytics.kpis.totalRegisteredSchools}`,
        },
        {
          label: 'Overdue / Incomplete',
          value: String(cityAnalytics.kpis.overdueSubmissions),
        },
        {
          label: 'Compliance Rate',
          value: `${Math.round((cityAnalytics.kpis.schoolsReportingThisTerm / Math.max(1, cityAnalytics.kpis.totalRegisteredSchools)) * 100)}%`,
        },
        { label: 'Reporting Period', value: selectedTerm },
      ];
      headers = ['School ID', 'School Name', 'Division', 'Submission Status', 'Completeness %', 'Submitted Date'];
      rows = activeSet.map(({ school, submission }) => [
        school.id,
        school.name,
        school.division.replace(' Division', ''),
        submission ? submission.status : 'Overdue / Missing',
        `${submission?.completenessPct ?? 0}%`,
        submission?.submittedAt ?? 'Not submitted',
      ]);
      findings = [
        `${cityAnalytics.kpis.overdueSubmissions} school(s) have missing, draft, or returned reports for ${selectedTerm}.`,
      ];
      recommendations = [
        'Issue automated division desk reminders for draft and returned submissions.',
      ];
    } else {
      // intervention report
      const flagged = activeSet.filter((s) => s.monitoringStatus !== 'Compliant');
      kpis = [
        {
          label: 'Critical Intervention',
          value: String(cityAnalytics.kpis.schoolsRequiringIntervention),
        },
        {
          label: 'Watchlist + Critical',
          value: String(flagged.length),
        },
        {
          label: 'Open Alerts',
          value: String(db.alerts.filter((a) => a.status !== 'Resolved').length),
        },
        {
          label: 'Active Interventions',
          value: String(db.interventions.filter((i) => i.status !== 'Completed').length),
        },
      ];
      headers = ['School', 'Division', 'Monitoring Status', 'Open Alerts', 'Attendance %', 'Pass Rate %'];
      rows = flagged.map(({ school, record, monitoringStatus, openAlertsCount }) => [
        school.name,
        school.division.replace(' Division', ''),
        monitoringStatus,
        String(openAlertsCount),
        `${record?.learnerAttendanceRate.toFixed(1) ?? 0}%`,
        `${record?.overallPassRate.toFixed(1) ?? 0}%`,
      ]);
      findings = [
        `${cityAnalytics.kpis.schoolsRequiringIntervention} schools are in Critical Intervention status across Kampala.`,
        `${flagged.length} schools are either Watchlist or Critical Intervention.`,
      ];
      recommendations = [
        'Assign responsible division officers and binding follow-up deadlines to every critical-status school.',
      ];
    }

    return { headers, rows, findings, recommendations, kpis };
  }, [
    reportType,
    cityAnalytics,
    divAnalytics,
    selectedSchoolId,
    selectedTerm,
    db.termRecords,
    db.thresholds,
    db.alerts,
    db.interventions,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Analytical Reporting Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate structured intelligence reports from live demonstration records with PDF and CSV export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              downloadCSV(
                `KSIS_${reportType}_${selectedTerm.replace(/\s+/g, '_')}.csv`,
                builtReport.headers,
                builtReport.rows
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() =>
              generateReportPDF(
                `KSIS_${reportType}_${selectedTerm.replace(/\s+/g, '_')}.pdf`,
                {
                  title: reportMeta.title,
                  subtitle: reportMeta.subtitle,
                  generatedBy: currentUser.name,
                  period: selectedTerm,
                  kpis: builtReport.kpis,
                  findings: builtReport.findings,
                  recommendations: builtReport.recommendations,
                  tableHeaders: builtReport.headers,
                  tableRows: builtReport.rows,
                }
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Report Configuration Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
        <label className="space-y-1 block text-xs">
          <span className="text-slate-600 font-medium">Report Template</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>

        {reportType === 'division' && (
          <label className="space-y-1 block text-xs">
            <span className="text-slate-600 font-medium">Kampala Division</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as KampalaDivision)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              {KAMPALA_DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}

        {reportType === 'school' && (
          <label className="space-y-1 block text-xs">
            <span className="text-slate-600 font-medium">Select School</span>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              {db.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1 block text-xs">
          <span className="text-slate-600 font-medium">Reporting Period</span>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as ReportingTerm)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
          >
            {VALID_TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Rendered Analytical Report Document */}
      <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-teal-700 tracking-wide">
              ANALYTICA TECHNOLOGIES · KAMPALA SCHOOLS INTELLIGENCE SYSTEM (KSIS)
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {reportMeta.title}
            </h2>
            <p className="text-xs text-slate-500">
              {reportMeta.subtitle} · Period: {selectedTerm} · Prepared by {currentUser.name}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-sm">
            Simulated Demonstration Data
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {builtReport.kpis.map((k) => (
            <div key={k.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Embedded Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              Division Benchmark ({selectedTerm})
            </h3>
            <DivisionPerformanceChart
              data={cityAnalytics.divisionPerformance.map((d) => ({
                label: d.shortName,
                avgPassRate: d.avgPassRate,
                avgAttendance: d.avgAttendance,
                schoolCount: d.schoolCount,
              }))}
            />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              3-Term Citywide Trajectory
            </h3>
            <TermLineChart
              data={cityAnalytics.termTrends.map((t) => ({
                label: t.term,
                value: t.avgPassRate,
                secondaryValue: t.avgAttendance,
              }))}
              primaryLabel="Avg Pass Rate (%)"
              secondaryLabel="Avg Attendance (%)"
              minY={45}
              maxY={95}
            />
          </div>
        </div>

        {/* Findings & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Key Analytical Findings
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
              {builtReport.findings.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Recommended Actions
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
              {builtReport.recommendations.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Supporting Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                {builtReport.headers.map((h) => (
                  <th key={h} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 tabular-nums">
              {builtReport.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-2 px-4 ${
                        cIdx === 0 ? 'font-medium text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
