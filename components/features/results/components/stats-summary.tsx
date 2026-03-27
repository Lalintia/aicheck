'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StatsSummaryProps {
  readonly passed: number;
  readonly warning: number;
  readonly failed: number;
}

export function StatsSummary({ passed, warning, failed }: StatsSummaryProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard icon={<CheckCircle className="w-5 h-5" />} value={passed} label={t.results.passed} color="emerald" />
      <StatCard icon={<AlertTriangle className="w-5 h-5" />} value={warning} label={t.results.partial} color="amber" />
      <StatCard icon={<XCircle className="w-5 h-5" />} value={failed} label={t.results.failed} color="red" />
    </div>
  );
}

interface StatCardProps {
  readonly icon: React.ReactNode;
  readonly value: number;
  readonly label: string;
  readonly color: 'emerald' | 'amber' | 'red';
}

const COLORS = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
} as const;

function StatCard({ icon, value, label, color }: StatCardProps): React.ReactElement {
  const c = COLORS[color];

  return (
    <div className={`${c.bg} rounded-2xl p-4 text-center border ${c.border} transition-transform duration-200 hover:scale-105`}>
      <div className={`${c.text} flex justify-center mb-2`} aria-hidden="true">{icon}</div>
      <div className={`text-2xl sm:text-3xl font-bold font-mono ${c.text}`}>{value}</div>
      <div className="text-frost-500 text-xs sm:text-sm font-medium">{label}</div>
    </div>
  );
}
