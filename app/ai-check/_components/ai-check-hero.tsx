'use client';

import { AlertCircle, ArrowRight, Brain, Eye, Globe, Loader2, Sparkles } from 'lucide-react';
import type { AiCheckStrings } from '../_lib/default-ai-check';

interface AICheckHeroProps {
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly ai: AiCheckStrings;
  readonly formT: { label: string; placeholder: string; errorEmpty: string };
}

export function AICheckHero({ onSubmit, isLoading, error, ai, formT }: AICheckHeroProps): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden" aria-label="AI Visibility Check">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full neural-glow" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full neural-glow-secondary" />
        <div className="absolute top-1/2 left-1/6 w-[200px] h-[200px] rounded-full bg-gradient-radial from-violet-200/15 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full ai-badge-glow text-sm font-medium mb-8">
          <Brain className="w-4 h-4 text-violet-500" aria-hidden="true" />
          <span className="bg-gradient-to-r from-violet-600 to-frost-500 bg-clip-text text-transparent font-semibold">
            {ai.badge}
          </span>
        </div>

        <h1 className="animate-fade-up stagger-1 text-4xl sm:text-5xl md:text-6xl font-black text-frost-900 mb-6 tracking-tight leading-[1.1]">
          {ai.title}{' '}
          <span className="bg-gradient-to-r from-violet-500 via-frost-500 to-violet-400 bg-clip-text text-transparent">
            {ai.titleHighlight}
          </span>
        </h1>

        <p className="animate-fade-up stagger-2 text-lg sm:text-xl text-frost-700/70 mb-12 max-w-xl mx-auto leading-relaxed">
          {ai.subtitle}
        </p>

        <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 sm:p-8 ai-form-glow transition-transform duration-300 hover:scale-[1.01]">
          <form onSubmit={onSubmit} className="space-y-4" aria-label="AI Visibility Check Form">
            <div className="text-left">
              <label htmlFor="ai-check-url" className="block text-frost-700 text-sm font-medium mb-2">
                {formT.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <Globe className="h-5 w-5 text-frost-400" />
                </div>
                <input
                  id="ai-check-url"
                  name="url"
                  type="text"
                  placeholder={formT.placeholder}
                  autoComplete="url"
                  required
                  className={`w-full bg-frost-50 border rounded-xl pl-11 pr-4 py-4 text-frost-900 placeholder-frost-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 ${
                    error ? 'border-red-300 bg-red-50/30' : 'border-frost-200'
                  }`}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'ai-check-url-error' : undefined}
                />
              </div>
              {error && (
                <div id="ai-check-url-error" className="flex items-center gap-2 mt-2 text-red-600 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-label={isLoading ? ai.scanning : ai.submit}
              className="w-full bg-gradient-to-r from-violet-500 to-frost-500 hover:from-violet-600 hover:to-frost-600 disabled:from-frost-300 disabled:to-frost-300 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:shadow-none disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{ai.scanning}</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" aria-hidden="true" />
                  <span>{ai.submit}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-8 text-frost-500 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" aria-hidden="true" />
            <span>{ai.trustLabel1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-frost-400" aria-hidden="true" />
            <span>{ai.trustLabel2}</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-frost-400" aria-hidden="true" />
            <span>{ai.trustLabel3}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
