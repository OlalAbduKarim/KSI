import React, { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  EducationLevel,
  KampalaDivision,
  ReportingTerm,
  SchoolOwnership,
} from '../../types/ksis';
import {
  computeDashboardAnalytics,
  KAMPALA_DIVISIONS,
  VALID_TERMS,
} from '../../utils/intelligenceEngine';
import {
  DivisionPerformanceChart,
  HorizontalDistributionChart,
  TermLineChart,
} from '../charts/Charts';
import {
  MonitoringStatusLabel,
  SeverityLabel,
  SubmissionStatusLabel,
} from '../common/StatusIndicators';
import { SchoolProfileView } from '../schools/SchoolProfileView';

export const ExecutiveDashboard: React.FC = () => {
  const {
    db,
    selectedSchoolId,
    setSelectedSchoolId,
    setActiveView,
    markDemoStep,
  } = useKSIS();

  const [division, setDivision] = useState<KampalaDivision | 'All'>('All');
  const [ownership, setOwnership] = useState<SchoolOwnership | 'All'>('All');
  const [level, setLevel] = useState<EducationLevel | 'All'>('All');
  const [term, setTerm] = useState<ReportingTerm>(db.activeTerm);
  const [search, setSearch] = useState('');

  const analytics = useMemo(
    () =>
      computeDashboardAnalytics(db, {
        division,
        ownership,
        level,
        term,
        search,
      }),
    [db, division, ownership, level, term, search]
  );

  if (selectedSchoolId) {
    return (
      <SchoolProfileView
        schoolId={selectedSchoolId}
        onBack={() => setSelectedSchoolId(null)}
      />
    );
  }

  const { kpis } = analytics;
  const openAlerts = db.alerts.filter(
    (a) =>
      a.status !== 'Resolved' &&
      (division === 'All' || a.division === division)
  );
  const prioritySchools = analytics.schoolSummaries
    .filter((s) => s.monitoringStatus !== 'Compliant')
    .sort((a, b) => {
      if (a.monitoringStatus === b.monitoringStatus) {
        return (a.record?.overallPassRate ?? 100) - (b.record?.overallPassRate ?? 100);
      }
      return a.monitoringStatus === 'Critical Intervention' ? -1 : 1;
    });

  return (
    <div className="space-y-6">
      {/* Page Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Central Intelligence Executive Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Citywide performance telemetry across Kampala&apos;s five administrative divisions · Simulated Demonstration Dataset
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter schools..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md w-44 focus:outline-none focus:border-[#0B1E3D]"
            />
          </div>
          <select
            value={division}
            onChange={(e) => {
              const val = e.target.value as KampalaDivision | 'All';
              setDivision(val);
              if (val !== 'All') markDemoStep('filteredDivision');
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            aria-label="Division filter"
          >
            <option value="All">All Divisions</option>
            {KAMPALA_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as SchoolOwnership | 'All')}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            aria-label="Ownership filter"
          >
            <option value="All">All Ownership</option>
            <option value="Government">Government</option>
            <option value="Private">Private</option>
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as EducationLevel | 'All')}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            aria-label="Level filter"
          >
            <option value="All">All Levels</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
          </select>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as ReportingTerm)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-medium"
            aria-label="Reporting period filter"
          >
            {VALID_TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8 Derived KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Total Registered Schools</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {kpis.totalRegisteredSchools}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {division === 'All' ? 'Across 5 Kampala divisions' : division}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Schools Reporting ({term})</div>
          <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-1">
            {kpis.schoolsReportingThisTerm}
            <span className="text-sm font-normal text-slate-400">
              /{kpis.totalRegisteredSchools}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {kpis.totalRegisteredSchools > 0
              ? Math.round(
                  (kpis.schoolsReportingThisTerm / kpis.totalRegisteredSchools) * 100
                )
              : 0}
            % submission compliance
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Overdue / Incomplete Reports</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              kpis.overdueSubmissions > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {kpis.overdueSubmissions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Draft, returned, or missing
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Total Learner Enrolment</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {kpis.totalLearnerEnrolment.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Active term institutional total
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Average Learner Attendance</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {kpis.avgLearnerAttendance.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Target floor: {db.thresholds.minAttendancePct}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Average Academic Pass Rate</div>
          <div className="text-2xl font-bold text-[#0B1E3D] font-mono tabular-nums mt-1">
            {kpis.avgAcademicPassRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Target floor: {db.thresholds.minPassRatePct}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Schools Requiring Intervention</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              kpis.schoolsRequiringIntervention > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {kpis.schoolsRequiringIntervention}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Critical monitoring status
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Inspections Pending / Overdue</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              kpis.inspectionsPending > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {kpis.inspectionsPending}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Scheduled, pending, or overdue
          </div>
        </div>
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                School Performance by Kampala Division
              </h2>
              <p className="text-xs text-slate-500">
                Average pass rate and learner attendance ({term})
              </p>
            </div>
          </div>
          <DivisionPerformanceChart
            data={analytics.divisionPerformance.map((d) => ({
              label: d.shortName,
              avgPassRate: d.avgPassRate,
              avgAttendance: d.avgAttendance,
              schoolCount: d.schoolCount,
            }))}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Schools by Performance Category
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of overall pass rate tiers ({term})
            </p>
            <HorizontalDistributionChart
              items={analytics.performanceCategories}
              total={kpis.totalRegisteredSchools}
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Infrastructure Condition Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Classroom structural & operational readiness
            </p>
            <HorizontalDistributionChart
              items={analytics.infrastructureDistribution.map((i) => ({
                label: i.condition,
                count: i.count,
                color: i.color,
              }))}
              total={kpis.totalRegisteredSchools}
            />
          </div>
        </div>
      </div>

      {/* 4 Trend Charts over 3 Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Academic Performance Trends (3 Terms)
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Mean citywide / filtered pass rate progression
          </p>
          <TermLineChart
            data={analytics.termTrends.map((t) => ({
              label: t.term,
              value: t.avgPassRate,
            }))}
            primaryLabel="Average Pass Rate (%)"
            primaryColor="#0B1E3D"
            minY={45}
            maxY={90}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Attendance Trends (3 Terms)
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Mean learner attendance rate across reporting periods
          </p>
          <TermLineChart
            data={analytics.termTrends.map((t) => ({
              label: t.term,
              value: t.avgAttendance,
            }))}
            primaryLabel="Average Attendance (%)"
            primaryColor="#0D9488"
            minY={60}
            maxY={95}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Learner Enrolment Trends (3 Terms)
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Aggregate enrolled learners across filtered institutions
          </p>
          <TermLineChart
            data={analytics.termTrends.map((t) => ({
              label: t.term,
              value: t.totalEnrolment,
            }))}
            unit=""
            primaryLabel="Total Enrolment"
            primaryColor="#1D4ED8"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Reporting Compliance Over Time
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Percentage of schools submitting validated reports on schedule
          </p>
          <TermLineChart
            data={analytics.termTrends.map((t) => ({
              label: t.term,
              value: t.reportingCompliancePct,
            }))}
            primaryLabel="Reporting Compliance (%)"
            primaryColor="#0284C7"
            minY={40}
            maxY={105}
          />
        </div>
      </div>

      {/* Actionable Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Schools Requiring Attention ({prioritySchools.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click any school to inspect 3-term history, alerts, and interventions
              </p>
            </div>
            <button
              onClick={() => setActiveView('directory')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0B1E3D] hover:underline whitespace-nowrap"
            >
              Full Directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">School</th>
                  <th className="py-2.5 px-4 font-semibold">Division</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Attendance</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Pass Rate</th>
                  <th className="py-2.5 px-4 font-semibold">Report</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {prioritySchools.slice(0, 8).map(
                  ({ school, record, submission, monitoringStatus }) => (
                    <tr
                      key={school.id}
                      onClick={() => {
                        setSelectedSchoolId(school.id);
                        markDemoStep('openedUnderperformingSchool');
                      }}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-2.5 px-4 font-medium text-[#0B1E3D] hover:underline">
                        {school.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {school.division.replace(' Division', '')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {record ? `${record.learnerAttendanceRate.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {record ? `${record.overallPassRate.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <SubmissionStatusLabel
                          status={submission ? submission.status : 'Missing'}
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <MonitoringStatusLabel status={monitoringStatus} />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Active Intelligence Alerts ({openAlerts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Rule-engine & verified inspection flags
              </p>
            </div>
            <button
              onClick={() => setActiveView('alerts')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0B1E3D] hover:underline whitespace-nowrap"
            >
              Alert Engine <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {openAlerts.slice(0, 6).map((alert) => {
              const sch = db.schools.find((s) => s.id === alert.schoolId);
              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    setSelectedSchoolId(alert.schoolId);
                    markDemoStep('viewedAlert');
                  }}
                  className="p-4 hover:bg-slate-50 cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {sch?.name ?? alert.schoolId}
                    </span>
                    <SeverityLabel severity={alert.severity} />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{alert.issue}</p>
                  <div className="text-[11px] text-slate-400">
                    {alert.source} · {alert.division}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
