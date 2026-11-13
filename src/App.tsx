import React from 'react';
import { AlertCenter } from './components/alerts/AlertCenter';
import { DataQualityPanel } from './components/data-quality/DataQualityPanel';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { InterventionManager } from './components/interventions/InterventionManager';
import { AppShell } from './components/layout/AppShell';
import { SchoolPortal } from './components/portal/SchoolPortal';
import { ReportingCentre } from './components/reports/ReportingCentre';
import { SchoolDirectory } from './components/schools/SchoolDirectory';
import { SubmissionReviewQueue } from './components/submissions/SubmissionReviewQueue';
import { KSISProvider, useKSIS } from './store/ksisStore';

const KSISRouter: React.FC = () => {
  const { activeView, currentUser } = useKSIS();

  if (currentUser.role === 'School Administrator' || activeView === 'portal') {
    return <SchoolPortal />;
  }

  switch (activeView) {
    case 'dashboard':
      return <ExecutiveDashboard />;
    case 'directory':
      return <SchoolDirectory />;
    case 'submissions':
      return <SubmissionReviewQueue />;
    case 'alerts':
      return <AlertCenter />;
    case 'interventions':
      return <InterventionManager />;
    case 'data-quality':
      return <DataQualityPanel />;
    case 'reports':
      return <ReportingCentre />;
    default:
      return <ExecutiveDashboard />;
  }
};

export default function App() {
  return (
    <KSISProvider>
      <AppShell>
        <KSISRouter />
      </AppShell>
    </KSISProvider>
  );
}
