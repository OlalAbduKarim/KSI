import React, { createContext, useContext, useEffect, useState } from 'react';
import { createInitialSeedDatabase, DEMO_USERS } from '../data/seedData';
import {
  AlertStatus,
  AppView,
  InspectionRecord,
  InterventionRecord,
  InterventionStatus,
  KSISDatabase,
  ReportingTerm,
  SchoolSubmission,
  SubmissionPayload,
  SubmissionStatus,
  SystemThresholds,
  TermRecord,
  UserAccount,
} from '../types/ksis';
import {
  getSchoolTermRecord,
  syncAlertsForDatabase,
  validateSubmissionPayload,
  getPreviousTerm,
} from '../utils/intelligenceEngine';

const STORAGE_KEY = 'ksis_demo_db_v2';
const USER_STORAGE_KEY = 'ksis_demo_user_v2';

export interface DemoChecklistState {
  viewedDashboard: boolean;
  filteredDivision: boolean;
  openedUnderperformingSchool: boolean;
  inspectedHistory: boolean;
  viewedAlert: boolean;
  openedSchoolPortal: boolean;
  selectedSchoolInPortal: boolean;
  submittedReport: boolean;
  returnedToDashboard: boolean;
  reviewedAndApproved: boolean;
  createdIntervention: boolean;
  completedIntervention: boolean;
}

const INITIAL_DEMO_CHECKLIST: DemoChecklistState = {
  viewedDashboard: true,
  filteredDivision: false,
  openedUnderperformingSchool: false,
  inspectedHistory: false,
  viewedAlert: false,
  openedSchoolPortal: false,
  selectedSchoolInPortal: false,
  submittedReport: false,
  returnedToDashboard: false,
  reviewedAndApproved: false,
  createdIntervention: false,
  completedIntervention: false,
};

interface KSISContextValue {
  db: KSISDatabase;
  currentUser: UserAccount;
  activeView: AppView;
  selectedSchoolId: string | null;
  portalSchoolId: string;
  demoChecklist: DemoChecklistState;
  setActiveView: (view: AppView) => void;
  setSelectedSchoolId: (schoolId: string | null) => void;
  setPortalSchoolId: (schoolId: string) => void;
  switchUser: (userId: string) => void;
  switchToSchoolAdmin: (schoolId: string) => void;
  markDemoStep: (step: keyof DemoChecklistState) => void;
  saveSubmissionDraft: (
    schoolId: string,
    term: ReportingTerm,
    payload: SubmissionPayload
  ) => SchoolSubmission;
  submitSchoolReport: (
    schoolId: string,
    term: ReportingTerm,
    payload: SubmissionPayload
  ) => { ok: boolean; errors: string[]; submission?: SchoolSubmission };
  reviewSubmission: (
    submissionId: string,
    nextStatus: Extract<SubmissionStatus, 'Under Review' | 'Approved' | 'Returned for Correction'>,
    comments: string
  ) => void;
  updateAlert: (
    alertId: string,
    updates: { status?: AlertStatus; assignedOfficer?: string; resolutionNotes?: string }
  ) => void;
  createInspection: (
    record: Omit<InspectionRecord, 'id'>
  ) => InspectionRecord;
  updateInspection: (
    inspectionId: string,
    updates: Partial<InspectionRecord>
  ) => void;
  createIntervention: (
    record: Omit<InterventionRecord, 'id'>
  ) => InterventionRecord;
  updateIntervention: (
    interventionId: string,
    updates: Partial<InterventionRecord> & { status?: InterventionStatus }
  ) => void;
  updateThresholds: (thresholds: SystemThresholds) => void;
  resetDemoData: () => void;
}

const KSISContext = createContext<KSISContextValue | null>(null);

function loadInitialDB(): KSISDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KSISDatabase;
      if (parsed && Array.isArray(parsed.schools) && parsed.schools.length === 30) {
        return parsed;
      }
    }
  } catch {
    // Fallback to clean seed
  }
  return createInitialSeedDatabase();
}

