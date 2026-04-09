'use client';

import { useEffect, useState } from 'react';
import type { CheckGrade } from '@/lib/types/checker';
import { useI18n } from '@/lib/i18n';

interface ScoreDisplayProps {
  readonly score: number;
  readonly grade: CheckGrade;
  readonly url: string;
}

const GRADE_COLORS: Record<CheckGrade, { ring: string; text: string; bg: string }> = {
  excellent: { ring: '#2e9e6a', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  good: { ring: '#4a6fa5', text: 'text-frost-500', bg: 'bg-frost-100' },
  fair: { ring: '#d4880f', text: 'text-amber-600', bg: 'bg-amber-50' },
  poor: { ring: '#c94040', text: 'text-red-600', bg: 'bg-red-50' },
};

export function ScoreDisplay({ score, grade, url }: ScoreDisplayProps): React.ReactElement {
  const { t } = useI18n();
  const gradeLabel = t.grades[grade];
  const colors = GRADE_COLORS[grade];
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    function animate(now: number): void {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); };
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="text-center mb-8">
      <p className="text-frost-500 text-sm mb-1">{t.results.title}</p>
      <p className="text-frost-700 font-medium mb-8 truncate px-4 text-sm" title={url}>{url}</p>

      <div className="flex flex-col items-center mb-6">
        <div
          role="img"
          aria-label={t.results.scoreAriaLabel(score, gradeLabel)}
          className="relative w-44 h-44 mb-5"
        >
          <svg className="w-full h-full" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="score-ring"
              style={{ filter: `drop-shadow(0 0 6px ${colors.ring}30)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold font-mono ${colors.text}`}>{animatedScore}</span>
            <span className="text-frost-400 text-sm font-medium">/100</span>
          </div>
        </div>

        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${colors.text} ${colors.bg}`}>
          {gradeLabel}
        </span>
      </div>
    </div>
  );
}
