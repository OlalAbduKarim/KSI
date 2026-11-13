import React from 'react';
import { CheckCircle2, Circle, Play, RotateCcw, X } from 'lucide-react';
import { DemoChecklistState, useKSIS } from '../../store/ksisStore';

export const DemoWalkthroughDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const {
    demoChecklist,
    setActiveView,
    setSelectedSchoolId,
    setPortalSchoolId,
    switchUser,
    resetDemoData,
  } = useKSIS();

  if (!open) return null;

  const steps: {
    key: keyof DemoChecklistState;
    label: string;
    detail: string;
    actionLabel: string;
    onAction: () => void;
  }[] = [
    {
      key: 'viewedDashboard',
      label: '1. View Central Intelligence Dashboard',
      detail: 'Inspect 30 simulated Kampala schools across 5 divisions.',
      actionLabel: 'Dashboard',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setSelectedSchoolId(null);
        setActiveView('dashboard');
      },
    },
    {
      key: 'filteredDivision',
      label: '2. Filter by Kampala Division',
      detail: 'Select Central Division or Kawempe in Directory/Dashboard.',
      actionLabel: 'Directory',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setSelectedSchoolId(null);
        setActiveView('directory');
      },
    },
    {
      key: 'openedUnderperformingSchool',
      label: '3–4. Inspect Underperforming School History',
      detail: 'Open Kisenyi Community Primary (Demo) & review 3-term tabs.',
      actionLabel: 'Open School',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setSelectedSchoolId('KSIS-CEN-002');
        setActiveView('directory');
      },
    },
    {
      key: 'viewedAlert',
      label: '5. Identify Automated Intelligence Alert',
      detail: 'Inspect rule-engine alerts for attendance <75% and pass rate <50%.',
      actionLabel: 'Alert Engine',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setActiveView('alerts');
      },
    },
    {
      key: 'openedSchoolPortal',
      label: '6–7. Open School Submission Portal & Select School',
      detail: 'Switch to the School Portal for Kisenyi Community Primary (Demo).',
      actionLabel: 'Open Portal',
      onAction: () => {
        setPortalSchoolId('KSIS-CEN-002');
        setActiveView('portal');
      },
    },
    {
      key: 'submittedReport',
      label: '8. Submit Updated Attendance & Academic Data',
      detail: 'Complete missing fields, review summary, and submit to KCCA.',
      actionLabel: 'Go to Form',
      onAction: () => {
        setPortalSchoolId('KSIS-CEN-002');
        setActiveView('portal');
      },
    },
    {
      key: 'returnedToDashboard',
      label: '9–10. Verify Live Update on Central Dashboard',
      detail: 'Return to Central Intelligence and see updated KPIs & profile.',
      actionLabel: 'Central View',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setSelectedSchoolId(null);
        setActiveView('dashboard');
      },
    },
    {
      key: 'reviewedAndApproved',
      label: '11. Review & Approve Submission',
      detail: 'Open Submissions Desk and approve the incoming report.',
      actionLabel: 'Submissions Desk',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setActiveView('submissions');
      },
    },
    {
      key: 'createdIntervention',
      label: '12–14. Create & Complete Intervention',
      detail: 'Create an intervention, mark it completed, and observe status.',
      actionLabel: 'Interventions',
      onAction: () => {
        switchUser('USR-KCCA-01');
        setActiveView('interventions');
      },
    },
  ];

  const completedCount = steps.filter((s) => demoChecklist[s.key]).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col">
      <div className="px-5 py-4 bg-[#0B1E3D] text-white flex items-center justify-between">
        <div>
          <div className="text-[11px] text-teal-300 font-semibold">
            INTERACTIVE PRESENTATION GUIDE
          </div>
          <h2 className="text-sm font-bold mt-0.5">
            KCCA Officer Demonstration Workflow
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-300 hover:text-white rounded-sm"
          aria-label="Close walkthrough drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700 font-mono tabular-nums">
          Progress: {completedCount}/{steps.length} milestones
        </span>
        <button
          onClick={resetDemoData}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-red-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
        {steps.map((step) => {
          const done = demoChecklist[step.key];
          return (
            <div key={step.key} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                )}
                <div>
                  <div
                    className={`text-xs font-semibold ${
                      done ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    {step.label}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                </div>
              </div>
              <button
                onClick={step.onAction}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm whitespace-nowrap shrink-0"
              >
                <Play className="w-2.5 h-2.5" />
                {step.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
