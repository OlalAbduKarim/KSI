import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Lock,
  Save,
  Send,
} from 'lucide-react';
import { useKSIS } from '../../store/ksisStore';
import {
  ClassroomCondition,
  LearningMaterialLevel,
  ReportingTerm,
  SafetyInspectionStatus,
  SafeguardingReferralStatus,
  SanitationRating,
  SubmissionPayload,
  ToiletCondition,
} from '../../types/ksis';
import {
  getPreviousTerm,
  getSchoolTermRecord,
  payloadFromTermRecord,
  VALID_TERMS,
  validateSubmissionPayload,
} from '../../utils/intelligenceEngine';
import { SubmissionStatusLabel } from '../common/StatusIndicators';
import { SchoolProfileView } from '../schools/SchoolProfileView';

const EMPTY_PAYLOAD: SubmissionPayload = {
  overallPassRate: '',
  mathScore: '',
  englishScore: '',
  scienceScore: '',
  examParticipationRate: '',
  totalEnrolment: '',
  maleEnrolment: '',
  femaleEnrolment: '',
  newAdmissions: '',
  withdrawals: '',
  learnerAttendanceRate: '',
  teacherAttendanceRate: '',
  chronicAbsenteeismRate: '',
  totalTeachers: '',
  qualifiedTeachersPct: '',
  teacherVacancies: '',
  staffTurnoverCount: '',
  classroomsCount: '',
  classroomCondition: '',
  deskAvailabilityPct: '',
  toiletCondition: '',
  waterAvailable: true,
  electricityAvailable: true,
  accessibilityFacilities: false,
  firstAidAvailable: true,
  sanitationRating: '',
  safetyInspectionStatus: '',
  safetyIncidentsCount: 0,
  safeguardingReferralStatus: 'None Required',
  feeCollectionRate: '',
  learningMaterialAvailability: '',
  resourceConstraints: '',
  operationalChallenges: '',
};

