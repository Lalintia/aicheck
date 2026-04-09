'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Loading(): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div role="status" aria-label={t.loading} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-frost-100 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-frost-500 animate-spin" aria-hidden="true" />
        </div>
        <p className="text-frost-500 font-medium">{t.loading}</p>
      </div>
    </div>
  );
}
