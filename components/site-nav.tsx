'use client';

import Link from 'next/link';
import { Radar, Brain } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SiteNavProps {
  readonly active: 'checks' | 'ai-check';
}

export function SiteNav({ active }: SiteNavProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <nav className="fixed top-4 left-0 right-0 z-40 animate-fade-up flex justify-center pointer-events-none" aria-label="Main navigation">
      <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-full bg-white/80 backdrop-blur-md border border-frost-200/50 shadow-lg shadow-frost-500/5">
        <Link
          href="/"
          aria-current={active === 'checks' ? 'page' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            active === 'checks'
              ? 'bg-frost-500 text-white shadow-md shadow-frost-500/20'
              : 'text-frost-600 hover:bg-frost-50'
          }`}
        >
          <Radar className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t.nav.checksLabel}</span>
          <span className="sm:hidden">{t.nav.checksShort}</span>
        </Link>
        <Link
          href="/ai-check"
          aria-current={active === 'ai-check' ? 'page' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            active === 'ai-check'
              ? 'bg-gradient-to-r from-violet-500 to-frost-500 text-white shadow-md shadow-violet-500/20'
              : 'text-frost-600 hover:bg-frost-50'
          }`}
        >
          <Brain className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t.nav.aiVisibilityLabel}</span>
          <span className="sm:hidden">{t.nav.aiVisibilityShort}</span>
        </Link>
      </div>
    </nav>
  );
}
