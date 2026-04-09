'use client';

import { memo } from 'react';

interface DimensionCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly positive?: boolean;
  readonly neutral?: boolean;
}

function DimensionCardImpl({ icon, label, value, positive, neutral }: DimensionCardProps): React.ReactElement {
  const borderColor = positive ? 'ring-emerald-200' : neutral ? 'ring-amber-200' : 'ring-frost-200';
  const iconBg = positive ? 'bg-emerald-50 text-emerald-500' : neutral ? 'bg-amber-50 text-amber-500' : 'bg-frost-50 text-frost-400';
  const valueColor = positive ? 'text-emerald-600' : neutral ? 'text-amber-600' : 'text-frost-500';

  return (
    <div className={`glass-card rounded-xl p-4 text-center ring-1 ${borderColor}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[11px] text-frost-500 mb-0.5 truncate">{label}</p>
      <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

export const DimensionCard = memo(DimensionCardImpl);
