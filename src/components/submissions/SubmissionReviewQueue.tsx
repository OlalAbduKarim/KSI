import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, Search } from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import { SubmissionStatus } from '../../types/ksis';
import { SubmissionStatusLabel } from '../common/StatusIndicators';

export const SubmissionReviewQueue: React.FC = () => {
  const { db, currentUser, reviewSubmission, setSelectedSchoolId, setActiveView } =
    useKSIS();

  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const canReview =
    currentUser.role === 'System Administrator' ||
    currentUser.role === 'KCCA Education Officer' ||
    currentUser.role === 'Education Monitoring Officer';

  const activeTermSubs = useMemo(() => {
    const list = db.submissions
      .filter((s) => s.term === db.activeTerm)
      .map((sub) => ({
        sub,
        school: db.schools.find((sc) => sc.id === sub.schoolId),
      }))
      .filter((item) => {
        if (statusFilter !== 'All' && item.sub.status !== statusFilter) return false;
        if (
          search.trim() &&
          !item.school?.name.toLowerCase().includes(search.toLowerCase()) &&
          !item.sub.id.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      });

    const order: Record<SubmissionStatus, number> = {
      Submitted: 0,
      'Under Review': 1,
      'Returned for Correction': 2,
      Draft: 3,
      Approved: 4,
    };

    return list.sort((a, b) => order[a.sub.status] - order[b.sub.status]);
  }, [db.submissions, db.schools, db.activeTerm, statusFilter, search]);

  const selectedItem = activeTermSubs.find((i) => i.sub.id === selectedSubId) ?? activeTermSubs[0];

  const handleAction = (
    nextStatus: Extract<
      SubmissionStatus,
      'Under Review' | 'Approved' | 'Returned for Correction'
    >
  ) => {
    if (!selectedItem) return;
    if (nextStatus === 'Returned for Correction' && !reviewComment.trim()) {
      return;
    }
    reviewSubmission(
      selectedItem.sub.id,
      nextStatus,
      reviewComment.trim() ||
        (nextStatus === 'Approved'
          ? `Approved by ${currentUser.name} for ${selectedItem.sub.term}.`
          : `Moved to Under Review by ${currentUser.name}.`)
    );
    setReviewComment('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            School Submissions & Verification Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, validate, approve, or return {db.activeTerm} school submissions · Changes update central analytics immediately
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school or ID..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'All')}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            aria-label="Filter submissions by status"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted (Awaiting Review)</option>
            <option value="Under Review">Under Review</option>
            <option value="Returned for Correction">Returned for Correction</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(
          ['Submitted', 'Under Review', 'Approved', 'Returned for Correction', 'Draft'] as SubmissionStatus[]
        ).map((st) => {
          const count = db.submissions.filter(
            (s) => s.term === db.activeTerm && s.status === st
          ).length;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(statusFilter === st ? 'All' : st)}
              className={`text-left p-3.5 rounded-md border transition-colors ${
                statusFilter === st
                  ? 'border-[#0B1E3D] bg-slate-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] text-slate-500">{st}</div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {count}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Queue Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">School</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Completeness</th>
                  <th className="py-2.5 px-4 font-semibold">Submitted</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeTermSubs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No submissions match this filter.
                    </td>
                  </tr>
                ) : (
                  activeTermSubs.map(({ sub, school }) => {
                    const isSelected = selectedItem?.sub.id === sub.id;
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedSubId(sub.id)}
                        className={`cursor-pointer ${
                          isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-900">
                            {school?.name ?? sub.schoolId}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {school?.division} · {sub.id}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <SubmissionStatusLabel status={sub.status} />
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {sub.completenessPct}%
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {sub.submittedAt || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubId(sub.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0B1E3D] hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Review Pane */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5">
          {!selectedItem ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Select a submission from the queue to review its indicators.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedItem.school?.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedItem.sub.id} · {selectedItem.sub.term} · Submitted by{' '}
                    {selectedItem.sub.submittedBy}
                  </p>
                </div>
                <SubmissionStatusLabel status={selectedItem.sub.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Total Enrolment</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {selectedItem.sub.payload.totalEnrolment || '—'} (M:{' '}
                    {selectedItem.sub.payload.maleEnrolment || '—'} / F:{' '}
                    {selectedItem.sub.payload.femaleEnrolment || '—'})
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Attendance (L / T)</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {selectedItem.sub.payload.learnerAttendanceRate || '—'}% /{' '}
                    {selectedItem.sub.payload.teacherAttendanceRate || '—'}%
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Overall Pass Rate</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {selectedItem.sub.payload.overallPassRate || '—'}%
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Teachers / Classrooms</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {selectedItem.sub.payload.totalTeachers || '—'} teachers ·{' '}
                    {selectedItem.sub.payload.classroomsCount || '—'} rooms
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Infrastructure</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    Classrooms: {selectedItem.sub.payload.classroomCondition || '—'} · Toilets:{' '}
                    {selectedItem.sub.payload.toiletCondition || '—'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                  <div className="text-slate-500">Data Completeness</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {selectedItem.sub.completenessPct}%
                  </div>
                </div>
              </div>

              {selectedItem.sub.missingIndicators.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900">
                  <span className="font-semibold">Missing Mandatory Indicators:</span>{' '}
                  {selectedItem.sub.missingIndicators.join(', ')}
                </div>
              )}

              {selectedItem.sub.validationWarnings.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm text-xs text-blue-900">
                  <span className="font-semibold">Validation Advisories:</span>{' '}
                  {selectedItem.sub.validationWarnings.join(' ')}
                </div>
              )}

              {selectedItem.sub.payload.operationalChallenges && (
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Operational Challenges:</span>{' '}
                  {selectedItem.sub.payload.operationalChallenges}
                </div>
              )}

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-sm border border-slate-200">
                <span className="font-semibold text-slate-800">Audit Trail / Comments:</span>{' '}
                {selectedItem.sub.reviewerComments || 'No review comments recorded.'}
              </div>

              {canReview && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-medium text-slate-700">
                    Reviewer Decision Comments
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Enter verification note or required correction details..."
                      className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1E3D]"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAction('Approved')}
                      disabled={selectedItem.sub.status === 'Draft'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40 rounded-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Submission
                    </button>
                    <button
                      onClick={() => handleAction('Under Review')}
                      disabled={selectedItem.sub.status === 'Draft'}
                      className="px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-md"
                    >
                      Mark Under Review
                    </button>
                    <button
                      onClick={() => handleAction('Returned for Correction')}
                      disabled={!reviewComment.trim() || selectedItem.sub.status === 'Draft'}
                      title={
                        !reviewComment.trim()
                          ? 'Enter correction instructions above to return'
                          : 'Return to school administrator'
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 disabled:opacity-40 rounded-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Return for Correction
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (selectedItem.school) {
                      setSelectedSchoolId(selectedItem.school.id);
                      setActiveView('directory');
                    }
                  }}
                  className="text-xs font-medium text-[#0B1E3D] hover:underline"
                >
                  Open full 9-tab School Profile →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
