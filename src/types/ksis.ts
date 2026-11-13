export type KampalaDivision =
  | 'Central Division'
  | 'Kawempe Division'
  | 'Makindye Division'
  | 'Nakawa Division'
  | 'Rubaga Division';

export type SchoolOwnership = 'Government' | 'Private';
export type EducationLevel = 'Primary' | 'Secondary';
export type ReportingTerm = '2025 Term 3' | '2026 Term 1' | '2026 Term 2';

export type ClassroomCondition = 'Good' | 'Fair' | 'Poor' | 'Critical';
export type ToiletCondition = 'Adequate' | 'Inadequate' | 'Critical';
export type SanitationRating = 'Good' | 'Fair' | 'Poor';
export type SafetyInspectionStatus = 'Passed' | 'Pending' | 'Failed';
export type SafeguardingReferralStatus =
  | 'None Required'
  | 'Under Review - Restricted'
  | 'Referred - Restricted';
export type LearningMaterialLevel = 'Adequate' | 'Partial' | 'Scarce';

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Returned for Correction';

export type MonitoringStatus = 'Compliant' | 'Watchlist' | 'Critical Intervention';
export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Open' | 'Acknowledged' | 'In Progress' | 'Resolved';
export type AlertSource = 'System Rule Engine' | 'Verified Inspection Finding';

export type InspectionStatus = 'Completed' | 'Pending' | 'Overdue' | 'Scheduled';
export type ComplianceStatus = 'Compliant' | 'Conditional' | 'Non-Compliant';
export type InterventionStatus = 'Pending' | 'Ongoing' | 'Completed';

export type UserRole =
  | 'System Administrator'
  | 'KCCA Education Officer'
  | 'Education Monitoring Officer'
  | 'School Administrator';

export interface UserAccount {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  assignedSchoolId?: string;
  email: string;
}

export interface School {
  id: string;
  name: string;
  division: KampalaDivision;
  parish: string;
  ownership: SchoolOwnership;
  level: EducationLevel;
  headTeacher: string;
  contactEmail: string;
  establishedYear: number;
  reportingDeadline: string;
  isSimulated: true;
}

export interface TermRecord {
  id: string;
  schoolId: string;
  term: ReportingTerm;
  verificationStatus: 'Verified' | 'Pending Review' | 'Unverified';
  updatedAt: string;

  // A. Academic Performance
  overallPassRate: number;
  mathScore: number;
  englishScore: number;
  scienceScore: number;
  examParticipationRate: number;

  // B. Learner Enrolment
  totalEnrolment: number;
  maleEnrolment: number;
  femaleEnrolment: number;
  newAdmissions: number;
  withdrawals: number;

  // C. Attendance
  learnerAttendanceRate: number;
  teacherAttendanceRate: number;
  chronicAbsenteeismRate: number;

  // D. Staffing
  totalTeachers: number;
  qualifiedTeachersPct: number;
  teacherVacancies: number;
  staffTurnoverCount: number;

  // E. Infrastructure
  classroomsCount: number;
  classroomCondition: ClassroomCondition;
  deskAvailabilityPct: number;
  toiletCondition: ToiletCondition;
  waterAvailable: boolean;
  electricityAvailable: boolean;
  accessibilityFacilities: boolean;

  // F. Health, Safety & Safeguarding (Aggregated / Access-Controlled)
  firstAidAvailable: boolean;
  sanitationRating: SanitationRating;
  safetyInspectionStatus: SafetyInspectionStatus;
  safetyIncidentsCount: number;
  safeguardingReferralStatus: SafeguardingReferralStatus;

  // G. Financial & Operational (Optional & Access-Controlled)
  feeCollectionRate: number | null;
  learningMaterialAvailability: LearningMaterialLevel;
  resourceConstraints: string;
  operationalChallenges: string;
}

export interface SubmissionPayload {
  overallPassRate: number | '';
  mathScore: number | '';
  englishScore: number | '';
  scienceScore: number | '';
  examParticipationRate: number | '';

  totalEnrolment: number | '';
  maleEnrolment: number | '';
  femaleEnrolment: number | '';
  newAdmissions: number | '';
  withdrawals: number | '';

  learnerAttendanceRate: number | '';
  teacherAttendanceRate: number | '';
  chronicAbsenteeismRate: number | '';

  totalTeachers: number | '';
  qualifiedTeachersPct: number | '';
  teacherVacancies: number | '';
  staffTurnoverCount: number | '';

  classroomsCount: number | '';
  classroomCondition: ClassroomCondition | '';
  deskAvailabilityPct: number | '';
  toiletCondition: ToiletCondition | '';
  waterAvailable: boolean;
  electricityAvailable: boolean;
  accessibilityFacilities: boolean;

  firstAidAvailable: boolean;
  sanitationRating: SanitationRating | '';
  safetyInspectionStatus: SafetyInspectionStatus | '';
  safetyIncidentsCount: number | '';
  safeguardingReferralStatus: SafeguardingReferralStatus | '';

  feeCollectionRate: number | '';
  learningMaterialAvailability: LearningMaterialLevel | '';
  resourceConstraints: string;
  operationalChallenges: string;
}

export interface SchoolSubmission {
  id: string;
  schoolId: string;
  term: ReportingTerm;
  status: SubmissionStatus;
  submittedAt: string | null;
  submittedBy: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewerComments: string;
  completenessPct: number;
  missingIndicators: string[];
  validationWarnings: string[];
  payload: SubmissionPayload;
}

export interface AlertRecord {
  id: string;
  ruleKey: string;
  schoolId: string;
  division: KampalaDivision;
  issue: string;
  category:
    | 'Attendance'
    | 'Academic'
    | 'Staffing'
    | 'Infrastructure'
    | 'Compliance'
    | 'Performance Decline'
    | 'Unresolved Issue';
  severity: AlertSeverity;
  source: AlertSource;
  dateDetected: string;
  recommendedAction: string;
  status: AlertStatus;
  assignedOfficer: string;
  resolutionNotes: string;
}

export interface InspectionRecord {
  id: string;
  schoolId: string;
  inspectionDate: string;
  inspectorName: string;
  status: InspectionStatus;
  complianceStatus: ComplianceStatus;
  findingsSummary: string;
  issuesIdentified: string[];
  recommendations: string[];
  nextScheduledDate: string;
  correctiveProgressPct: number;
}

export interface InterventionRecord {
  id: string;
  schoolId: string;
  inspectionId?: string;
  alertId?: string;
  title: string;
  issueCategory: string;
  identifiedDate: string;
  responsibleOfficer: string;
  deadline: string;
  status: InterventionStatus;
  progressNotes: string;
  outcomeSummary: string;
  baselineAttendance: number;
  baselinePassRate: number;
  outcomeAttendance?: number;
  outcomePassRate?: number;
  problemImproved?: boolean | null;
}

export interface SystemThresholds {
  minAttendancePct: number;
  minPassRatePct: number;
  maxTeacherLearnerRatio: number;
  declineDropThresholdPct: number;
}

export interface KSISDatabase {
  schools: School[];
  termRecords: TermRecord[];
  submissions: SchoolSubmission[];
  alerts: AlertRecord[];
  inspections: InspectionRecord[];
  interventions: InterventionRecord[];
  thresholds: SystemThresholds;
  activeTerm: ReportingTerm;
  lastUpdatedAt: string;
}

export type AppView =
  | 'dashboard'
  | 'directory'
  | 'submissions'
  | 'alerts'
  | 'interventions'
  | 'data-quality'
  | 'reports'
  | 'portal';