function loadInitialUser(): UserAccount {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserAccount;
      if (parsed && parsed.id && parsed.role) return parsed;
    }
  } catch {
    // Fallback
  }
  return DEMO_USERS[0];
}

export const KSISProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [db, setDb] = useState<KSISDatabase>(loadInitialDB);
  const [currentUser, setCurrentUser] = useState<UserAccount>(loadInitialUser);
  const [activeView, setActiveViewState] = useState<AppView>(() =>
    loadInitialUser().role === 'School Administrator' ? 'portal' : 'dashboard'
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [portalSchoolId, setPortalSchoolIdState] = useState<string>(() => {
    const u = loadInitialUser();
    return u.assignedSchoolId || 'KSIS-CEN-002';
  });
  const [demoChecklist, setDemoChecklist] =
    useState<DemoChecklistState>(INITIAL_DEMO_CHECKLIST);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage quota errors
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } catch {
      // Ignore
    }
  }, [currentUser]);

  const markDemoStep = (step: keyof DemoChecklistState) => {
    setDemoChecklist((prev) => (prev[step] ? prev : { ...prev, [step]: true }));
  };

  const setActiveView = (view: AppView) => {
    if (currentUser.role === 'School Administrator' && view !== 'portal') {
      setActiveViewState('portal');
      return;
    }
    setActiveViewState(view);
    if (view === 'portal') markDemoStep('openedSchoolPortal');
    if (view === 'dashboard' && demoChecklist.submittedReport) {
      markDemoStep('returnedToDashboard');
    }
    if (view === 'alerts') markDemoStep('viewedAlert');
  };

  const setPortalSchoolId = (schoolId: string) => {
    if (currentUser.role === 'School Administrator' && currentUser.assignedSchoolId) {
      setPortalSchoolIdState(currentUser.assignedSchoolId);
      return;
    }
    setPortalSchoolIdState(schoolId);
    markDemoStep('selectedSchoolInPortal');
  };

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return;
    setCurrentUser(found);
    setSelectedSchoolId(null);
    if (found.role === 'School Administrator') {
      const assigned = found.assignedSchoolId || 'KSIS-CEN-002';
      setPortalSchoolIdState(assigned);
      setActiveViewState('portal');
      markDemoStep('openedSchoolPortal');
      markDemoStep('selectedSchoolInPortal');
    } else {
      if (activeView === 'portal') {
        setActiveViewState('dashboard');
        if (demoChecklist.submittedReport) markDemoStep('returnedToDashboard');
      }
    }
  };

  const switchToSchoolAdmin = (schoolId: string) => {
    const school = db.schools.find((s) => s.id === schoolId);
    if (!school) return;
    const customUser: UserAccount = {
      id: `USR-SCH-${schoolId}`,
      name: school.headTeacher,
      title: `School Administrator · ${school.name}`,
      role: 'School Administrator',
      assignedSchoolId: school.id,
      email: school.contactEmail,
    };
    setCurrentUser(customUser);
    setPortalSchoolIdState(school.id);
    setSelectedSchoolId(null);
    setActiveViewState('portal');
    markDemoStep('openedSchoolPortal');
    markDemoStep('selectedSchoolInPortal');
  };

  const applyPayloadToTermRecord = (
    existingRecords: TermRecord[],
    schoolId: string,
    term: ReportingTerm,
    payload: SubmissionPayload,
    verificationStatus: TermRecord['verificationStatus']
  ): TermRecord[] => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const existing = existingRecords.find(
      (r) => r.schoolId === schoolId && r.term === term
    );

    const num = (val: number | '', fallback: number) =>
      val === '' ? fallback : Number(val);

    const nextRecord: TermRecord = {
      id: existing?.id || `REC-${schoolId}-${term.replace(/\s+/g, '')}`,
      schoolId,
      term,
      verificationStatus,
      updatedAt: todayStr,
      overallPassRate: num(payload.overallPassRate, existing?.overallPassRate ?? 0),
      mathScore: num(payload.mathScore, existing?.mathScore ?? 0),
      englishScore: num(payload.englishScore, existing?.englishScore ?? 0),
      scienceScore: num(payload.scienceScore, existing?.scienceScore ?? 0),
      examParticipationRate: num(
        payload.examParticipationRate,
        existing?.examParticipationRate ?? 0
      ),
      totalEnrolment: num(payload.totalEnrolment, existing?.totalEnrolment ?? 0),
      maleEnrolment: num(payload.maleEnrolment, existing?.maleEnrolment ?? 0),
      femaleEnrolment: num(payload.femaleEnrolment, existing?.femaleEnrolment ?? 0),
      newAdmissions: num(payload.newAdmissions, existing?.newAdmissions ?? 0),
      withdrawals: num(payload.withdrawals, existing?.withdrawals ?? 0),
      learnerAttendanceRate: num(
        payload.learnerAttendanceRate,
        existing?.learnerAttendanceRate ?? 0
      ),
      teacherAttendanceRate: num(
        payload.teacherAttendanceRate,
        existing?.teacherAttendanceRate ?? 0
      ),
      chronicAbsenteeismRate: num(
        payload.chronicAbsenteeismRate,
        existing?.chronicAbsenteeismRate ?? 0
      ),
      totalTeachers: num(payload.totalTeachers, existing?.totalTeachers ?? 1),
      qualifiedTeachersPct: num(
        payload.qualifiedTeachersPct,
        existing?.qualifiedTeachersPct ?? 0
      ),
      teacherVacancies: num(payload.teacherVacancies, existing?.teacherVacancies ?? 0),
      staffTurnoverCount: num(
        payload.staffTurnoverCount,
        existing?.staffTurnoverCount ?? 0
      ),
      classroomsCount: num(payload.classroomsCount, existing?.classroomsCount ?? 1),
      classroomCondition:
        (payload.classroomCondition || existing?.classroomCondition || 'Fair') as TermRecord['classroomCondition'],
      deskAvailabilityPct: num(
        payload.deskAvailabilityPct,
        existing?.deskAvailabilityPct ?? 0
      ),
      toiletCondition:
        (payload.toiletCondition || existing?.toiletCondition || 'Adequate') as TermRecord['toiletCondition'],
      waterAvailable: payload.waterAvailable,
      electricityAvailable: payload.electricityAvailable,
      accessibilityFacilities: payload.accessibilityFacilities,
      firstAidAvailable: payload.firstAidAvailable,
      sanitationRating:
        (payload.sanitationRating || existing?.sanitationRating || 'Fair') as TermRecord['sanitationRating'],
      safetyInspectionStatus:
        (payload.safetyInspectionStatus || existing?.safetyInspectionStatus || 'Pending') as TermRecord['safetyInspectionStatus'],
      safetyIncidentsCount: num(
        payload.safetyIncidentsCount,
        existing?.safetyIncidentsCount ?? 0
      ),
      safeguardingReferralStatus:
        (payload.safeguardingReferralStatus || existing?.safeguardingReferralStatus || 'None Required') as TermRecord['safeguardingReferralStatus'],
      feeCollectionRate:
        payload.feeCollectionRate === '' ? null : Number(payload.feeCollectionRate),
      learningMaterialAvailability:
        (payload.learningMaterialAvailability || existing?.learningMaterialAvailability || 'Partial') as TermRecord['learningMaterialAvailability'],
      resourceConstraints: payload.resourceConstraints,
      operationalChallenges: payload.operationalChallenges,
    };

    if (existing) {
      return existingRecords.map((r) => (r.id === existing.id ? nextRecord : r));
    }
    return [...existingRecords, nextRecord];
  };

  const saveSubmissionDraft = (
    schoolId: string,
    term: ReportingTerm,
    payload: SubmissionPayload
  ): SchoolSubmission => {
    const prevTerm = getPreviousTerm(term);
    const prevRecord = prevTerm
      ? getSchoolTermRecord(db.termRecords, schoolId, prevTerm)
      : undefined;
    const validation = validateSubmissionPayload(payload, term, prevRecord);
    const school = db.schools.find((s) => s.id === schoolId);
    const existing = db.submissions.find(
      (s) => s.schoolId === schoolId && s.term === term
    );

    const draft: SchoolSubmission = {
      id: existing?.id || `SUB-${schoolId}-${term.replace(/\s+/g, '')}`,
      schoolId,
      term,
      status: 'Draft',
      submittedAt: existing?.submittedAt || null,
      submittedBy: currentUser.role === 'School Administrator' ? currentUser.name : school?.headTeacher || currentUser.name,
      reviewedAt: null,
      reviewedBy: null,
      reviewerComments: existing?.reviewerComments || 'Draft saved in School Submission Portal.',
      completenessPct: validation.completenessPct,
      missingIndicators: validation.missingIndicators,
      validationWarnings: validation.warnings,
      payload,
    };

    setDb((prev) => {
      const nextSubs = existing
        ? prev.submissions.map((s) => (s.id === existing.id ? draft : s))
        : [...prev.submissions, draft];
      const nextDb: KSISDatabase = {
        ...prev,
        submissions: nextSubs,
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });

    return draft;
  };

  const submitSchoolReport = (
    schoolId: string,
    term: ReportingTerm,
    payload: SubmissionPayload
  ) => {
    const prevTerm = getPreviousTerm(term);
    const prevRecord = prevTerm
      ? getSchoolTermRecord(db.termRecords, schoolId, prevTerm)
      : undefined;
    const validation = validateSubmissionPayload(payload, term, prevRecord);

    if (!validation.isValidForSubmit) {
      return { ok: false, errors: validation.errors };
    }

    const school = db.schools.find((s) => s.id === schoolId);
    const existing = db.submissions.find(
      (s) => s.schoolId === schoolId && s.term === term
    );
    const todayStr = new Date().toISOString().slice(0, 10);

    const submitted: SchoolSubmission = {
      id: existing?.id || `SUB-${schoolId}-${term.replace(/\s+/g, '')}`,
      schoolId,
      term,
      status: 'Submitted',
      submittedAt: todayStr,
      submittedBy:
        currentUser.role === 'School Administrator'
          ? currentUser.name
          : school?.headTeacher || currentUser.name,
      reviewedAt: null,
      reviewedBy: null,
      reviewerComments: 'Submitted via School Data Submission Portal; awaiting KCCA verification.',
      completenessPct: 100,
      missingIndicators: [],
      validationWarnings: validation.warnings,
      payload,
    };

    setDb((prev) => {
      const nextSubs = existing
        ? prev.submissions.map((s) => (s.id === existing.id ? submitted : s))
        : [...prev.submissions, submitted];
      const nextRecords = applyPayloadToTermRecord(
        prev.termRecords,
        schoolId,
        term,
        payload,
        'Pending Review'
      );
      const nextDb: KSISDatabase = {
        ...prev,
        submissions: nextSubs,
        termRecords: nextRecords,
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });

    markDemoStep('submittedReport');
    return { ok: true, errors: [], submission: submitted };
  };

  const reviewSubmission = (
    submissionId: string,
    nextStatus: Extract<
      SubmissionStatus,
      'Under Review' | 'Approved' | 'Returned for Correction'
    >,
    comments: string
  ) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setDb((prev) => {
      const target = prev.submissions.find((s) => s.id === submissionId);
      if (!target) return prev;

      const updatedSub: SchoolSubmission = {
        ...target,
        status: nextStatus,
        reviewedAt: todayStr,
        reviewedBy: currentUser.name,
        reviewerComments: comments.trim() || target.reviewerComments,
      };

      const nextSubs = prev.submissions.map((s) =>
        s.id === submissionId ? updatedSub : s
      );

      let nextRecords = prev.termRecords;
      if (nextStatus === 'Approved') {
        nextRecords = applyPayloadToTermRecord(
          prev.termRecords,
          target.schoolId,
          target.term,
          target.payload,
          'Verified'
        );
      } else if (nextStatus === 'Returned for Correction') {
        nextRecords = prev.termRecords.map((r) =>
          r.schoolId === target.schoolId && r.term === target.term
            ? { ...r, verificationStatus: 'Unverified' }
            : r
        );
      }

      const nextDb: KSISDatabase = {
        ...prev,
        submissions: nextSubs,
        termRecords: nextRecords,
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });

    if (nextStatus === 'Approved') {
      markDemoStep('reviewedAndApproved');
    }
  };

  const updateAlert = (
    alertId: string,
    updates: { status?: AlertStatus; assignedOfficer?: string; resolutionNotes?: string }
  ) => {
    setDb((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, ...updates } : a)),
      lastUpdatedAt: new Date().toISOString(),
    }));
    markDemoStep('viewedAlert');
  };

  const createInspection = (record: Omit<InspectionRecord, 'id'>): InspectionRecord => {
    const newRec: InspectionRecord = {
      ...record,
      id: `INSP-2026-${String(db.inspections.length + 1).padStart(3, '0')}`,
    };
    setDb((prev) => {
      const nextDb: KSISDatabase = {
        ...prev,
        inspections: [newRec, ...prev.inspections],
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });
    return newRec;
  };

  const updateInspection = (
    inspectionId: string,
    updates: Partial<InspectionRecord>
  ) => {
    setDb((prev) => {
      const nextDb: KSISDatabase = {
        ...prev,
        inspections: prev.inspections.map((i) =>
          i.id === inspectionId ? { ...i, ...updates } : i
        ),
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });
  };

  const createIntervention = (
    record: Omit<InterventionRecord, 'id'>
  ): InterventionRecord => {
    const newRec: InterventionRecord = {
      ...record,
      id: `INT-2026-${String(db.interventions.length + 1).padStart(2, '0')}`,
    };
    setDb((prev) => {
      const nextDb: KSISDatabase = {
        ...prev,
        interventions: [newRec, ...prev.interventions],
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });
    markDemoStep('createdIntervention');
    return newRec;
  };

  const updateIntervention = (
    interventionId: string,
    updates: Partial<InterventionRecord> & { status?: InterventionStatus }
  ) => {
    setDb((prev) => {
      const nextDb: KSISDatabase = {
        ...prev,
        interventions: prev.interventions.map((i) =>
          i.id === interventionId ? { ...i, ...updates } : i
        ),
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });
    if (updates.status === 'Completed') {
      markDemoStep('completedIntervention');
    }
  };

  const updateThresholds = (thresholds: SystemThresholds) => {
    setDb((prev) => {
      const nextDb: KSISDatabase = {
        ...prev,
        thresholds,
        lastUpdatedAt: new Date().toISOString(),
      };
      nextDb.alerts = syncAlertsForDatabase(nextDb);
      return nextDb;
    });
  };

  const resetDemoData = () => {
    const fresh = createInitialSeedDatabase();
    setDb(fresh);
    setDemoChecklist(INITIAL_DEMO_CHECKLIST);
    setSelectedSchoolId(null);
    if (currentUser.role === 'School Administrator') {
      setPortalSchoolIdState(currentUser.assignedSchoolId || 'KSIS-CEN-002');
    } else {
      setPortalSchoolIdState('KSIS-CEN-002');
    }
  };

  return (
    <KSISContext.Provider
      value={{
        db,
        currentUser,
        activeView,
        selectedSchoolId,
        portalSchoolId,
        demoChecklist,
        setActiveView,
        setSelectedSchoolId,
        setPortalSchoolId,
        switchUser,
        switchToSchoolAdmin,
        markDemoStep,
        saveSubmissionDraft,
        submitSchoolReport,
        reviewSubmission,
        updateAlert,
        createInspection,
        updateInspection,
        createIntervention,
        updateIntervention,
        updateThresholds,
        resetDemoData,
      }}
    >
      {children}
    </KSISContext.Provider>
  );
};

export function useKSIS(): KSISContextValue {
  const ctx = useContext(KSISContext);
  if (!ctx) {
    throw new Error('useKSIS must be used within KSISProvider');
  }
  return ctx;
}
