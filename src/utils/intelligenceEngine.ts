import {
  AlertRecord,
  AlertSeverity,
  EducationLevel,
  InspectionRecord,
  InterventionRecord,
  KampalaDivision,
  KSISDatabase,
  MonitoringStatus,
  ReportingTerm,
  School,
  SchoolOwnership,
  SchoolSubmission,
  SubmissionPayload,
  SystemThresholds,
  TermRecord,
} from '../types/ksis';

export const VALID_TERMS: ReportingTerm[] = ['2025 Term 3', '2026 Term 1', '2026 Term 2'];

export const KAMPALA_DIVISIONS: KampalaDivision[] = [
  'Central Division',
  'Kawempe Division',
  'Makindye Division',
  'Nakawa Division',
  'Rubaga Division',
];

export interface DashboardFilters {
  division: KampalaDivision | 'All';
  ownership: SchoolOwnership | 'All';
  level: EducationLevel | 'All';
  term: ReportingTerm;
  search: string;
}

export interface ValidationResult {
  isValidForSubmit: boolean;
  errors: string[];
  warnings: string[];
  completenessPct: number;
  missingIndicators: string[];
}

const MANDATORY_FIELDS: { key: keyof SubmissionPayload; label: string }[] = [
  { key: 'totalEnrolment', label: 'Total learner enrolment' },
  { key: 'maleEnrolment', label: 'Male enrolment' },
  { key: 'femaleEnrolment', label: 'Female enrolment' },
  { key: 'newAdmissions', label: 'New admissions' },
  { key: 'withdrawals', label: 'Learner withdrawals' },
  { key: 'learnerAttendanceRate', label: 'Average learner attendance (%)' },
  { key: 'teacherAttendanceRate', label: 'Teacher attendance (%)' },
  { key: 'chronicAbsenteeismRate', label: 'Chronic absenteeism (%)' },
  { key: 'overallPassRate', label: 'Overall academic pass rate (%)' },
  { key: 'mathScore', label: 'Mathematics performance (%)' },
  { key: 'englishScore', label: 'English performance (%)' },
  { key: 'scienceScore', label: 'Science performance (%)' },
  { key: 'examParticipationRate', label: 'Examination participation (%)' },
  { key: 'totalTeachers', label: 'Total teaching staff' },
  { key: 'qualifiedTeachersPct', label: 'Qualified teachers (%)' },
  { key: 'teacherVacancies', label: 'Teacher vacancies' },
  { key: 'classroomsCount', label: 'Number of classrooms' },
  { key: 'classroomCondition', label: 'Classroom condition' },
  { key: 'deskAvailabilityPct', label: 'Desk availability (%)' },
  { key: 'toiletCondition', label: 'Toilet facilities condition' },
  { key: 'sanitationRating', label: 'Sanitation rating' },
  { key: 'safetyInspectionStatus', label: 'Safety inspection status' },
  { key: 'learningMaterialAvailability', label: 'Learning material availability' },
];

