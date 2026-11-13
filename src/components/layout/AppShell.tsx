import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  PlayCircle,
  RotateCcw,
  School,
  ShieldCheck,
  X,
} from 'lucide-react';
import { DEMO_USERS } from '../../data/seedData';
import { useKSIS } from '../../store/ksisStore';
import { AppView } from '../../types/ksis';
import { DemoWalkthroughDrawer } from '../demo/DemoWalkthroughDrawer';

const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Executive Overview',
  directory: 'School Directory & Profiles',
  submissions: 'Submissions & Verification Desk',
  alerts: 'Intelligence & Alert Engine',
  interventions: 'Inspections & Interventions',
  'data-quality': 'Data Quality & Assurance',
  reports: 'Analytical Reporting Centre',
  portal: 'School Data Submission Portal',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    db,
    currentUser,
    activeView,
    setActiveView,
    setSelectedSchoolId,
    switchUser,
    resetDemoData,
  } = useKSIS();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isSchoolAdmin = currentUser.role === 'School Administrator';
  const pendingReviewCount = db.submissions.filter(
    (s) =>
      s.term === db.activeTerm &&
      (s.status === 'Submitted' || s.status === 'Under Review')
  ).length;
  const openAlertsCount = db.alerts.filter((a) => a.status !== 'Resolved').length;

  const centralNav: {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'directory', label: 'School Directory', icon: Building2 },
    {
      id: 'submissions',
      label: 'Submissions Desk',
      icon: FileCheck2,
      badge: pendingReviewCount,
    },
    {
      id: 'alerts',
      label: 'Alert Engine',
      icon: AlertTriangle,
      badge: openAlertsCount,
    },
    { id: 'interventions', label: 'Interventions', icon: ClipboardCheck },
    { id: 'data-quality', label: 'Data Quality', icon: ShieldCheck },
    { id: 'reports', label: 'Analytical Reports', icon: FileSpreadsheet },
  ];

  const handleNavClick = (view: AppView) => {
    setSelectedSchoolId(null);
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1E3D] text-slate-100 w-64">
      {/* Brand Mark */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-teal-600/20 border border-teal-400/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-white leading-tight">
              KSIS Platform
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              Analytica Technologies
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic mt-2.5">
          Turning School Data into Education Intelligence.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {!isSchoolAdmin && (
          <div>
            <div className="px-2.5 mb-2 text-[11px] font-semibold text-slate-400 tracking-wide">
              Central Intelligence Office
            </div>
            <nav className="space-y-0.5" aria-label="Central intelligence navigation">
              {centralNav.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white/12 text-white'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-teal-300" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm bg-white/10 text-slate-100 tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          <div className="px-2.5 mb-2 text-[11px] font-semibold text-slate-400 tracking-wide">
            School Environment
          </div>
          <nav className="space-y-0.5" aria-label="School portal navigation">
            <button
              onClick={() => handleNavClick('portal')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeView === 'portal'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-300 hover:bg-white/6 hover:text-white'
              }`}
            >
              <School className="w-4 h-4 shrink-0 text-teal-300" />
              <span>School Submission Portal</span>
            </button>
          </nav>
          {isSchoolAdmin && (
            <p className="px-2.5 mt-2 text-[11px] text-slate-400 leading-relaxed">
              Role-scoped access: your account can only view and submit data for your assigned institution.
            </p>
          )}
        </div>
      </div>

      {/* Persistence & Simulated Notice Footer */}
      <div className="px-4 py-3.5 border-t border-white/10 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
          <Database className="w-3.5 h-3.5 text-teal-300 shrink-0" />
          Local Demo Store Active
        </div>
        <p className="leading-relaxed">
          All schools and metrics are simulated demonstration records developed by Analytica Technologies.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="relative z-10 m-3 h-9 w-9 rounded-md bg-white text-slate-800 flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb / Role Switcher / Primary Controls */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-1.5 border border-slate-200 rounded-md text-slate-700"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">
                Kampala Schools Intelligence System · {VIEW_TITLES[activeView]}
              </div>
              <div className="text-[11px] text-amber-800 font-medium truncate">
                Demonstration Mode · Simulated Dataset (Not Official KCCA Records)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="sr-only" htmlFor="role-switcher">
              Switch demonstration user role
            </label>
            <select
              id="role-switcher"
              value={
                DEMO_USERS.some((u) => u.id === currentUser.id)
                  ? currentUser.id
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') switchUser(e.target.value);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-800 max-w-[230px]"
            >
              {!DEMO_USERS.some((u) => u.id === currentUser.id) && (
                <option value="custom">{currentUser.title}</option>
              )}
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role}: {u.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setDemoDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0B1E3D] hover:bg-[#14305E] rounded-md whitespace-nowrap"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Demo Guide
            </button>

            {confirmReset ? (
              <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs">
                <span className="text-red-800 font-medium">Reset all data?</span>
                <button
                  onClick={() => {
                    resetDemoData();
                    setConfirmReset(false);
                  }}
                  className="text-red-700 font-semibold hover:underline"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-slate-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md whitespace-nowrap"
                title="Restore initial 30-school demonstration dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        <footer className="px-6 py-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 no-print">
          <span>
            Kampala Schools Intelligence System (KSIS) · Developed by Analytica Technologies
          </span>
          <span>
            Proposed Government Education Intelligence Prototype · All figures simulated for demonstration
          </span>
        </footer>
      </div>

      <DemoWalkthroughDrawer
        open={demoDrawerOpen}
        onClose={() => setDemoDrawerOpen(false)}
      />
    </div>
  );
};
