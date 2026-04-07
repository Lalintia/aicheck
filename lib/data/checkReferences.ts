export interface CheckReference {
  readonly title: string;
  readonly description: string;
  readonly why: string;
  readonly checks: readonly string[];
  readonly standards: ReadonlyArray<{ readonly name: string; readonly url: string; readonly source: string }>;
  readonly weight: string;
}

export const checkReferences: Readonly<Record<string, CheckReference>> = {
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
      "LCP (Largest Contentful Paint) \u2264 2.5s",
      "INP (Interaction to Next Paint) \u2264 200ms",
      "CLS (Cumulative Layout Shift) \u2264 0.1",
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
      "Does not skip levels (h1 \u2192 h3)",
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
      'Has <link rel="canonical">',
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
      'Has <meta name="viewport">',
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
