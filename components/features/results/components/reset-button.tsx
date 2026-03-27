'use client';

import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ResetButtonProps {
  readonly onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="animate-fade-up stagger-6 text-center pt-4">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-frost-50 border border-frost-200 hover:border-frost-300 text-frost-600 hover:text-frost-800 font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98]"
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        {t.results.analyzeAnother}
      </button>
    </div>
  );
}
