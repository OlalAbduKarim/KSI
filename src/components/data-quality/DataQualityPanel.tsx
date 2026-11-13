import React, { useMemo, useState } from 'react';
import { useKSIS } from '../../store/ksisStore';
import { computeDataQualitySummary } from '../../utils/intelligenceEngine';

export const DataQualityPanel: React.FC = () => {
  const { db, setActiveView, setSelectedSchoolId } = useKSIS();
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const summary = useMemo(() => computeDataQualitySummary(db), [db]);

  const rows = useMemo(() => {
    if (typeFilter === 'All') return summary.anomalies;
    return summary.anomalies.filter((a) => a.type === typeFilter);
  }, [summary.anomalies, typeFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Data Quality & Assurance Panel
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated validation audit across {db.activeTerm} submissions · Completeness, missing mandatory indicators, unusual variances, and verification queue
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Dataset Completeness</div>
          <div className="text-2xl font-bold text-[#0B1E3D] font-mono tabular-nums mt-1">
            {summary.overallCompletenessPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 30 registered schools
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Missing Indicators</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {summary.missingIndicatorCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unfilled mandatory fields
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Returned / Invalid Reports</div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
            {summary.invalidOrReturnedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requires school correction
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Unusual Term Variances</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {summary.unusualChangesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ≥15% enrolment or ≥12pt shift
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs text-slate-500">Pending Verification</div>
          <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-1">
            {summary.pendingVerificationCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Submitted / Under Review
          </div>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-md w-fit">
        {[
          'All',
          'Missing Indicators',
          'Returned / Invalid',
          'Unusual Variance',
          'Pending Verification',
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setTypeFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              typeFilter === cat
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">School</th>
                <th className="py-2.5 px-4 font-semibold">Division</th>
                <th className="py-2.5 px-4 font-semibold">Quality Flag Type</th>
                <th className="py-2.5 px-4 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Diagnostic Detail</th>
                <th className="py-2.5 px-4 font-semibold text-right">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No quality anomalies detected for this filter.
                  </td>
                </tr>
              ) : (
                rows.map((item, idx) => (
                  <tr key={`${item.schoolId}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {item.schoolName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {item.division}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {item.type}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          item.severity === 'High' ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{item.detail}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (item.type === 'Pending Verification') {
                            setActiveView('submissions');
                          } else {
                            setSelectedSchoolId(item.schoolId);
                            setActiveView('directory');
                          }
                        }}
                        className="text-xs font-medium text-[#0B1E3D] hover:underline"
                      >
                        {item.type === 'Pending Verification' ? 'Review Submission' : 'Inspect School'}
                      </button>
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
