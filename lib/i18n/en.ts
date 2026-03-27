import type { Translations } from './types';

export const en: Translations = {
  hero: {
    badge: '13 AI Search Factors',
    title: 'Is your website',
    titleHighlight: 'visible to AI?',
    subtitle: 'Scan your website across 13 critical factors that determine how AI search engines discover, understand, and cite your content.',
    trustFree: 'Free Analysis',
    trustChecks: '13 Checks',
    trustAI: 'AI-Powered',
  },
  form: {
    label: 'Website URL',
    placeholder: 'www.example.com',
    submit: 'Start Analysis',
    scanning: 'Scanning...',
    errorEmpty: 'Please enter a valid URL',
  },
  results: {
    title: 'Analysis Result',
    checklist: 'Analysis Checklist',
    checksCount: '13 checks',
    recommendations: 'Recommendations',
    itemsToImprove: 'items to improve',
    allClear: 'All Clear',
    allClearMessage: 'Your website is well-optimized for AI search engines. No critical issues found.',
    criticalIssues: 'Critical Issues',
    highPriority: 'High Priority',
    mediumPriority: 'Medium Priority',
    lowPriority: 'Low Priority',
    passed: 'Passed',
    partial: 'Partial',
    failed: 'Failed',
    pass: 'Pass',
    fail: 'Fail',
    analyzeAnother: 'Analyze Another Website',
  },
  grades: {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Needs Work',
  },
  checks: {
    schema: {
      title: 'Schema.org (JSON-LD)',
      description: 'Structured data for AI to understand content',
    },
    ssrCsr: {
      title: 'Server-Side Rendering',
      description: 'Content visible without JavaScript',
    },
    robotsTxt: {
      title: 'robots.txt',
      description: 'Tells AI which pages to access',
    },
    headingHierarchy: {
      title: 'Heading Hierarchy',
      description: 'Clear H1 → H2 → H3 order',
    },
    imageAI: {
      title: 'Image AI Readiness',
      description: 'Alt text and context for AI to understand images',
    },
    semanticHTML: {
      title: 'Semantic HTML',
      description: 'Meaningful HTML structure',
    },
    sitemap: {
      title: 'Sitemap.xml',
      description: 'Site map for AI discovery',
    },
    openGraph: {
      title: 'Open Graph',
      description: 'Preview tags for AI and social platforms',
    },
    llmsTxt: {
      title: 'llms.txt',
      description: 'LLM-specific guidance file',
    },
    faqBlocks: {
      title: 'FAQ/QA Blocks',
      description: 'Question-answer format for zero-click results',
    },
    authorAuthority: {
      title: 'Author Authority (E-E-A-T)',
      description: 'Author info and credibility signals',
    },
    pageSpeed: {
      title: 'Page Speed',
      description: 'Page loading performance for crawlers',
    },
    aiVisibility: {
      title: 'AI Visibility',
      description: 'Does AI recognize this website?',
    },
  },
  error: {
    title: 'Analysis Failed',
    message: 'We encountered an unexpected error. Please try again.',
    tryAgain: 'Try Again',
  },
  loading: 'Loading...',
};
