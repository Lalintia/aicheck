import type { Recommendation } from '@/lib/types/checker';

interface RecommendationGroupProps {
  readonly title: string;
  readonly count: number;
  readonly items: readonly Recommendation[];
  readonly color: 'rose' | 'amber' | 'blue';
  readonly icon: React.ReactNode;
}

const colorStyles = {
  rose: {
    bg: 'bg-red-50/50',
    border: 'border-red-200',
    headerBg: 'bg-red-100',
    headerText: 'text-red-600',
    itemBg: 'bg-white',
    itemBorder: 'border-red-100',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-200',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-600',
    itemBg: 'bg-white',
    itemBorder: 'border-amber-100',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
  },
  blue: {
    bg: 'bg-frost-50',
    border: 'border-frost-200',
    headerBg: 'bg-frost-100',
    headerText: 'text-frost-600',
    itemBg: 'bg-white',
    itemBorder: 'border-frost-100',
    badgeBg: 'bg-frost-50',
    badgeText: 'text-frost-600',
  },
} as const;

export function RecommendationGroup({
  title,
  count,
  items,
  color,
  icon,
}: RecommendationGroupProps): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  const c = colorStyles[color];

  return (
    <div className={`${c.bg} rounded-2xl border ${c.border} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`${c.headerBg} ${c.headerText} p-1.5 rounded-lg`}>{icon}</span>
        <h3 className={`font-semibold ${c.headerText}`}>{title}</h3>
        <span className={`ml-auto text-xs font-mono ${c.headerText} opacity-70`}>{count}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${item.category}-${item.message}`}
            className={`${c.itemBg} rounded-xl p-4 border ${c.itemBorder} transition-all duration-200 hover:shadow-sm`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-frost-900 mb-1 text-sm">{item.message}</p>
              <p className="text-sm text-frost-500 mb-2">{item.action}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-md ${c.badgeBg} ${c.badgeText} font-medium`}>
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