export const SchoolPortal: React.FC = () => {
  const {
    db,
    currentUser,
    portalSchoolId,
    setPortalSchoolId,
    switchToSchoolAdmin,
    saveSubmissionDraft,
    submitSchoolReport,
    setActiveView,
  } = useKSIS();

  const isLockedToOwnSchool = currentUser.role === 'School Administrator';
  const activeSchoolId = isLockedToOwnSchool
    ? currentUser.assignedSchoolId || portalSchoolId
    : portalSchoolId;

  const school = db.schools.find((s) => s.id === activeSchoolId) ?? db.schools[0];

  const [portalTab, setPortalTab] = useState<'form' | 'history' | 'profile'>('form');
  const [selectedTerm, setSelectedTerm] = useState<ReportingTerm>(db.activeTerm);
  const [payload, setPayload] = useState<SubmissionPayload>(EMPTY_PAYLOAD);
  const [reviewStep, setReviewStep] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Sync form payload when school or term changes
  useEffect(() => {
    const existingSub = db.submissions.find(
      (s) => s.schoolId === school.id && s.term === selectedTerm
    );
    if (existingSub) {
      setPayload(existingSub.payload);
    } else {
      const existingRec = getSchoolTermRecord(db.termRecords, school.id, selectedTerm);
      if (existingRec) {
        setPayload(payloadFromTermRecord(existingRec));
      } else {
        setPayload(EMPTY_PAYLOAD);
      }
    }
    setReviewStep(false);
    setBannerMessage(null);
  }, [school.id, selectedTerm, db.submissions, db.termRecords]);

  const currentSub = db.submissions.find(
    (s) => s.schoolId === school.id && s.term === selectedTerm
  );

  const schoolSubmissions = useMemo(
    () => db.submissions.filter((s) => s.schoolId === school.id),
    [db.submissions, school.id]
  );

  const prevTerm = getPreviousTerm(selectedTerm);
  const prevRecord = prevTerm
    ? getSchoolTermRecord(db.termRecords, school.id, prevTerm)
    : undefined;

  const validation = useMemo(
    () => validateSubmissionPayload(payload, selectedTerm, prevRecord),
    [payload, selectedTerm, prevRecord]
  );

  const updateNum = (field: keyof SubmissionPayload, raw: string) => {
    setPayload((p) => ({
      ...p,
      [field]: raw === '' ? '' : Number(raw),
    }));
  };

  const handleSaveDraft = () => {
    saveSubmissionDraft(school.id, selectedTerm, payload);
    setBannerMessage({
      type: 'info',
      text: `Draft saved for ${school.name} (${selectedTerm}). Completeness: ${validation.completenessPct}%.`,
    });
  };

  const handleSubmitFinal = () => {
    const res = submitSchoolReport(school.id, selectedTerm, payload);
    if (!res.ok) {
      setBannerMessage({
        type: 'error',
        text: `Cannot submit report: ${res.errors[0]}`,
      });
      setReviewStep(false);
      return;
    }
    setReviewStep(false);
    setBannerMessage({
      type: 'success',
      text: `Report ${res.submission?.id} submitted to KCCA Central Intelligence Office. School indicators and citywide analytics have been updated immediately.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Portal Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold text-teal-700 tracking-wide">
              SCHOOL DATA SUBMISSION PORTAL · INSTITUTIONAL REPORTING ENVIRONMENT
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {school.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-mono text-slate-700">{school.id}</span>
              <span aria-hidden="true">·</span>
              <span>{school.division}</span>
              <span aria-hidden="true">·</span>
              <span>{school.ownership}</span>
              <span aria-hidden="true">·</span>
              <span>{school.level}</span>
              <span aria-hidden="true">·</span>
              <span>Reporting Deadline: {school.reportingDeadline}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLockedToOwnSchool ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Signed in as School Administrator (Own School Access Only)
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={school.id}
                  onChange={(e) => setPortalSchoolId(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-medium max-w-xs"
                  aria-label="Select school in submission portal"
                >
                  {db.schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.division.replace(' Division', '')})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => switchToSchoolAdmin(school.id)}
                  className="px-3 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md whitespace-nowrap"
                >
                  Log in as This School&apos;s Admin
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Incomplete / Feedback Banner */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-600">
              Active Term Status ({selectedTerm}):{' '}
              <SubmissionStatusLabel
                status={currentSub ? currentSub.status : 'Missing'}
              />
            </span>
            <span className="text-slate-600 font-mono tabular-nums">
              Form Completeness: <strong>{validation.completenessPct}%</strong>
            </span>
            {validation.missingIndicators.length > 0 && (
              <span className="text-amber-700 font-medium">
                {validation.missingIndicators.length} mandatory indicator(s) incomplete
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setPortalTab('form')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap ${
                portalTab === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term Data Entry
            </button>
            <button
              onClick={() => setPortalTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap ${
                portalTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Submission History ({schoolSubmissions.length})
            </button>
            <button
              onClick={() => setPortalTab('profile')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap ${
                portalTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Our School Profile
            </button>
          </div>
        </div>
      </div>

      {/* Reviewer Comments Alert if Returned or Reviewed */}
      {currentSub && currentSub.status === 'Returned for Correction' && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-semibold">
              Returned by KCCA Verification Desk for Correction
            </div>
            <p>{currentSub.reviewerComments}</p>
          </div>
        </div>
      )}

      {/* Confirmation / Error Notification */}
      {bannerMessage && (
        <div
          className={`border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : bannerMessage.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{bannerMessage.text}</span>
          </div>
          {bannerMessage.type === 'success' && !isLockedToOwnSchool && (
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-3 py-1.5 text-xs font-medium bg-[#0B1E3D] text-white rounded-sm whitespace-nowrap shrink-0"
            >
              Return to Central Dashboard →
            </button>
          )}
        </div>
      )}

      {/* TAB 1: DATA ENTRY FORM */}
      {portalTab === 'form' && (
        <div className="space-y-5">
          {/* Period & Completeness Bar */}
          <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">
                Reporting Period:
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as ReportingTerm)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                {VALID_TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-64">
              <div className="flex-1 h-2 bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    validation.completenessPct === 100
                      ? 'bg-teal-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${validation.completenessPct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                {validation.completenessPct}%
              </span>
            </div>
          </div>

          {/* Validation Summary */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2 text-xs">
              {validation.errors.map((err, i) => (
                <div key={i} className="text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div key={i} className="text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Advisory: {warn}</span>
                </div>
              ))}
            </div>
          )}

          {!reviewStep ? (
            <div className="space-y-5">
              {/* Section B: Enrolment */}
              <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  1. Learner Enrolment Indicators
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Total Enrolment *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.totalEnrolment}
                      onChange={(e) => updateNum('totalEnrolment', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Male Enrolment *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.maleEnrolment}
                      onChange={(e) => updateNum('maleEnrolment', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Female Enrolment *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.femaleEnrolment}
                      onChange={(e) => updateNum('femaleEnrolment', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">New Admissions *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.newAdmissions}
                      onChange={(e) => updateNum('newAdmissions', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Withdrawals *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.withdrawals}
                      onChange={(e) => updateNum('withdrawals', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Section C & A: Attendance & Academic Performance */}
              <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  2. Attendance & Academic Performance
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Learner Attendance (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.learnerAttendanceRate}
                      onChange={(e) => updateNum('learnerAttendanceRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Teacher Attendance (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.teacherAttendanceRate}
                      onChange={(e) => updateNum('teacherAttendanceRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Chronic Absenteeism (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.chronicAbsenteeismRate}
                      onChange={(e) => updateNum('chronicAbsenteeismRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Overall Pass Rate (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.overallPassRate}
                      onChange={(e) => updateNum('overallPassRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Mathematics (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.mathScore}
                      onChange={(e) => updateNum('mathScore', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">English (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.englishScore}
                      onChange={(e) => updateNum('englishScore', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Science (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.scienceScore}
                      onChange={(e) => updateNum('scienceScore', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Exam Participation (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.examParticipationRate}
                      onChange={(e) => updateNum('examParticipationRate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Section D & E: Staffing & Infrastructure */}
              <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  3. Staffing & Infrastructure Conditions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Total Teaching Staff *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.totalTeachers}
                      onChange={(e) => updateNum('totalTeachers', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Qualified Teachers (%) *</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={payload.qualifiedTeachersPct}
                      onChange={(e) => updateNum('qualifiedTeachersPct', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Teacher Vacancies *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.teacherVacancies}
                      onChange={(e) => updateNum('teacherVacancies', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Staff Turnover</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.staffTurnoverCount}
                      onChange={(e) => updateNum('staffTurnoverCount', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Number of Classrooms *</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.classroomsCount}
                      onChange={(e) => updateNum('classroomsCount', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Classroom Condition *</span>
                    <select
                      value={payload.classroomCondition}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          classroomCondition: e.target.value as ClassroomCondition | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="">Select condition</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Desk Availability (%) *</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={payload.deskAvailabilityPct}
                      onChange={(e) => updateNum('deskAvailabilityPct', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Toilet Facilities *</span>
                    <select
                      value={payload.toiletCondition}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          toiletCondition: e.target.value as ToiletCondition | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="">Select condition</option>
                      <option value="Adequate">Adequate</option>
                      <option value="Inadequate">Inadequate</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-6 pt-2 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payload.waterAvailable}
                      onChange={(e) =>
                        setPayload({ ...payload, waterAvailable: e.target.checked })
                      }
                    />
                    Clean Water Available
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payload.electricityAvailable}
                      onChange={(e) =>
                        setPayload({ ...payload, electricityAvailable: e.target.checked })
                      }
                    />
                    Electricity Supply Operational
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payload.accessibilityFacilities}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          accessibilityFacilities: e.target.checked,
                        })
                      }
                    />
                    Accessibility Facilities Present
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payload.firstAidAvailable}
                      onChange={(e) =>
                        setPayload({ ...payload, firstAidAvailable: e.target.checked })
                      }
                    />
                    First Aid Kit Stocked
                  </label>
                </div>
              </div>

              {/* Section F & G: Safety, Safeguarding & Operational Challenges */}
              <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  4. Health, Safety & Operational Challenges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Sanitation Rating *</span>
                    <select
                      value={payload.sanitationRating}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          sanitationRating: e.target.value as SanitationRating | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="">Select rating</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Safety Inspection Status *</span>
                    <select
                      value={payload.safetyInspectionStatus}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          safetyInspectionStatus: e.target
                            .value as SafetyInspectionStatus | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="">Select status</option>
                      <option value="Passed">Passed</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Learning Materials *</span>
                    <select
                      value={payload.learningMaterialAvailability}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          learningMaterialAvailability: e.target
                            .value as LearningMaterialLevel | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="">Select availability</option>
                      <option value="Adequate">Adequate</option>
                      <option value="Partial">Partial</option>
                      <option value="Scarce">Scarce</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Safety Incidents Count (Aggregated)</span>
                    <input
                      type="number"
                      min={0}
                      value={payload.safetyIncidentsCount}
                      onChange={(e) => updateNum('safetyIncidentsCount', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Safeguarding Referral Status</span>
                    <select
                      value={payload.safeguardingReferralStatus}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          safeguardingReferralStatus: e.target
                            .value as SafeguardingReferralStatus | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="None Required">None Required</option>
                      <option value="Under Review - Restricted">
                        Under Review - Restricted
                      </option>
                      <option value="Referred - Restricted">Referred - Restricted</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">
                      Fee Collection Rate % (Optional · Restricted)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={payload.feeCollectionRate}
                      onChange={(e) => updateNum('feeCollectionRate', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Resource Constraints</span>
                    <textarea
                      rows={2}
                      value={payload.resourceConstraints}
                      onChange={(e) =>
                        setPayload({ ...payload, resourceConstraints: e.target.value })
                      }
                      placeholder="Describe textbook, furniture, or capitation constraints..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-slate-600">Operational Challenges</span>
                    <textarea
                      rows={2}
                      value={payload.operationalChallenges}
                      onChange={(e) =>
                        setPayload({ ...payload, operationalChallenges: e.target.value })
                      }
                      placeholder="Describe key challenges affecting attendance, learning, or safety..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={!validation.isValidForSubmit}
                  onClick={() => setReviewStep(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] disabled:opacity-40 rounded-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Review Before Submission
                </button>
              </div>
            </div>
          ) : (
            /* Review Confirmation Step */
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <ClipboardList className="w-4 h-4 text-[#0B1E3D]" />
                <h2 className="text-base font-bold text-slate-900">
                  Review Submission Summary ({selectedTerm})
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-500">Total Enrolment</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {payload.totalEnrolment} (M: {payload.maleEnrolment} / F:{' '}
                    {payload.femaleEnrolment})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Learner / Teacher Attendance</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {payload.learnerAttendanceRate}% / {payload.teacherAttendanceRate}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Overall Pass Rate</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {payload.overallPassRate}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Teaching Staff / Classrooms</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {payload.totalTeachers} teachers · {payload.classroomsCount} rooms
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Classroom / Toilet Condition</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {payload.classroomCondition} / {payload.toiletCondition}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Validation Completeness</div>
                  <div className="font-mono font-bold text-teal-700 mt-0.5">
                    {validation.completenessPct}% Verified
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReviewStep(false)}
                  className="px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirm & Submit Report to KCCA
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSION HISTORY */}
      {portalTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Submission ID</th>
                <th className="py-2.5 px-4 font-semibold">Reporting Period</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Completeness</th>
                <th className="py-2.5 px-4 font-semibold">Submitted Date</th>
                <th className="py-2.5 px-4 font-semibold">KCCA Review Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schoolSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-700">{sub.id}</td>
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
                  <td className="py-2.5 px-4 text-slate-600">{sub.reviewerComments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: OWN SCHOOL PROFILE */}
      {portalTab === 'profile' && (
        <SchoolProfileView schoolId={school.id} embeddedInPortal />
      )}
    </div>
  );
};
