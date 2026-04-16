'use client';

import { useEffect, useRef } from 'react';
import { Shield, Radar, Sparkles } from 'lucide-react';
import { UrlForm } from './url-form';
import { useI18n } from '@/lib/i18n';
import type { CheckResponse } from '@/lib/types/checker';

// Module-level icon constants — declared before components so they are visible
// at definition time (and so consumers can see them without scrolling down).
const SHIELD_ICON = <Shield className="w-4 h-4" />;
const RADAR_ICON = <Radar className="w-4 h-4" />;
const SPARKLES_ICON = <Sparkles className="w-4 h-4" />;

interface HeroSectionProps {
  readonly onSuccess: (data: CheckResponse) => void;
  readonly onError: (error: string) => void;
}

export function HeroSection({ onSuccess, onError }: HeroSectionProps): React.ReactElement {
  const { t } = useI18n();
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll(): void {
      if (parallaxRef.current) {
        const scrollY = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden" aria-label="Hero Section">
      {/* Parallax frost orbs */}
      <div ref={parallaxRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-radial from-frost-200/60 via-frost-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-frost-300/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-gradient-radial from-blue-200/20 via-transparent to-transparent rounded-full blur-2xl" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Beta badge */}
        <div className="animate-fade-up mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
            Beta
          </span>
        </div>

        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-frost-500/10 border border-frost-500/20 text-frost-600 text-sm font-medium mb-8 backdrop-blur-sm">
          <Radar className="w-4 h-4" aria-hidden="true" />
          <span>{t.hero.badge}</span>
        </div>

        {/* Title */}
        <h1 className="animate-fade-up stagger-1 text-4xl sm:text-5xl md:text-6xl font-black text-frost-900 mb-6 tracking-tight leading-[1.1]">
          <span className="block">{t.hero.title}</span>
          <span className="block mt-5 bg-gradient-to-r from-frost-500 to-frost-400 bg-clip-text text-transparent">
            {t.hero.titleHighlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up stagger-2 text-lg sm:text-xl text-frost-700/70 mb-12 max-w-xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* Form Card */}
        <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 sm:p-8 glow-accent-strong transition-transform duration-300 hover:scale-[1.01]">
          <UrlForm onSuccess={onSuccess} onError={onError} />
        </div>

        {/* Trust indicators */}
        <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-8 text-frost-500">
          <TrustIndicator icon={SHIELD_ICON} label={t.hero.trustFree} />
          <TrustIndicator icon={RADAR_ICON} label={t.hero.trustChecks} />
          <TrustIndicator icon={SPARKLES_ICON} label={t.hero.trustAI} />
        </div>
      </div>
    </section>
  );
}

interface TrustIndicatorProps {
  readonly icon: React.ReactNode;
  readonly label: string;
}

function TrustIndicator({ icon, label }: TrustIndicatorProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-sm transition-colors duration-200 hover:text-frost-700">
      <span className="text-frost-400" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
