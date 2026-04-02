"use client";

import { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";

// Reference data for each check topic
const checkReferences: Record<string, {
  title: string;
  description: string;
  why: string;
  checks: string[];
  standards: { name: string; url: string; source: string }[];
  weight: string;
}> = {
  schema: {
    title: "Schema.org Structured Data",
    description: "Check Structured Data according to Schema.org standards",
    why: "Helps Search Engines and AI understand website content, leading to Rich Snippets and AI Overviews",
    checks: [
      "Organization (@type, name, url, logo, sameAs)",
      "WebSite (@type, name, url, potentialAction)",
      "Article (@type, headline, author, datePublished, publisher, image)",
      "BreadcrumbList (@type, itemListElement, position, name, item)",
      "WebPage (@type, name, description, url)",
      "LocalBusiness (@type, name, address, telephone, geo)",
    ],
    standards: [
      { name: "Schema.org Official", url: "https://schema.org/", source: "Schema.org" },
      { name: "Structured Data Guidelines", url: "https://developers.google.com/search/docs/appearance/structured-data", source: "Google" },
      { name: "Article Schema", url: "https://developers.google.com/search/docs/appearance/structured-data/article", source: "Google" },
      { name: "Organization Schema", url: "https://developers.google.com/search/docs/appearance/structured-data/organization", source: "Google" },
      { name: "Local Business", url: "https://developers.google.com/search/docs/appearance/structured-data/local-business", source: "Google" },
    ],
    weight: "25%",
  },
  robotsTxt: {
    title: "robots.txt",
    description: "Check robots.txt file",
    why: "Tells Search Engine Crawlers which parts of the website should or should not be accessed",
    checks: [
      "File exists at /robots.txt",
      "Has `User-agent` directive",
      "Has `Sitemap` directive",
      "No syntax error",
      "Does not block important pages",
    ],
    standards: [
      { name: "robots.txt Specification", url: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt", source: "Google" },
      { name: "RFC 9309 - Robots Exclusion Protocol", url: "https://www.rfc-editor.org/rfc/rfc9309.html", source: "IETF" },
    ],
    weight: "20%",
  },
  sitemap: {
    title: "XML Sitemap",
    description: "Check XML Sitemap",
    why: "Helps Search Engines discover and crawl important pages of the website faster",
    checks: [
      "File exists at /sitemap.xml",
      "Valid XML format",
      "Has `<urlset>` or `<sitemapindex>`",
      "URLs not exceeding 50,000 URLs",
      "File size not exceeding 50MB",
    ],
    standards: [
      { name: "Sitemaps Overview", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview", source: "Google" },
      { name: "Sitemap Protocol", url: "https://www.sitemaps.org/protocol.html", source: "Sitemaps.org" },
    ],
    weight: "15%",
  },
  pageSpeed: {
    title: "Page Speed & Core Web Vitals",
    description: "Check page speed and Core Web Vitals",
    why: "Google ranking factor that measures user experience",
    checks: [
      "LCP (Largest Contentful Paint) ≤ 2.5s",
      "INP (Interaction to Next Paint) ≤ 200ms",
      "CLS (Cumulative Layout Shift) ≤ 0.1",
    ],
    standards: [
      { name: "Core Web Vitals", url: "https://web.dev/articles/vitals", source: "web.dev" },
      { name: "PageSpeed Insights", url: "https://pagespeed.web.dev/", source: "Google" },
      { name: "Web Vitals Thresholds", url: "https://web.dev/articles/defining-core-web-vitals-thresholds", source: "web.dev" },
    ],
    weight: "10%",
  },
  semanticHTML: {
    title: "Semantic HTML",
    description: "Check Semantic HTML Elements",
    why: "Helps Screen readers, Search Engines, and AI understand website structure",
    checks: [
      "Has <main> element (Required)",
      "Has <header> element",
      "Has <nav> element",
      "Has <article> or <section>",
      "Has <footer> element",
    ],
    standards: [
      { name: "HTML Semantic Elements", url: "https://developer.mozilla.org/en-US/docs/Glossary/Semantics", source: "MDN" },
      { name: "HTML5 Specification", url: "https://html.spec.whatwg.org/multipage/", source: "W3C" },
      { name: "Semantic Structure", url: "https://webaim.org/techniques/semanticstructure/", source: "WebAIM" },
    ],
    weight: "10%",
  },
  headingHierarchy: {
    title: "Heading Hierarchy",
    description: "Check Heading order (H1-H6)",
    why: "Helps screen reader users, Search Engines, and AI understand content importance",
    checks: [
      "Has 1 <h1> per page (Required)",
      "Does not skip levels (h1 → h3)",
      "h1 must come before h2, h3...",
      "Use headings in order",
    ],
    standards: [
      { name: "Headings and Titles", url: "https://developers.google.com/search/docs/appearance/title-link", source: "Google" },
      { name: "Heading Rank", url: "https://www.w3.org/WAI/tutorials/page-structure/headings/", source: "W3C" },
      { name: "Headings", url: "https://webaim.org/techniques/semanticstructure/#headings", source: "WebAIM" },
    ],
    weight: "10%",
  },
  llmsTxt: {
    title: "llms.txt",
    description: "Check llms.txt file",
    why: "New standard that helps AI (ChatGPT, Claude, Gemini) understand websites",
    checks: [
      "File exists at /llms.txt",
      "Has H1 Title",
      "Has Bullet list of important pages",
      "Has Optional sections",
    ],
    standards: [
      { name: "llms.txt Specification", url: "https://llmstxt.org/", source: "llmstxt.org" },
      { name: "llms.txt GitHub", url: "https://github.com/AnswerDotAI/llms-txt", source: "GitHub" },
    ],
    weight: "5%",
  },
  openGraph: {
    title: "Open Graph Protocol",
    description: "Check Open Graph Tags",
    why: "Defines how link previews display on Social Media (Facebook, LinkedIn, Twitter/X)",
    checks: [
      "Has og:title",
      "Has og:description",
      "Has og:image",
      "Has og:url",
      "Has og:type (Recommended)",
      "Has og:site_name (Recommended)",
    ],
    standards: [
      { name: "Open Graph Protocol", url: "https://ogp.me/", source: "Open Graph" },
      { name: "Sharing Debugger", url: "https://developers.facebook.com/tools/debug/", source: "Facebook" },
      { name: "Twitter Cards", url: "https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards", source: "Twitter" },
    ],
    weight: "0% (Not scored)",
  },
  canonical: {
    title: "Canonical URLs",
    description: "Check Canonical URL",
    why: "Solves duplicate content issues by telling Search Engines which URL is the original",
    checks: [
      "Has <link rel=\"canonical\">",
      "URL is absolute URL",
      "No self-referencing loop",
      "No multiple canonical tags",
    ],
    standards: [
      { name: "Consolidate Duplicate URLs", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls", source: "Google" },
      { name: "RFC 6596 - Canonical Link Relation", url: "https://datatracker.ietf.org/doc/html/rfc6596", source: "IETF" },
    ],
    weight: "0% (Not scored)",
  },
  mobile: {
    title: "Mobile Responsiveness",
    description: "Check Mobile support",
    why: "Google uses Mobile-First Indexing, 70%+ of searches come from mobile",
    checks: [
      "Has <meta name=\"viewport\">",
      "Content not wider than screen",
      "Text readable without zoom",
      "Touch targets have appropriate size",
    ],
    standards: [
      { name: "Mobile-First Indexing", url: "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-first-indexing", source: "Google" },
      { name: "Responsive Design Basics", url: "https://web.dev/articles/responsive-web-design-basics", source: "web.dev" },
      { name: "Viewport Meta Tag", url: "https://www.w3.org/TR/css-device-adapt-1/#viewport-meta", source: "W3C" },
    ],
    weight: "0% (Not scored)",
  },
};

interface CheckReferenceButtonProps {
  readonly checkType: string;
}

export function CheckReferenceButton({ checkType }: CheckReferenceButtonProps): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState(true);
  const [expandedStandards, setExpandedStandards] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  // Unique IDs per instance prevent duplicate id attributes when multiple modals mount
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const checksListId = `${dialogId}-checks-list`;
  const standardsListId = `${dialogId}-standards-list`;

  // All hooks must come before any conditional return (Rules of Hooks)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (open) {
      wasOpen.current = true;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      document.body.style.overflow = 'unset';
      if (wasOpen.current) {
        wasOpen.current = false;
        requestAnimationFrame(() => triggerButtonRef.current?.focus());
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const reference = checkReferences[checkType];

  if (!reference) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerButtonRef}
        onClick={() => setOpen(true)}
        aria-label={`View reference for ${reference.title}`}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Reference</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b">
              <div>
                <h2 id={titleId} className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {reference.title}
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                    Weight {reference.weight}
                  </span>
                </h2>
                <p id={descriptionId} className="text-sm text-gray-500 mt-1">
                  {reference.description}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={`Close ${reference.title} reference`}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Why Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Why check this?
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {reference.why}
                </p>
              </div>

              {/* Checks Section */}
              <div>
                <button
                  onClick={() => setExpandedChecks(!expandedChecks)}
                  aria-expanded={expandedChecks}
                  aria-controls={checksListId}
                  className="flex items-center gap-2 w-full text-left group mb-3"
                >
                  <span className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    {expandedChecks ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                    Checklist items
                  </span>
                  <span className="text-xs text-gray-500">
                    ({reference.checks.length} items)
                  </span>
                </button>
                
                {expandedChecks && (
                  <ul id={checksListId} className="space-y-2 pl-6">
                    {reference.checks.map((check) => (
                      <li
                        key={check}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                        {check}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Standards Section */}
              <div>
                <button
                  onClick={() => setExpandedStandards(!expandedStandards)}
                  aria-expanded={expandedStandards}
                  aria-controls={standardsListId}
                  className="flex items-center gap-2 w-full text-left group mb-3"
                >
                  <span className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    {expandedStandards ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                    Standards reference
                  </span>
                  <span className="text-xs text-gray-500">
                    ({reference.standards.length} sources)
                  </span>
                </button>
                
                {expandedStandards && (
                  <div id={standardsListId} className="space-y-2">
                    {reference.standards.map((standard) => (
                      <a
                        key={standard.url}
                        href={standard.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 text-xs border border-gray-300 rounded shrink-0">
                            {standard.source}
                          </span>
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {standard.name}
                          </span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">
                Validation criteria based on Google Search Central and W3C standards
                <br />
                Last updated: February 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// View all criteria button (for Header or Footer)
export function ViewAllCriteriaButton(): React.ReactElement {
  return (
    <Link
      href="/docs/validation-criteria"
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      View all validation criteria
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}
