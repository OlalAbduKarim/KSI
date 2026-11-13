import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  EducationLevel,
  KampalaDivision,
  MonitoringStatus,
  ReportingTerm,
  SchoolOwnership,
} from '../../types/ksis';
import {
  computeDashboardAnalytics,
  KAMPALA_DIVISIONS,
  VALID_TERMS,
} from '../../utils/intelligenceEngine';
import {
  MonitoringStatusLabel,
  SubmissionStatusLabel,
} from '../common/StatusIndicators';
import { SchoolProfileView } from './SchoolProfileView';

type SortKey = 'name' | 'enrolment' | 'attendance' | 'passRate' | 'status';

export const SchoolDirectory: React.FC = () => {
  const {
    db,
    selectedSchoolId,
    setSelectedSchoolId,
    markDemoStep,
  } = useKSIS();

  const [division, setDivision] = useState<KampalaDivision | 'All'>('All');
  const [ownership, setOwnership] = useState<SchoolOwnership | 'All'>('All');
  const [level, setLevel] = useState<EducationLevel | 'All'>('All');
  const [term, setTerm] = useState<ReportingTerm>(db.activeTerm);
  const [statusFilter, setStatusFilter] = useState<MonitoringStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortAsc, setSortAsc] = useState(true);

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

  const rows = useMemo(() => {
    const filtered =
      statusFilter === 'All'
        ? analytics.schoolSummaries
        : analytics.schoolSummaries.filter(
            (s) => s.monitoringStatus === statusFilter
          );

    const statusOrder: Record<MonitoringStatus, number> = {
      'Critical Intervention': 0,
      Watchlist: 1,
      Compliant: 2,
    };

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.school.name.localeCompare(b.school.name);
      } else if (sortKey === 'enrolment') {
        cmp = (a.record?.totalEnrolment ?? 0) - (b.record?.totalEnrolment ?? 0);
      } else if (sortKey === 'attendance') {
        cmp =
          (a.record?.learnerAttendanceRate ?? 0) -
          (b.record?.learnerAttendanceRate ?? 0);
      } else if (sortKey === 'passRate') {
        cmp = (a.record?.overallPassRate ?? 0) - (b.record?.overallPassRate ?? 0);
      } else {
        cmp =
          statusOrder[a.monitoringStatus] - statusOrder[b.monitoringStatus];
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [analytics.schoolSummaries, statusFilter, sortKey, sortAsc]);

  if (selectedSchoolId) {
    return (
      <SchoolProfileView
        schoolId={selectedSchoolId}
        onBack={() => setSelectedSchoolId(null)}
      />
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === 'name' || key === 'status');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kampala School Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            30 simulated demonstration institutions across 5 administrative divisions · Click any school to inspect its 9-tab intelligence profile
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 tabular-nums">
          Showing {rows.length} of {db.schools.length} schools
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-md p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, ID, or parish..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1E3D]"
          />
        </div>
        <select
          value={division}
          onChange={(e) => {
            const val = e.target.value as KampalaDivision | 'All';
            setDivision(val);
            if (val !== 'All') markDemoStep('filteredDivision');
          }}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
          aria-label="Filter by division"
        >
          <option value="All">All 5 Divisions</option>
          {KAMPALA_DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={ownership}
          onChange={(e) => setOwnership(e.target.value as SchoolOwnership | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
          aria-label="Filter by ownership"
        >
          <option value="All">All Ownerships</option>
          <option value="Government">Government</option>
          <option value="Private">Private</option>
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as EducationLevel | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
          aria-label="Filter by level"
        >
          <option value="All">All Levels</option>
          <option value="Primary">Primary</option>
          <option value="Secondary">Secondary</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MonitoringStatus | 'All')}
          className="px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
          aria-label="Filter by monitoring status"
        >
          <option value="All">All Monitoring Statuses</option>
          <option value="Critical Intervention">Critical Intervention</option>
          <option value="Watchlist">Watchlist</option>
          <option value="Compliant">Compliant</option>
        </select>
      </div>

      {/* Term Selector strip */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-md">
          {VALID_TERMS.map((t) => (
            <button
              key={t}
              onClick={() => setTerm(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                term === t
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(division !== 'All' ||
          ownership !== 'All' ||
          level !== 'All' ||
          statusFilter !== 'All' ||
          search) && (
          <button
            onClick={() => {
              setDivision('All');
              setOwnership('All');
              setLevel('All');
              setStatusFilter('All');
              setSearch('');
            }}
            className="text-xs font-medium text-teal-700 hover:text-teal-900"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">School ID</th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    School Name <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Division & Parish</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    onClick={() => toggleSort('enrolment')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Enrolment <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Teachers</th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    onClick={() => toggleSort('attendance')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Attendance <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    onClick={() => toggleSort('passRate')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Pass Rate <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Infrastructure</th>
                <th className="py-3 px-4 font-semibold">Compliance</th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Monitoring Status <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    No schools match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map(({ school, record, submission, monitoringStatus }) => (
                  <tr
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      if (monitoringStatus !== 'Compliant') {
                        markDemoStep('openedUnderperformingSchool');
                      }
                    }}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {school.id}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#0B1E3D] hover:underline">
                      {school.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {school.division.replace(' Division', '')} · {school.parish}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {school.ownership} · {school.level}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {record?.totalEnrolment.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {record?.totalTeachers ?? '—'}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium ${
                        record && record.learnerAttendanceRate < db.thresholds.minAttendancePct
                          ? 'text-red-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {record ? `${record.learnerAttendanceRate.toFixed(1)}%` : '—'}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium ${
                        record && record.overallPassRate < db.thresholds.minPassRatePct
                          ? 'text-red-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {record ? `${record.overallPassRate.toFixed(1)}%` : '—'}
                    </td>
                    <td
                      className={`py-2.5 px-4 whitespace-nowrap ${
                        record?.classroomCondition === 'Critical'
                          ? 'text-red-700 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      {record?.classroomCondition ?? '—'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