export function validateSubmissionPayload(
  payload: SubmissionPayload,
  term: ReportingTerm,
  previousRecord?: TermRecord
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingIndicators: string[] = [];

  if (!VALID_TERMS.includes(term)) {
    errors.push('Selected reporting period is invalid.');
  }

  for (const field of MANDATORY_FIELDS) {
    const val = payload[field.key];
    if (val === '' || val === null || val === undefined) {
      missingIndicators.push(field.label);
    }
  }

  const checkNonNegative = (val: number | '', label: string) => {
    if (val !== '' && Number(val) < 0) {
      errors.push(`${label} cannot be negative.`);
    }
  };

  const checkPercent = (val: number | '', label: string) => {
    if (val !== '' && (Number(val) < 0 || Number(val) > 100)) {
      errors.push(`${label} must be between 0% and 100%.`);
    }
  };

  checkNonNegative(payload.totalEnrolment, 'Total enrolment');
  checkNonNegative(payload.maleEnrolment, 'Male enrolment');
  checkNonNegative(payload.femaleEnrolment, 'Female enrolment');
  checkNonNegative(payload.newAdmissions, 'New admissions');
  checkNonNegative(payload.withdrawals, 'Withdrawals');
  checkNonNegative(payload.totalTeachers, 'Total teaching staff');
  checkNonNegative(payload.teacherVacancies, 'Teacher vacancies');
  checkNonNegative(payload.staffTurnoverCount, 'Staff turnover');
  checkNonNegative(payload.classroomsCount, 'Number of classrooms');
  checkNonNegative(payload.safetyIncidentsCount, 'Reported safety incidents');

  checkPercent(payload.learnerAttendanceRate, 'Learner attendance rate');
  checkPercent(payload.teacherAttendanceRate, 'Teacher attendance rate');
  checkPercent(payload.chronicAbsenteeismRate, 'Chronic absenteeism rate');
  checkPercent(payload.overallPassRate, 'Overall academic pass rate');
  checkPercent(payload.mathScore, 'Mathematics performance');
  checkPercent(payload.englishScore, 'English performance');
  checkPercent(payload.scienceScore, 'Science performance');
  checkPercent(payload.examParticipationRate, 'Examination participation rate');
  checkPercent(payload.qualifiedTeachersPct, 'Qualified teachers percentage');
  checkPercent(payload.deskAvailabilityPct, 'Desk availability');
  checkPercent(payload.feeCollectionRate, 'Fee collection rate');

  if (
    payload.totalEnrolment !== '' &&
    payload.maleEnrolment !== '' &&
    payload.femaleEnrolment !== ''
  ) {
    const sum = Number(payload.maleEnrolment) + Number(payload.femaleEnrolment);
    if (sum > Number(payload.totalEnrolment)) {
      errors.push(
        `Male (${payload.maleEnrolment}) + Female (${payload.femaleEnrolment}) enrolment (${sum}) cannot exceed Total enrolment (${payload.totalEnrolment}).`
      );
    } else if (sum < Number(payload.totalEnrolment)) {
      warnings.push(
        `Male + Female enrolment (${sum}) is lower than Total enrolment (${payload.totalEnrolment}); verify gender disaggregation.`
      );
    }
  }

  if (payload.totalEnrolment !== '' && Number(payload.totalEnrolment) === 0) {
    warnings.push('Total enrolment is reported as 0 learners.');
  }

  if (
    previousRecord &&
    payload.totalEnrolment !== '' &&
    previousRecord.totalEnrolment > 0
  ) {
    const pctDiff = Math.abs(
      ((Number(payload.totalEnrolment) - previousRecord.totalEnrolment) /
        previousRecord.totalEnrolment) *
        100
    );
    if (pctDiff >= 15) {
      warnings.push(
        `Unusual enrolment variance: ${pctDiff.toFixed(1)}% change compared with ${previousRecord.term}.`
      );
    }
  }

  if (previousRecord && payload.overallPassRate !== '') {
    const drop = previousRecord.overallPassRate - Number(payload.overallPassRate);
    if (drop >= 12) {
      warnings.push(
        `Sharp pass rate decline of ${drop.toFixed(1)} percentage points compared with ${previousRecord.term}.`
      );
    }
  }

  if (previousRecord && payload.learnerAttendanceRate !== '') {
    const drop =
      previousRecord.learnerAttendanceRate - Number(payload.learnerAttendanceRate);
    if (drop >= 12) {
      warnings.push(
        `Sharp learner attendance drop of ${drop.toFixed(1)} percentage points compared with ${previousRecord.term}.`
      );
    }
  }

  const completenessPct = Math.round(
    ((MANDATORY_FIELDS.length - missingIndicators.length) / MANDATORY_FIELDS.length) *
      100
  );

  if (missingIndicators.length > 0) {
    errors.push(
      `${missingIndicators.length} mandatory indicator(s) are missing before final submission.`
    );
  }

  return {
    isValidForSubmit: errors.length === 0 && missingIndicators.length === 0,
    errors,
    warnings,
    completenessPct,
    missingIndicators,
  };
}

export function getPreviousTerm(term: ReportingTerm): ReportingTerm | null {
  const idx = VALID_TERMS.indexOf(term);
  if (idx <= 0) return null;
  return VALID_TERMS[idx - 1];
}

export function getSchoolTermRecord(
  termRecords: TermRecord[],
  schoolId: string,
  term: ReportingTerm
): TermRecord | undefined {
  return termRecords.find((r) => r.schoolId === schoolId && r.term === term);
}

