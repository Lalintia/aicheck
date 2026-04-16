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
    readonly itemsToImprove: (count: number) => string;
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
    readonly scoreAriaLabel: (score: number, grade: string) => string;
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
  readonly nav: {
    readonly checksLabel: string;
    readonly checksShort: string;
    readonly aiVisibilityLabel: string;
    readonly aiVisibilityShort: string;
  };
  readonly loading: string;
  readonly checkReferences: {
    readonly viewReferenceLabel: (title: string) => string;
    readonly closeReferenceLabel: (title: string) => string;
    readonly referenceButtonLabel: string;
    readonly weightLabel: string;
    readonly whyCheckTitle: string;
    readonly checklistItemsTitle: string;
    readonly checklistItemsCount: (n: number) => string;
    readonly standardsTitle: string;
    readonly standardsCount: (n: number) => string;
    readonly footerLine1: string;
    readonly footerLine2: string;
    readonly viewAllCriteria: string;
  };
  readonly schemaDetails: {
    readonly title: string;
    readonly noneFound: string;
    readonly descriptions: {
      readonly organization: string;
      readonly website: string;
      readonly article: string;
      readonly breadcrumb: string;
      readonly localBusiness: string;
    };
    readonly found: string;
    readonly missingRequired: string;
    readonly missingRecommended: string;
    readonly errors: string;
    readonly warnings: string;
    readonly items: string;
    readonly validPositions: string;
    readonly validAddress: string;
    readonly hide: string;
    readonly details: string;
    readonly toggleDetailsLabel: (action: string, type: string) => string;
  };
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
    readonly aiOverview: string;
    readonly aiOverviewFull: string;
    readonly aiOverviewPartial: string;
    readonly aiOverviewAnswerOnly: string;
    readonly aiOverviewNone: string;
    readonly scoreBreakdown: string;
    readonly scoringCriteria: string;
    readonly labelWhyMatters: string;
    readonly labelHowImprove: string;
    readonly labelHowDetect: string;
    readonly criteriaItems: ReadonlyArray<{
      readonly label: string;
      readonly max: string;
      readonly desc: string;
      readonly why: string;
      readonly howToImprove: string;
      readonly howDetected: string;
    }>;
    readonly summary: string;
    readonly details: string;
    readonly model: string;
    readonly analyzeAnother: string;
    readonly skipped: string;
    readonly trustLabel1: string;
    readonly trustLabel2: string;
    readonly trustLabel3: string;
  };
}
