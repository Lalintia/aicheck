# AI Search Checker — Technical Design Document

**Version:** 1.0
**Last Updated:** February 2026
**Status:** Production
**Author:** Lalintia

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [API Documentation](#5-api-documentation)
6. [Data Models](#6-data-models)
7. [Scoring & Business Logic](#7-scoring--business-logic)
8. [Security](#8-security)
9. [Environment Variables](#9-environment-variables)
10. [Local Development](#10-local-development)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Infrastructure](#13-infrastructure)
14. [Monitoring & Debugging](#14-monitoring--debugging)
15. [Roadmap](#15-roadmap)

---

## 1. Project Overview

### What is AI Search Checker?

**AI Search Checker** (`aicheck.ohmai.me`) is a free web application that analyzes websites for readiness to be indexed and understood by AI-powered search engines such as ChatGPT, Perplexity, and Google AI Overview.

As AI increasingly replaces traditional search, websites need to satisfy a new set of technical standards beyond classic SEO. This tool checks **10 key factors** and returns a scored report with actionable recommendations.

### Problem Statement

Traditional SEO tools check for Google ranking factors. AI search engines use different signals — structured data, machine-readable policies, semantic content, and context signals — that most webmasters are unaware of. There is no simple, free tool to check these factors in one place.

### Target Users

- Web developers wanting to verify their sites
- Digital marketers assessing AI search readiness
- SEO professionals expanding into GEO (Generative Engine Optimization)
- IR/Corporate website teams at agencies

### Key Features

- Analyze any public URL instantly — no account required
- Scores 10 AI-search factors with weighted importance
- Returns a letter grade (A–D) and per-check score (0–100)
- Actionable recommendations per check (Critical → Low priority)
- Checks run in parallel — results in ~3–5 seconds
- Rate limiting prevents abuse (10 req/min per IP)
- SSRF protection — cannot scan internal/private networks

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | Full-stack React framework (App Router) |
| Language | TypeScript | 5.x | Strict type safety |
| UI | React | 19.x | UI rendering |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Validation | Zod | 4.x | Runtime schema validation |
| Icons | Lucide React | 0.474 | SVG icon library |
| Runtime | Node.js | 20.x | Server runtime |
| Process Manager | PM2 | latest | Production process management |
| Web Server | Nginx | latest | Reverse proxy + SSL termination |
| Hosting | AWS EC2 | t2/t3 | Singapore region |
| CDN / Proxy | Cloudflare | — | DDoS protection, HTTPS, caching |
| DNS | Cloudflare | — | DNS for `ohmai.me` |
| Source Control | GitHub | — | `github.com/Lalintia/aicheck` |

---

## 3. System Architecture

### Request Flow

```
User (Browser)
    │
    ▼
Cloudflare (CDN + DDoS protection + HTTPS)
    │
    ▼
Nginx (Port 443 → reverse proxy → Port 3001)
    │
    ▼
Next.js App (PM2 / ai-checker process on Port 3001)
    │
    ├── GET /          → Static HTML (pre-rendered)
    │
    └── POST /api/check
            │
            ├── middleware.ts (Rate limiting + Security headers)
            │
            └── app/api/check/route.ts
                    │
                    ├── Zod validation (URL normalize)
                    ├── SSRF check (isSafeUrlWithDns)
                    ├── Fetch target website HTML
                    │
                    └── 10 Checkers (run in parallel via Promise.all)
                            │
                            └── JSON Response → Browser
```

### Two-Phase Execution

The API runs checkers in two phases to avoid redundant fetches:

**Phase 1** (Sequential): `checkRobotsTxt` — fetches `robots.txt` and extracts sitemap URLs for use in Phase 2.

**Phase 2** (Parallel): All 9 remaining checkers run concurrently via `Promise.all`, passing `robots.txt` content to the sitemap checker to avoid a second HTTP request.

### Front-end State Machine

```
Initial State (HeroSection shown)
    │
    ├─[Submit URL]──► Loading State (Analyzing...)
    │                       │
    │               ┌───────┴───────┐
    │             Success         Error
    │               │               │
    │          ResultsView      Error Banner
    │               │               │
    └───────────────┴───[Reset]─────┘
                    │
              Initial State
```

---

## 4. Project Structure

```
ai-search-checker/
│
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── check/
│   │       └── route.ts          # POST /api/check — main analysis endpoint
│   ├── docs/
│   │   └── validation-criteria/
│   │       └── page.tsx          # /docs/validation-criteria page
│   ├── layout.tsx                # Root layout, metadata, Schema.org JSON-LD
│   ├── page.tsx                  # Homepage — orchestrates HeroSection & ResultsView
│   ├── error.tsx                 # Global error boundary (React)
│   ├── loading.tsx               # Suspense loading fallback
│   ├── icon.tsx                  # Dynamic favicon (32x32 SVG)
│   └── globals.css               # Global CSS (Tailwind base)
│
├── components/
│   └── features/
│       ├── checker/              # Input side of the app
│       │   ├── hero-section.tsx  # Hero heading + UrlForm wrapper
│       │   └── url-form.tsx      # URL input form, submit handler, error display
│       └── results/              # Output side of the app
│           ├── results-view.tsx  # Orchestrates all result components
│           └── components/
│               ├── score-display.tsx          # Overall score circle + grade badge
│               ├── stats-summary.tsx          # Passed / Warning / Failed counts
│               ├── checklist.tsx              # List of all 10 check results
│               ├── checklist-item.tsx         # Individual check row
│               ├── check-references.tsx       # Docs reference links per check
│               ├── schema-details.tsx         # Expandable Schema.org detail view
│               ├── recommendations.tsx        # All recommendations grouped by priority
│               ├── recommendation-group.tsx   # Single priority group (Critical, High…)
│               └── reset-button.tsx           # "Check another site" button
│
├── lib/
│   ├── checkers/                 # One file per AI-search factor
│   │   ├── base.ts               # Shared types, weights, grading, generateRecommendations
│   │   ├── schema-checker.ts     # Schema.org / JSON-LD validation
│   │   ├── robots-checker.ts     # robots.txt parser + AI bot access check
│   │   ├── llms-checker.ts       # llms.txt presence + format check
│   │   ├── sitemap-checker.ts    # Sitemap.xml discovery + validation
│   │   ├── opengraph-checker.ts  # Open Graph meta tags
│   │   ├── semantic-html-checker.ts  # Semantic element ratio check
│   │   ├── heading-checker.ts    # H1/H2/H3 hierarchy check
│   │   ├── faq-checker.ts        # FAQ Schema + Q&A pattern detection
│   │   ├── pagespeed-checker.ts  # TTFB measurement (ms)
│   │   ├── author-checker.ts     # Author / Publisher metadata (EEAT)
│   │   ├── schema-validators/    # Modular Schema.org type validators
│   │   │   ├── index.ts
│   │   │   ├── jsonld-utils.ts
│   │   │   ├── organization-validator.ts
│   │   │   ├── article-validator.ts
│   │   │   └── other-validators.ts
│   │   └── __tests__/            # Unit tests (31 tests)
│   │       └── schema-checker.test.ts
│   ├── types/
│   │   └── checker.ts            # All TypeScript interfaces & types
│   ├── utils/
│   │   └── check-helpers.ts      # UI helper functions (labels, colors, icons)
│   ├── validations/
│   │   └── url.ts                # Zod schema: URL normalize + validate
│   ├── rate-limiter.ts           # In-memory token bucket rate limiter
│   └── security.ts               # isSafeUrlWithDns (SSRF protection), safeFetch
│
├── public/                       # Static files served as-is
│   ├── robots.txt                # Crawler access policy for aicheck.ohmai.me
│   ├── sitemap.xml               # Sitemap for aicheck.ohmai.me
│   └── llms.txt                  # AI usage policy for aicheck.ohmai.me
│
├── docs/                         # Developer documentation (not served)
│   ├── VALIDATION_CRITERIA.md    # Detailed scoring criteria per check
│   └── UI_DESIGN.md              # UI/UX design spec
│
├── middleware.ts                 # Edge middleware: rate limit + security headers
├── next.config.ts                # Next.js config: standalone output, security headers
├── tailwind.config.ts            # Tailwind theme config
├── tsconfig.json                 # TypeScript strict mode config
└── package.json                  # Dependencies and npm scripts
```

---

## 5. API Documentation

### `POST /api/check`

Analyzes a website against 10 AI search readiness factors.

**Request**

```http
POST /api/check
Content-Type: application/json
```

```json
{
  "url": "www.example.com"
}
```

> URL is auto-normalized: `https://` is prepended if no protocol is given. Trailing slash is removed.

**Response — Success (200)**

```json
{
  "url": "https://www.example.com",
  "overallScore": 72,
  "grade": "good",
  "checks": {
    "schema": {
      "found": true,
      "score": 85,
      "details": "Organization + WebSite schema found",
      "data": { "types": ["Organization", "WebSite"] },
      "warnings": []
    },
    "robotsTxt": { "found": true, "score": 100, "details": "...", "data": {} },
    "llmsTxt":   { "found": false, "score": 0, "details": "...", "data": {} },
    "sitemap":   { ... },
    "openGraph": { ... },
    "semanticHTML": { ... },
    "headingHierarchy": { ... },
    "faqBlocks": { ... },
    "pageSpeed": { ... },
    "authorAuthority": { ... }
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "llms.txt",
      "message": "llms.txt file not found",
      "action": "Create llms.txt following Answer.AI standard"
    }
  ],
  "summary": {
    "passed": 6,
    "warning": 2,
    "failed": 2,
    "total": 10
  }
}
```

**Response — Error (400)**

```json
{ "error": "Please enter a valid URL (e.g., www.example.com)" }
{ "error": "Invalid URL. Cannot scan internal addresses." }
{ "error": "Unable to access website (403)" }
```

**Response — Rate Limited (429)**

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

Headers included: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

## 6. Data Models

### Core Types (`lib/types/checker.ts`)

```typescript
type CheckGrade = 'excellent' | 'good' | 'fair' | 'poor';
// Score:          90+           70–89   50–69   0–49

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

type CheckType =
  | 'schema' | 'robotsTxt' | 'llmsTxt' | 'sitemap'
  | 'openGraph' | 'semanticHTML' | 'headingHierarchy'
  | 'faqBlocks' | 'pageSpeed' | 'authorAuthority';

interface CheckResult {
  found: boolean;        // Whether the feature was detected
  score: number;         // 0–100
  details: string;       // Human-readable summary
  data: Record<string, unknown>;  // Raw data (for expandable UI)
  warnings?: string[];   // Non-blocking issues
}

interface CheckResponse {
  url: string;
  overallScore: number;  // Weighted average, 0–100
  grade: CheckGrade;
  checks: Record<CheckType, CheckResult>;
  recommendations: Recommendation[];
  summary: CheckSummary; // { passed, warning, failed, total }
}

interface Recommendation {
  priority: PriorityLevel;
  category: string;      // e.g. "Schema.org", "llms.txt"
  message: string;       // What's wrong
  action: string;        // What to do
}
```

---

## 7. Scoring & Business Logic

### Weights

Each check contributes a percentage to the `overallScore`. Weights are calibrated for AI search readiness in 2025–2026:

| # | Check | Weight | Rationale |
|---|-------|:------:|-----------|
| 1 | Schema.org (JSON-LD) | **25%** | Highest impact — AI reads structured data directly |
| 2 | robots.txt | **20%** | Controls whether AI bots can crawl at all |
| 3 | Sitemap.xml | **15%** | Helps AI discover and index all pages |
| 4 | Page Speed (TTFB) | **10%** | Slow sites = fewer crawl budget allocations |
| 5 | Semantic HTML | **10%** | Clean HTML structure = easier AI parsing |
| 6 | Heading Hierarchy | **10%** | Clear H1→H2→H3 helps AI understand page structure |
| 7 | llms.txt | **5%** | Emerging standard — adoption still growing |
| 8 | FAQ / QA Blocks | **3%** | Bonus for Q&A format favored by AI answers |
| 9 | Author Authority (EEAT) | **2%** | Important for YMYL, optional for others |
| 10 | Open Graph | **0%** | Social media only — not relevant for AI search |

### Score Calculation

```
overallScore = Σ (check.score × weight / 100)  [rounded to integer]
```

### Grade Thresholds

| Grade | Score | Label |
|-------|-------|-------|
| excellent | ≥ 90 | Excellent |
| good | 70–89 | Good |
| fair | 50–69 | Needs Improvement |
| poor | < 50 | Poor |

### Check Status Thresholds (for UI display)

| Status | Condition |
|--------|-----------|
| ✅ Good | score ≥ 70 |
| ⚠️ Warning | score 50–69 |
| ❌ Failed | score < 50 |

### URL Normalization Pipeline

```
Input: "www.example.com"
 → trim whitespace
 → prepend "https://" if no protocol
 → validate with new URL() constructor
 → validate regex: /^https?:\/\/[\w\-\.]+\.[a-zA-Z]{2,}(\/\S*)?$/
 → remove trailing slash
Output: "https://www.example.com"
```

---

## 8. Security

### Rate Limiting

- **Limit:** 10 requests per minute per IP address
- **Algorithm:** Token bucket (in-memory, `lib/rate-limiter.ts`)
- **Response:** HTTP 429 with `Retry-After` header
- **Bypass:** If client IP cannot be determined, falls back to infrastructure-level limiting (Cloudflare/Nginx)
- **IP Extraction:** Uses `x-forwarded-for` last entry (reverse-proxy appended) to prevent header spoofing

### SSRF Protection (`lib/security.ts`)

Prevents users from scanning internal/private networks:
- Blocks: `localhost`, `127.x.x.x`, `10.x.x.x`, `192.168.x.x`, `169.254.x.x`, `::1`
- DNS resolution check: resolves hostname before fetching — catches rebinding attacks
- Only `http:` and `https:` protocols are allowed

### Security Headers (via `middleware.ts` + `next.config.ts`)

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | Restrictive CSP |
| `X-Powered-By` | Removed (fingerprinting prevention) |

### Input Validation

- URL validated via Zod schema before any processing
- HTML response capped at 10MB to prevent memory exhaustion
- Fetch timeout: 30 seconds (AbortController)

---

## 9. Environment Variables

Create `.env.local` for local development (never commit to git):

```env
# Site URL (used for metadata and Schema.org)
NEXT_PUBLIC_SITE_URL=https://aicheck.ohmai.me
```

No external API keys are required — all checks are self-contained HTTP fetches.

---

## 10. Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Clone
git clone git@github.com:Lalintia/aicheck.git
cd aicheck

# Install dependencies
npm install

# Copy env
cp .env.example .env.local

# Start dev server
npm run dev
```

App available at `http://localhost:3000`

### Available Scripts

```bash
npm run dev      # Start dev server (hot reload)
npm run build    # Production build → .next/
npm run start    # Start production server locally
npm run lint     # ESLint check
npm run test     # Run unit tests (31 tests)
```

---

## 11. Testing

Unit tests are located in `lib/checkers/__tests__/` and `lib/checkers/schema-validators/__tests__/`.

### Run Tests

```bash
npm run test
```

Uses Node.js native test runner (`--test`) via `tsx`. No Jest or Vitest required.

### Test Coverage

| File | Tests |
|------|-------|
| `schema-checker.test.ts` | Schema.org detection |
| `schema-validators/__tests__/organization-validator.test.ts` | Organization schema |
| `schema-validators/__tests__/article-validator.test.ts` | Article schema |
| `schema-validators/__tests__/other-validators.test.ts` | FAQ, WebSite, etc. |

**Total: 31 unit tests**

---

## 12. Deployment

### Build & Deploy (Full Process)

```bash
# 1. Build — from local machine
cd "/Users/alienmacbook/Desktop/OhmProject/AI Search Project/aicheck"
npm run build

# 2. Copy static assets into standalone output
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 3. Upload to EC2 (rsync — target MUST be .next/standalone/ to match PM2 cwd)
# Use --no-owner --no-group --no-perms to avoid permission errors when
# existing server files are owned by a different uid.
# 3a. Upload standalone app
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i '/Users/alienmacbook/Desktop/Keypair/n8n-singapore-key.pem'" \
  .next/standalone/ \
  ubuntu@54.169.168.58:/var/www/ai-checker/

# 3b. Upload static assets (required — standalone does NOT include these)
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i '/Users/alienmacbook/Desktop/Keypair/n8n-singapore-key.pem'" \
  .next/static/ \
  ubuntu@54.169.168.58:/var/www/ai-checker/.next/static/

# 3c. Upload public files
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i '/Users/alienmacbook/Desktop/Keypair/n8n-singapore-key.pem'" \
  public/ \
  ubuntu@54.169.168.58:/var/www/ai-checker/public/

# 4. Restart app
ssh -i "/Users/alienmacbook/Desktop/Keypair/n8n-singapore-key.pem" \
  ubuntu@54.169.168.58 \
  "pm2 restart ai-checker"
```

### SSH Key Location

```
/Users/alienmacbook/Desktop/Keypair/n8n-singapore-key.pem
```

### GitHub

```bash
# Push with correct SSH key
GIT_SSH_COMMAND="ssh -i /Users/alienmacbook/.ssh/id_aichecker_new" git push origin main
```

---

## 13. Infrastructure

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare                        │
│  DNS: aicheck.ohmai.me → 54.169.168.58              │
│  HTTPS: Cloudflare SSL cert                         │
│  CDN: Static asset caching                          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS (443)
┌──────────────────────▼──────────────────────────────┐
│              AWS EC2 — Singapore                    │
│  IP: 54.169.168.58                                  │
│  OS: Ubuntu                                         │
│  App Path: /var/www/ai-checker/              │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Nginx (Reverse Proxy)                      │    │
│  │  Port 443 → Port 3001 (ai-checker process)  │    │
│  │  SSL: Let's Encrypt via Certbot             │    │
│  └──────────────────────┬──────────────────────┘    │
│                         │                           │
│  ┌──────────────────────▼──────────────────────┐    │
│  │  PM2 Process Manager                        │    │
│  │  Name: ai-checker  (ID: 2)   Port: 3001     │    │
│  │  Script: /var/www/ai-checker/server.js│   │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Key Server Paths

| Item | Path |
|------|------|
| App files | `/var/www/ai-checker/` |
| Nginx config | `/etc/nginx/sites-enabled/` |
| SSL certs | `/etc/letsencrypt/live/aicheck.ohmai.me/` |

---

## 14. Monitoring & Debugging

### SSH into Server

```bash
ssh -i "/Users/alienmacbook/Desktop/ohm website/n8n-singapore-key.pem" ubuntu@54.169.168.58
```

### PM2 Commands

```bash
pm2 status                  # Show all processes
pm2 logs ai-checker         # Live logs
pm2 logs ai-checker --lines 100  # Last 100 log lines
pm2 restart ai-checker      # Restart app
pm2 reload ai-checker       # Zero-downtime reload
```

### Nginx Commands

```bash
sudo nginx -t                        # Test config syntax
sudo systemctl reload nginx          # Reload config (no downtime)
sudo systemctl status nginx          # Check Nginx status
sudo tail -f /var/log/nginx/error.log  # Nginx error log
```

---

## 15. Roadmap

### Planned Features

- [ ] **History & Comparison** — Save scan results to database, compare over time
- [ ] **PDF Export** — Download full report as PDF
- [ ] **Bulk URL Scanning** — Scan multiple pages at once
- [ ] **Thai Language UI** — Toggle between EN/TH
- [ ] **API Key Access** — Allow programmatic access for agencies
- [ ] **Docker Compose** — Local dev environment containerized
- [ ] **Webhook / Scheduled Scans** — Auto-scan on schedule, notify on score drop

### Known Limitations

- `pageSpeed` score is based on TTFB only (time to first byte) — not a full Core Web Vitals audit
- `openGraph` check runs but has 0% weight (kept for future use)
- Rate limiter is in-memory — resets on process restart, not shared across multiple instances

---

**Repository:** https://github.com/Lalintia/aicheck
**Live URL:** https://aicheck.ohmai.me
**Support:** support@aicheck.ohmai.me
