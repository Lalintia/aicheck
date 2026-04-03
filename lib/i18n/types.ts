export type Locale = 'en' | 'th';

export interface Translations {
  readonly hero: {
    readonly badge: string;
    readonly title: string;
    readonly titleHighlight: string;
    readonly subtitle: string;
    readonly trustFree: string;
    readonly trustChecks: string;
    readonly trustAI: string;
  };
  readonly form: {
    readonly label: string;
    readonly placeholder: string;
    readonly submit: string;
    readonly scanning: string;
    readonly errorEmpty: string;
  };
  readonly results: {
    readonly title: string;
    readonly checklist: string;
    readonly checksCount: string;
    readonly recommendations: string;
    readonly itemsToImprove: string;
    readonly allClear: string;
    readonly allClearMessage: string;
    readonly criticalIssues: string;
    readonly highPriority: string;
    readonly mediumPriority: string;
    readonly lowPriority: string;
    readonly passed: string;
    readonly partial: string;
    readonly failed: string;
    readonly pass: string;
    readonly fail: string;
    readonly analyzeAnother: string;
  };
  readonly grades: {
    readonly excellent: string;
    readonly good: string;
    readonly fair: string;
    readonly poor: string;
  };
  readonly checks: Record<string, {
    readonly title: string;
    readonly description: string;
  }>;
  readonly error: {
    readonly title: string;
    readonly message: string;
    readonly tryAgain: string;
  };
  readonly loading: string;
  readonly aiCheck?: {
    readonly badge: string;
    readonly title: string;
    readonly titleHighlight: string;
    readonly subtitle: string;
    readonly submit: string;
    readonly scanning: string;
    readonly resultTitle: string;
    readonly knows: string;
    readonly doesNotKnow: string;
    readonly accuracy: string;
    readonly accuracyLevels: {
      readonly accurate: string;
      readonly partial: string;
      readonly inaccurate: string;
      readonly unknown: string;
    };
    readonly urlKnown: string;
    readonly urlNotKnown: string;
    readonly knowledgeDepth: string;
    readonly depthLevels: {
      readonly deep: string;
      readonly moderate: string;
      readonly shallow: string;
      readonly none: string;
    };
    readonly productsKnown: string;
    readonly productsNotKnown: string;
    readonly googlePresence: string;
    readonly googleTop3: string;
    readonly googleTop5: string;
    readonly googleTop10: string;
    readonly googleLow: string;
    readonly googleNone: string;
    readonly scoreBreakdown: string;
    readonly scoringCriteria: string;
    readonly criteriaItems: {
      label: string;
      max: string;
      desc: string;
    }[];
    readonly summary: string;
    readonly details: string;
    readonly model: string;
    readonly analyzeAnother: string;
    readonly skipped: string;
  };
}