export function getTeacherLearnerRatio(record: TermRecord | undefined): number {
  if (!record || record.totalTeachers <= 0) return 0;
  return Math.round((record.totalEnrolment / record.totalTeachers) * 10) / 10;
}

export function computeSchoolMonitoringStatus(
  schoolId: string,
  latestRecord: TermRecord | undefined,
  alerts: AlertRecord[],
  submissions: SchoolSubmission[],
  interventions: InterventionRecord[],
  activeTerm: ReportingTerm
): MonitoringStatus {
  const schoolAlerts = alerts.filter(
    (a) => a.schoolId === schoolId && a.status !== 'Resolved'
  );
  const hasCriticalAlert = schoolAlerts.some((a) => a.severity === 'Critical');
  const hasHighAlert = schoolAlerts.some((a) => a.severity === 'High');

  const activeSub = submissions.find(
    (s) => s.schoolId === schoolId && s.term === activeTerm
  );
  const overdueOrReturned =
    !activeSub ||
    activeSub.status === 'Draft' ||
    activeSub.status === 'Returned for Correction';

  const openInterventions = interventions.filter(
    (i) => i.schoolId === schoolId && i.status !== 'Completed'
  );

  if (
    hasCriticalAlert ||
    (latestRecord &&
      (latestRecord.learnerAttendanceRate < 70 ||
        latestRecord.overallPassRate < 45 ||
        latestRecord.classroomCondition === 'Critical' ||
        latestRecord.toiletCondition === 'Critical'))
  ) {
    return 'Critical Intervention';
  }

  if (
    hasHighAlert ||
    schoolAlerts.length > 0 ||
    overdueOrReturned ||
    openInterventions.length > 0 ||
    (latestRecord &&
      (latestRecord.learnerAttendanceRate < 80 || latestRecord.overallPassRate < 60))
  ) {
    return 'Watchlist';
  }

  return 'Compliant';
}

