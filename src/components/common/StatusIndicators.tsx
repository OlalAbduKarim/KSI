import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  AlertSeverity,
  AlertStatus,
  MonitoringStatus,
  SubmissionStatus,
} from '../../types/ksis';

export const MonitoringStatusLabel: React.FC<{ status: MonitoringStatus }> = ({
  status,
}) => {
  if (status === 'Compliant') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Compliant
      </span>
    );
  }
  if (status === 'Watchlist') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        Watchlist
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
      Critical Intervention
    </span>
  );
};

export const SubmissionStatusLabel: React.FC<{
  status: SubmissionStatus | 'Missing';
}> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Approved
        </span>
      );
    case 'Submitted':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Submitted
        </span>
      );
    case 'Under Review':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Under Review
        </span>
      );
    case 'Returned for Correction':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Returned for Correction
        </span>
      );
    case 'Draft':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Overdue / Missing
        </span>
      );
  }
};

export const SeverityLabel: React.FC<{ severity: AlertSeverity }> = ({
  severity,
}) => {
  const styles: Record<AlertSeverity, string> = {
    Critical: 'text-red-700 bg-red-50 border-red-200',
    High: 'text-amber-800 bg-amber-50 border-amber-200',
    Medium: 'text-blue-800 bg-blue-50 border-blue-200',
    Low: 'text-slate-700 bg-slate-100 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-sm whitespace-nowrap ${styles[severity]}`}
    >
      {severity}
    </span>
  );
};

export const AlertStatusLabel: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const map: Record<AlertStatus, string> = {
    Open: 'text-red-700',
    Acknowledged: 'text-amber-700',
    'In Progress': 'text-blue-700',
    Resolved: 'text-emerald-700',
  };
  return (
    <span className={`text-xs font-medium whitespace-nowrap ${map[status]}`}>
      {status}
    </span>
  );
};