export function syncAlertsForDatabase(db: KSISDatabase): AlertRecord[] {
  const existingByKey = new Map<string, AlertRecord>();
  for (const a of db.alerts) {
    existingByKey.set(`${a.schoolId}::${a.ruleKey}`, a);
  }

  const nextAlerts: AlertRecord[] = [];
  const activeTerm = db.activeTerm;
  const prevTerm = getPreviousTerm(activeTerm);
  const thresholds: SystemThresholds = db.thresholds;
  const todayStr = new Date().toISOString().slice(0, 10);

  const upsertAlert = (
    school: School,
    ruleKey: string,
    params: Omit<
      AlertRecord,
      'id' | 'ruleKey' | 'schoolId' | 'division' | 'status' | 'assignedOfficer' | 'resolutionNotes' | 'dateDetected'
    > & { defaultOfficer?: string; dateDetected?: string }
  ) => {
    const existing = existingByKey.get(`${school.id}::${ruleKey}`);
    if (existing) {
      // If previously resolved manually and condition still triggers, keep resolved if resolutionNotes indicates override, unless metric is critical? Actually if condition clears it won't be called; if condition persists, keep user's status (Acknowledged/In Progress/Resolved)
      nextAlerts.push({
        ...existing,
        issue: params.issue,
        severity: params.severity,
        recommendedAction: params.recommendedAction,
      });
    } else {
      nextAlerts.push({
        id: `ALT-${school.id.split('-').slice(-1)[0]}-${ruleKey.toUpperCase().slice(0, 6)}`,
        ruleKey,
        schoolId: school.id,
        division: school.division,
        issue: params.issue,
        category: params.category,
        severity: params.severity,
        source: params.source,
        dateDetected: params.dateDetected || todayStr,
        recommendedAction: params.recommendedAction,
        status: 'Open',
        assignedOfficer: params.defaultOfficer || 'Unassigned',
        resolutionNotes: '',
      });
    }
  };

  for (const school of db.schools) {
    const current = getSchoolTermRecord(db.termRecords, school.id, activeTerm);
    const prev = prevTerm
      ? getSchoolTermRecord(db.termRecords, school.id, prevTerm)
      : undefined;
    const sub = db.submissions.find(
      (s) => s.schoolId === school.id && s.term === activeTerm
    );
    const schoolInspections = db.inspections.filter((i) => i.schoolId === school.id);
    const schoolInterventions = db.interventions.filter((i) => i.schoolId === school.id);

    if (current) {
      // 1. Attendance < minAttendancePct (75%)
      if (current.learnerAttendanceRate < thresholds.minAttendancePct) {
        const sev: AlertSeverity =
          current.learnerAttendanceRate < 65 ? 'Critical' : 'High';
        upsertAlert(school, 'LOW_ATTENDANCE', {
          category: 'Attendance',
          severity: sev,
          source: 'System Rule Engine',
          issue: `Learner attendance dropped to ${current.learnerAttendanceRate.toFixed(1)}% (below ${thresholds.minAttendancePct}% threshold).`,
          recommendedAction:
            'Conduct division attendance audit, engage PTA/community leaders, and verify learner retention.',
        });
      }

      // 2. Academic pass rate < minPassRatePct (50%)
      if (current.overallPassRate < thresholds.minPassRatePct) {
        const sev: AlertSeverity = current.overallPassRate < 42 ? 'Critical' : 'High';
        upsertAlert(school, 'LOW_PASS_RATE', {
          category: 'Academic',
          severity: sev,
          source: 'System Rule Engine',
          issue: `Overall academic pass rate fell to ${current.overallPassRate.toFixed(1)}% (below ${thresholds.minPassRatePct}% threshold).`,
          recommendedAction:
            'Schedule pedagogical support review, inspect subject schemes of work, and initiate targeted remedial intervention.',
        });
      }

      // 3. Teacher-to-learner ratio exceeds configurable threshold
      const ratio = getTeacherLearnerRatio(current);
      if (ratio > thresholds.maxTeacherLearnerRatio) {
        const sev: AlertSeverity =
          ratio > thresholds.maxTeacherLearnerRatio + 15 ? 'High' : 'Medium';
        upsertAlert(school, 'HIGH_TL_RATIO', {
          category: 'Staffing',
          severity: sev,
          source: 'System Rule Engine',
          issue: `Teacher-to-learner ratio is ${ratio}:1 (exceeds ${thresholds.maxTeacherLearnerRatio}:1 citywide standard).`,
          recommendedAction:
            'Review staff establishment ceiling, expedite teacher deployment, or split overcrowded streams.',
        });
      }

      // 4. Infrastructure marked Critical
      if (
        current.classroomCondition === 'Critical' ||
        current.toiletCondition === 'Critical'
      ) {
        const parts: string[] = [];
        if (current.classroomCondition === 'Critical') parts.push('classrooms');
        if (current.toiletCondition === 'Critical') parts.push('sanitation/toilets');
        upsertAlert(school, 'CRITICAL_INFRASTRUCTURE', {
          category: 'Infrastructure',
          severity: 'Critical',
          source: 'System Rule Engine',
          issue: `Critical infrastructure hazard reported on ${parts.join(' and ')}.`,
          recommendedAction:
            'Dispatch KCCA engineering & public health inspection team within 72 hours for emergency remediation.',
        });
      }

      // 5. Significant performance decline vs previous term
      if (prev) {
        const passDrop = prev.overallPassRate - current.overallPassRate;
        const attDrop = prev.learnerAttendanceRate - current.learnerAttendanceRate;
        if (
          passDrop >= thresholds.declineDropThresholdPct ||
          attDrop >= thresholds.declineDropThresholdPct
        ) {
          const desc =
            passDrop >= attDrop
              ? `Pass rate declined by ${passDrop.toFixed(1)} pts (${prev.overallPassRate}% → ${current.overallPassRate}%).`
              : `Learner attendance declined by ${attDrop.toFixed(1)} pts (${prev.learnerAttendanceRate}% → ${current.learnerAttendanceRate}%).`;
          upsertAlert(school, 'SIGNIFICANT_DECLINE', {
            category: 'Performance Decline',
            severity: Math.max(passDrop, attDrop) >= 12 ? 'High' : 'Medium',
            source: 'System Rule Engine',
            issue: `Significant term-over-term decline detected: ${desc}`,
            recommendedAction:
              'Request school leadership explanation and verify underlying operational disruptions.',
          });
        }
      }
    }

    // 6. Missed reporting deadline
    if (!sub || sub.status === 'Draft' || sub.status === 'Returned for Correction') {
      const reason = !sub
        ? `No ${activeTerm} submission filed by deadline (${school.reportingDeadline}).`
        : sub.status === 'Draft'
        ? `${activeTerm} report remains in Draft status past submission window.`
        : `${activeTerm} submission returned for correction and awaiting resubmission.`;
      upsertAlert(school, 'REPORTING_COMPLIANCE', {
        category: 'Compliance',
        severity: !sub ? 'High' : 'Medium',
        source: 'System Rule Engine',
        issue: reason,
        recommendedAction:
          'Follow up with School Administrator via division desk to complete and submit validated term data.',
      });
    }

    // 7. Previously identified problem unresolved (Verified Inspection Findings / Overdue Interventions)
    const overdueInspection = schoolInspections.find(
      (i) => i.status === 'Overdue' || i.complianceStatus === 'Non-Compliant'
    );
    const pendingIntervention = schoolInterventions.find(
      (i) => i.status !== 'Completed' && i.deadline < '2026-11-12'
    );

    if (overdueInspection || pendingIntervention) {
      const detail = overdueInspection
        ? `Verified inspection (${overdueInspection.inspectionDate}) flagged unresolved non-compliance: ${overdueInspection.issuesIdentified[0] || overdueInspection.findingsSummary}`
        : `Intervention "${pendingIntervention?.title}" past target deadline (${pendingIntervention?.deadline}).`;
      upsertAlert(school, 'UNRESOLVED_INSPECTION', {
        category: 'Unresolved Issue',
        severity: 'High',
        source: 'Verified Inspection Finding',
        issue: detail,
        recommendedAction:
          'Escalate to KCCA Education Officer for formal compliance follow-up and verification visit.',
      });
    }
  }

  // Keep manually closed/resolved inspection alerts if they weren't regenerated only if they were inspection findings? No, cleanly preserve any existing non-rule-cleared resolved alerts? Actually if a condition is fixed (e.g. school submits improved attendance >= 75%), removing the active open alert or marking it auto-resolved is even better! Let's keep resolved history for historical record if it was already Resolved, or let resolved alerts stay visible in Resolved filter.
  for (const oldAlert of db.alerts) {
    const stillPresent = nextAlerts.some(
      (n) => n.schoolId === oldAlert.schoolId && n.ruleKey === oldAlert.ruleKey
    );
    if (!stillPresent && oldAlert.status === 'Resolved') {
      nextAlerts.push(oldAlert);
    }
  }

  const severityOrder: Record<AlertSeverity, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };

  return nextAlerts.sort((a, b) => {
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export interface DashboardAnalytics {
  filteredSchools: School[];
  kpis: {
    totalRegisteredSchools: number;
    schoolsReportingThisTerm: number;
    overdueSubmissions: number;
    totalLearnerEnrolment: number;
    avgLearnerAttendance: number;
    avgAcademicPassRate: number;
    schoolsRequiringIntervention: number;
    inspectionsPending: number;
  };
  divisionPerformance: {
    division: KampalaDivision;
    shortName: string;
    schoolCount: number;
    avgPassRate: number;
    avgAttendance: number;
    totalEnrolment: number;
  }[];
  termTrends: {
    term: ReportingTerm;
    avgPassRate: number;
    totalEnrolment: number;
    avgAttendance: number;
    reportingCompliancePct: number;
  }[];
  performanceCategories: {
    label: string;
    count: number;
    color: string;
  }[];
  infrastructureDistribution: {
    condition: string;
    count: number;
    color: string;
  }[];
  schoolSummaries: {
    school: School;
    record: TermRecord | undefined;
    submission: SchoolSubmission | undefined;
    monitoringStatus: MonitoringStatus;
    openAlertsCount: number;
    teacherLearnerRatio: number;
  }[];
}

export function computeDashboardAnalytics(
  db: KSISDatabase,
  filters: DashboardFilters
): DashboardAnalytics {
  const searchLower = filters.search.trim().toLowerCase();

  const filteredSchools = db.schools.filter((s) => {
    if (filters.division !== 'All' && s.division !== filters.division) return false;
    if (filters.ownership !== 'All' && s.ownership !== filters.ownership) return false;
    if (filters.level !== 'All' && s.level !== filters.level) return false;
    if (
      searchLower &&
      !s.name.toLowerCase().includes(searchLower) &&
      !s.id.toLowerCase().includes(searchLower) &&
      !s.parish.toLowerCase().includes(searchLower)
    ) {
      return false;
    }
    return true;
  });

  const schoolIds = new Set(filteredSchools.map((s) => s.id));
  const selectedTerm = filters.term;

  const schoolSummaries = filteredSchools.map((school) => {
    const record = getSchoolTermRecord(db.termRecords, school.id, selectedTerm);
    const submission = db.submissions.find(
      (sub) => sub.schoolId === school.id && sub.term === selectedTerm
    );
    const openAlertsCount = db.alerts.filter(
      (a) => a.schoolId === school.id && a.status !== 'Resolved'
    ).length;
    const monitoringStatus = computeSchoolMonitoringStatus(
      school.id,
      record,
      db.alerts,
      db.submissions,
      db.interventions,
      selectedTerm
    );
    return {
      school,
      record,
      submission,
      monitoringStatus,
      openAlertsCount,
      teacherLearnerRatio: getTeacherLearnerRatio(record),
    };
  });

  const reportingStatuses = new Set(['Submitted', 'Under Review', 'Approved']);
  const schoolsReportingThisTerm = schoolSummaries.filter(
    (item) => item.submission && reportingStatuses.has(item.submission.status)
  ).length;
  const overdueSubmissions = filteredSchools.length - schoolsReportingThisTerm;

  const recordsInTerm = schoolSummaries
    .map((s) => s.record)
    .filter((r): r is TermRecord => Boolean(r));

  const totalLearnerEnrolment = recordsInTerm.reduce(
    (sum, r) => sum + r.totalEnrolment,
    0
  );
  const avgLearnerAttendance =
    recordsInTerm.length > 0
      ? Math.round(
          (recordsInTerm.reduce((sum, r) => sum + r.learnerAttendanceRate, 0) /
            recordsInTerm.length) *
            10
        ) / 10
      : 0;
  const avgAcademicPassRate =
    recordsInTerm.length > 0
      ? Math.round(
          (recordsInTerm.reduce((sum, r) => sum + r.overallPassRate, 0) /
            recordsInTerm.length) *
            10
        ) / 10
      : 0;

  const schoolsRequiringIntervention = schoolSummaries.filter(
    (s) => s.monitoringStatus === 'Critical Intervention'
  ).length;

  const inspectionsPending = db.inspections.filter(
    (i) =>
      schoolIds.has(i.schoolId) &&
      (i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Scheduled')
  ).length;

  // Division performance chart
  const divisionPerformance = KAMPALA_DIVISIONS.map((division) => {
    const items = schoolSummaries.filter((s) => s.school.division === division);
    const recs = items
      .map((i) => i.record)
      .filter((r): r is TermRecord => Boolean(r));
    return {
      division,
      shortName: division.replace(' Division', ''),
      schoolCount: items.length,
      avgPassRate:
        recs.length > 0
          ? Math.round(
              (recs.reduce((acc, r) => acc + r.overallPassRate, 0) / recs.length) * 10
            ) / 10
          : 0,
      avgAttendance:
        recs.length > 0
          ? Math.round(
              (recs.reduce((acc, r) => acc + r.learnerAttendanceRate, 0) / recs.length) *
                10
            ) / 10
          : 0,
      totalEnrolment: recs.reduce((acc, r) => acc + r.totalEnrolment, 0),
    };
  });

  // 3-Term trends
  const termTrends = VALID_TERMS.map((term) => {
    const recs = filteredSchools
      .map((s) => getSchoolTermRecord(db.termRecords, s.id, term))
      .filter((r): r is TermRecord => Boolean(r));
    const reportedCount = filteredSchools.filter((s) => {
      const sub = db.submissions.find((sb) => sb.schoolId === s.id && sb.term === term);
      return sub && reportingStatuses.has(sub.status);
    }).length;

    return {
      term,
      avgPassRate:
        recs.length > 0
          ? Math.round(
              (recs.reduce((acc, r) => acc + r.overallPassRate, 0) / recs.length) * 10
            ) / 10
          : 0,
      totalEnrolment: recs.reduce((acc, r) => acc + r.totalEnrolment, 0),
      avgAttendance:
        recs.length > 0
          ? Math.round(
              (recs.reduce((acc, r) => acc + r.learnerAttendanceRate, 0) / recs.length) *
                10
            ) / 10
          : 0,
      reportingCompliancePct:
        filteredSchools.length > 0
          ? Math.round((reportedCount / filteredSchools.length) * 1000) / 10
          : 0,
    };
  });

  // Schools by performance category
  const highCount = recordsInTerm.filter((r) => r.overallPassRate >= 75).length;
  const moderateCount = recordsInTerm.filter(
    (r) => r.overallPassRate >= 50 && r.overallPassRate < 75
  ).length;
  const underCount = recordsInTerm.filter((r) => r.overallPassRate < 50).length;

  const performanceCategories = [
    { label: 'High Performing (≥75%)', count: highCount, color: '#0D9488' },
    { label: 'Moderate (50–74%)', count: moderateCount, color: '#1D4ED8' },
    { label: 'Underperforming (<50%)', count: underCount, color: '#DC2626' },
  ];

  // Infrastructure condition distribution
  const infraConditions: { label: string; color: string }[] = [
    { label: 'Good', color: '#0D9488' },
    { label: 'Fair', color: '#0284C7' },
    { label: 'Poor', color: '#D97706' },
    { label: 'Critical', color: '#DC2626' },
  ];
  const infrastructureDistribution = infraConditions.map((c) => ({
    condition: c.label,
    count: recordsInTerm.filter((r) => r.classroomCondition === c.label).length,
    color: c.color,
  }));

  return {
    filteredSchools,
    kpis: {
      totalRegisteredSchools: filteredSchools.length,
      schoolsReportingThisTerm,
      overdueSubmissions,
      totalLearnerEnrolment,
      avgLearnerAttendance,
      avgAcademicPassRate,
      schoolsRequiringIntervention,
      inspectionsPending,
    },
    divisionPerformance,
    termTrends,
    performanceCategories,
    infrastructureDistribution,
    schoolSummaries,
  };
}

export interface DataQualitySummary {
  overallCompletenessPct: number;
  missingIndicatorCount: number;
  invalidOrReturnedCount: number;
  unusualChangesCount: number;
  pendingVerificationCount: number;
  anomalies: {
    schoolId: string;
    schoolName: string;
    division: KampalaDivision;
    type: 'Missing Indicators' | 'Returned / Invalid' | 'Unusual Variance' | 'Pending Verification';
    detail: string;
    severity: 'High' | 'Medium';
  }[];
}

export function computeDataQualitySummary(db: KSISDatabase): DataQualitySummary {
  const activeTerm = db.activeTerm;
  const prevTerm = getPreviousTerm(activeTerm);
  const subs = db.submissions.filter((s) => s.term === activeTerm);

  const anomalies: DataQualitySummary['anomalies'] = [];
  let completenessSum = 0;
  let missingIndicatorCount = 0;
  let invalidOrReturnedCount = 0;
  let unusualChangesCount = 0;
  let pendingVerificationCount = 0;

  for (const school of db.schools) {
    const sub = subs.find((s) => s.schoolId === school.id);
    if (!sub) {
      missingIndicatorCount += 1;
      anomalies.push({
        schoolId: school.id,
        schoolName: school.name,
        division: school.division,
        type: 'Missing Indicators',
        detail: `No ${activeTerm} submission created yet (0% completeness).`,
        severity: 'High',
      });
      continue;
    }

    completenessSum += sub.completenessPct;
    if (sub.missingIndicators.length > 0) {
      missingIndicatorCount += sub.missingIndicators.length;
      anomalies.push({
        schoolId: school.id,
        schoolName: school.name,
        division: school.division,
        type: 'Missing Indicators',
        detail: `Missing ${sub.missingIndicators.length} field(s): ${sub.missingIndicators
          .slice(0, 3)
          .join(', ')}${sub.missingIndicators.length > 3 ? '...' : ''}.`,
        severity: sub.missingIndicators.length >= 4 ? 'High' : 'Medium',
      });
    }

    if (sub.status === 'Returned for Correction') {
      invalidOrReturnedCount += 1;
      anomalies.push({
        schoolId: school.id,
        schoolName: school.name,
        division: school.division,
        type: 'Returned / Invalid',
        detail: sub.reviewerComments || 'Returned by KCCA review desk for data correction.',
        severity: 'High',
      });
    }

    if (sub.status === 'Submitted' || sub.status === 'Under Review') {
      pendingVerificationCount += 1;
      anomalies.push({
        schoolId: school.id,
        schoolName: school.name,
        division: school.division,
        type: 'Pending Verification',
        detail: `Submission ${sub.id} is in "${sub.status}" state awaiting KCCA officer verification.`,
        severity: 'Medium',
      });
    }

    const currentRec = getSchoolTermRecord(db.termRecords, school.id, activeTerm);
    const prevRec = prevTerm
      ? getSchoolTermRecord(db.termRecords, school.id, prevTerm)
      : undefined;

    if (currentRec && prevRec) {
      const enrolDiffPct =
        prevRec.totalEnrolment > 0
          ? Math.abs(
              ((currentRec.totalEnrolment - prevRec.totalEnrolment) /
                prevRec.totalEnrolment) *
                100
            )
          : 0;
      const passDiff = Math.abs(currentRec.overallPassRate - prevRec.overallPassRate);
      const attDiff = Math.abs(
        currentRec.learnerAttendanceRate - prevRec.learnerAttendanceRate
      );

      if (enrolDiffPct >= 15 || passDiff >= 12 || attDiff >= 12) {
        unusualChangesCount += 1;
        const notes: string[] = [];
        if (enrolDiffPct >= 15) notes.push(`Enrolment variance ${enrolDiffPct.toFixed(1)}%`);
        if (passDiff >= 12) notes.push(`Pass rate shift ${passDiff.toFixed(1)} pts`);
        if (attDiff >= 12) notes.push(`Attendance shift ${attDiff.toFixed(1)} pts`);
        anomalies.push({
          schoolId: school.id,
          schoolName: school.name,
          division: school.division,
          type: 'Unusual Variance',
          detail: `${notes.join(' · ')} vs ${prevTerm}.`,
          severity: 'Medium',
        });
      }
    }
  }

  const overallCompletenessPct =
    db.schools.length > 0 ? Math.round(completenessSum / db.schools.length) : 0;

  return {
    overallCompletenessPct,
    missingIndicatorCount,
    invalidOrReturnedCount,
    unusualChangesCount,
    pendingVerificationCount,
    anomalies,
  };
}

export function payloadFromTermRecord(rec: TermRecord): SubmissionPayload {
  return {
    overallPassRate: rec.overallPassRate,
    mathScore: rec.mathScore,
    englishScore: rec.englishScore,
    scienceScore: rec.scienceScore,
    examParticipationRate: rec.examParticipationRate,
    totalEnrolment: rec.totalEnrolment,
    maleEnrolment: rec.maleEnrolment,
    femaleEnrolment: rec.femaleEnrolment,
    newAdmissions: rec.newAdmissions,
    withdrawals: rec.withdrawals,
    learnerAttendanceRate: rec.learnerAttendanceRate,
    teacherAttendanceRate: rec.teacherAttendanceRate,
    chronicAbsenteeismRate: rec.chronicAbsenteeismRate,
    totalTeachers: rec.totalTeachers,
    qualifiedTeachersPct: rec.qualifiedTeachersPct,
    teacherVacancies: rec.teacherVacancies,
    staffTurnoverCount: rec.staffTurnoverCount,
    classroomsCount: rec.classroomsCount,
    classroomCondition: rec.classroomCondition,
    deskAvailabilityPct: rec.deskAvailabilityPct,
    toiletCondition: rec.toiletCondition,
    waterAvailable: rec.waterAvailable,
    electricityAvailable: rec.electricityAvailable,
    accessibilityFacilities: rec.accessibilityFacilities,
    firstAidAvailable: rec.firstAidAvailable,
    sanitationRating: rec.sanitationRating,
    safetyInspectionStatus: rec.safetyInspectionStatus,
    safetyIncidentsCount: rec.safetyIncidentsCount,
    safeguardingReferralStatus: rec.safeguardingReferralStatus,
    feeCollectionRate: rec.feeCollectionRate ?? '',
    learningMaterialAvailability: rec.learningMaterialAvailability,
    resourceConstraints: rec.resourceConstraints,
    operationalChallenges: rec.operationalChallenges,
  };
}
