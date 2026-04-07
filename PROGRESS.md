# AI Search Checker — Progress Report

**โปรเจกต์:** aicheck (https://aicheck.ohmai.me)
**Repo:** github.com/Lalintia/aicheck
**AWS:** EC2 Singapore (54.169.168.58) — PM2 process `ai-checker` port 3001

---

## อัปเดตล่าสุด — 7 เมษายน 2569

### Scorer Recalibration — ปลดล็อกเพดาน 75/100

**ปัญหา:** เว็บ world-class (Stripe, Yoast, MDN, Wikipedia) ได้คะแนนสูงสุดแค่ ~75/100 ทั้งที่เป็น gold standard ของ AI-friendly web — แม้แต่ Yoast (บริษัท SEO เบอร์ 1 ของโลก) ยังได้แค่ 75

**Root cause:** Checker 3 ตัวมี calibration bug:

| Checker | Bug | ผลกระทบ |
|---|---|---|
| `semantic-html` | `divRatio > 10` penalty -20 เข้มเกินไปสำหรับ React/Next.js | ทุกเว็บ SPA โดนหัก 20 แต้ม |
| `author-checker` | ตรวจแค่ `<meta name="author">` — เว็บสมัยใหม่ย้ายไป JSON-LD | NYT ได้ 35/100 ทั้งที่มี byline ครบ |
| `image-checker` | Placeholder penalty ไม่มี cap → score ตก 0 | Stripe/NYT/Yoast ได้ 0 แม้มี alt text |

**วิธีแก้:**

1. **`lib/checkers/semantic-html-checker.ts`**
   - ผ่อน threshold: `>10/>5` → `>50/>20`
   - ซอฟต์ penalty: `-20/-10` → `-15/-8`
   - Extract magic numbers เป็น constants (`DIV_RATIO_SEVERE`, ฯลฯ)

2. **`lib/checkers/author-checker.ts`**
   - เพิ่ม JSON-LD patterns: `jsonld-author`, `jsonld-publisher`, `datePublished`
   - Rename keys: `author` → `meta-author`, `publisher` → `meta-publisher`
   - Logic `hasAuthor`/`hasPublisher` รวม meta + JSON-LD sources

3. **`lib/checkers/image-checker.ts`**
   - Cap placeholder penalty ที่ 15 (เดิมไม่มี cap)
   - Figure/ImageObject penalty: 10→5, 5→3 (nice-to-have ไม่ใช่ critical)

**Results (before → after, verified on production):**

| เว็บ | ก่อน | หลัง | Δ |
|---|---:|---:|---:|
| Yoast | 75 | **79** | +4 |
| Stripe | 72 | **75** | +3 |
| Wikipedia | 66 | **70** | +4 |
| NYT | 58 | **63** | +5 |
| MDN | 62 | 62 | 0 |
| Anthropic | 59 | 59 | 0 |
| SCB | 51 | **53** | +2 |
| PTTEP | 49 | **51** | +2 |
| SET | 47 | 47 | 0 |
| Thai Bev | 29 | **31** | +2 |

**เพดานใหม่:** ~95/100 (เดิม ~80) — สูงพอที่เว็บที่ทำครบทุกอย่างจริงๆ จะได้ A-grade

**Process:**
- แก้ทีละ checker + รัน 31 unit tests หลังแต่ละการแก้
- Code review ด้วย 3 review agents (reuse / quality / efficiency) หลังแต่ละ fix
- Reviewer เจอ bug เพิ่ม: floor 85 ใน semantic-html bypass penalty → ลบออก
- Reviewer เจอ regex nested-object bug ใน author JSON-LD → แก้เป็น permissive heuristic
- Reviewer เจอ double-penalty ใน image placeholder → ลด cap จาก 25 เป็น 15

**Deploy gotcha:**
- Deploy doc เดิมบอก rsync → `/var/www/ai-search-checker/` แต่ PM2 จริงรันจาก `.next/standalone/server.js`
- ต้อง rsync ไปที่ `/var/www/ai-search-checker/.next/standalone/` แทน
- ไฟล์เก่าบน server owned by `uid 501 staff` (macOS) → ต้องใช้ `--no-owner --no-group --no-perms`
- แก้ `PROJECT_SUMMARY.md` deploy section แล้ว

**Git:**
- Branch: `fix/scorer-calibration`
- Commit: `d43733f`
- PR: https://github.com/Lalintia/aicheck/pull/1

---

## อัปเดต — 2 เมษายน 2569

### 1. แยก AI Visibility เป็นหน้าแยก (13 → 12 checks)

**เหตุผล:** AI Visibility ใช้ OpenAI API มีค่าใช้จ่าย — แยกออกเป็น feature ต่างหากให้ผู้ใช้เลือกเอง

| Feature | URL | API | ค่าใช้จ่าย |
|---|---|---|---|
| **12 Checks** (หลัก) | `/` | `/api/check` | ฟรี |
| **AI Visibility** (แยก) | `/ai-check` | `/api/ai-check` | ~$0.001/ครั้ง (GPT-4.1 nano) |

**น้ำหนัก 12 ข้อ (ปรับใหม่ รวม 100%):**

| # | Checker | น้ำหนัก |
|---|---|---|
| 1 | Schema.org (JSON-LD) | 20% |
| 2 | SSR/CSR Detection | 15% |
| 3 | robots.txt | 12% |
| 4 | Heading Hierarchy | 9% |
| 5 | Image AI Readiness | 8% |
| 6 | Semantic HTML | 7% |
| 7 | Sitemap.xml | 7% |
| 8 | Open Graph | 5% |
| 9 | llms.txt | 5% |
| 10 | FAQ/QA Blocks | 4% |
| 11 | Author Authority (E-E-A-T) | 3% |
| 12 | Page Speed | 5% |

**ไฟล์ใหม่:**
- `app/ai-check/page.tsx` — หน้า AI Visibility (neural-glow design, gradient ม่วง-ฟ้า)
- `app/api/ai-check/route.ts` — API endpoint แยก
- `components/site-nav.tsx` — Floating pill navigation (12 Checks / AI Visibility)

**ไฟล์ที่แก้ไข:**
- `lib/types/checker.ts` — ลบ `aiVisibility` ออกจาก CheckType
- `lib/checkers/base.ts` — ลบ aiVisibility จาก weights, ปรับน้ำหนักใหม่
- `lib/checkers/index.ts` — ลบ export checkAIVisibility
- `app/api/check/route.ts` — ลบ aiVisibility จาก Promise.all, total 12
- `lib/utils/check-helpers.ts` — ลบ aiVisibility label, ปรับ weights
- `lib/i18n/en.ts`, `th.ts`, `types.ts` — เพิ่ม aiCheck translations, แก้ 13→12
- `components/features/results/components/checklist.tsx` — ลบ aiVisibility จาก order
- `components/features/results/components/checklist-item.tsx` — ลบ AI badge
- `app/page.tsx` — เพิ่ม SiteNav
- `app/globals.css` — เพิ่ม neural-glow CSS

### 2. Code Review + Fix 22 Issues (High/Medium/Low)

รัน 3 review agents พร้อมกัน: React/TypeScript, Performance/Error, Security

#### แก้ไขแล้ว — High (8 ตัว)
| # | Issue | ไฟล์ | วิธีแก้ |
|---|---|---|---|
| 1 | ReDoS `stripHtmlTags` | `ssr-checker.ts` | indexOf loop แทน `[\s\S]*?` regex |
| 2 | ReDoS SSR indicators | `ssr-checker.ts` | `hasSubstantialContent()` แทน `[\s\S]{100,}` |
| 3 | SSRF IPv6 DNS gap | `security.ts` | `lookup({all: true})` + `isPrivateIPv6()` |
| 4 | safeFetch signal check | `security.ts` | เช็ค `signal.aborted` ก่อน redirect |
| 5 | Reserved IP 240.0.0.0/4 | `security.ts` | เพิ่ม `if (a >= 240) return true` |
| 6 | IP spoofing x-forwarded-for | `middleware.ts` | ใช้ last entry แทน first |
| 7 | Unsafe `as` cast | `checklist-item.tsx` | Runtime `Array.isArray()` check |
| 8 | `<h4>` inside `<button>` | `check-references.tsx` | เปลี่ยนเป็น `<span>` |

#### แก้ไขแล้ว — Medium (10 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 9 | Non-null assertions `!` × 10 | `base.ts` |
| 10 | Duplicate `CheckType` | `base.ts` + `types/checker.ts` |
| 11 | ReDoS faq-checker `[^<]*` | `faq-checker.ts` |
| 12 | ReDoS author-checker alternation | `author-checker.ts` |
| 13 | Unbounded image array | `image-checker.ts` |
| 14 | Prompt injection defense | `ai-visibility-checker.ts` |
| 15 | `console.error` in production × 3 | `route.ts` + `ai-visibility-checker.ts` |
| 16 | `aria-expanded`/`aria-controls` | `schema-details.tsx` |
| 17 | `rawContent` leaked in API | `route.ts` |
| 18 | `rawResponse` leaked in error | `ai-visibility-checker.ts` |

#### แก้ไขแล้ว — Low (4 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 19 | Redundant regex refine (ReDoS) | `url.ts` |
| 20 | Incomplete Permissions-Policy | `next.config.ts` |
| 21 | Trailing blank line | `rate-limiter.ts` |
| 22 | Schema expand aria-label | `schema-details.tsx` |

### 3. AWS Instance Recovery

- Instance networking ค้าง — SSH/HTTP/HTTPS timeout ทุก port
- Reboot ไม่แก้ — ต้อง Stop + Start ใหม่ถึง reset networking stack
- Instance กลับมาปกติ IP เดิม (Elastic IP 54.169.168.58)

### 4. Deploy ขึ้น AWS

- [x] Build production
- [x] Package standalone + upload to EC2
- [x] PM2 restart `ai-checker` port 3001
- [x] ยืนยัน HTTP 200 ผ่าน Cloudflare

---

## ประวัติ — 27 มีนาคม 2569

### Setup & Sync
- Clone repo, copy agent skills, sync deploy/server.js
- ลบ PM2 process ซ้ำ

### เพิ่ม 3 Checkers (10 → 13 ข้อ)
- SSR/CSR Detection, Image AI Readiness, AI Visibility Check

### Redesign UI — Arctic Frost Theme
- สี: Ice Blue `#f4f8fc`, Steel Blue `#4a6fa5`
- Font: Satoshi + JetBrains Mono
- Effects: parallax orbs, staggered animations, SVG ring gauge

### ระบบ i18n (TH/EN)
- `lib/i18n/` — types, en, th, context + hook
- ปุ่ม EN/TH มุมขวาบน

---

## Git Commits

| Hash | Message |
|---|---|
| `03b44bb` | fix: center navigation pill menu on both pages |
| `6a031a7` | feat: separate AI Visibility into standalone page, reduce to 12 checks |
| `067fe56` | fix: resolve 22 security, performance, and code quality issues |
| `d2f27c6` | fix: security hardening and bug fixes across 7 files |
| `9d0df93` | feat: upgrade to 13 checks, Arctic Frost UI redesign, i18n TH/EN |

---

## อัปเดต — 3 เมษายน 2569

### 1. อัปเดต VALIDATION_CRITERIA.md ให้ครอบคลุม 12 ข้อ
- เพิ่ม 4 checkers ใหม่: SSR/CSR Detection, Image AI Readiness, FAQ/QA Blocks, Author Authority (E-E-A-T)
- ลบ Canonical URLs และ Mobile Responsiveness (ไม่มีใน current checks)
- อัปเดตน้ำหนักทั้งหมดให้ตรงกับ `lib/checkers/base.ts`

### 2. ตั้ง OPENAI_API_KEY บน EC2
- สร้าง `.env` ที่ `/var/www/ai-search-checker/.env` (permissions 600)
- PM2 restart แล้วใช้งานได้

### 3. ทดสอบ AI Visibility page
- ทดสอบกับ ohmai.me — GPT-4.1 nano ตอบกลับปกติ (score 0/100 เพราะเว็บใหม่)
- API key ทำงานถูกต้อง ไม่มี error

### 4. เพิ่ม AI Rate Limiter (3 req/min)
- สร้าง `aiRateLimiter` แยกจาก rate limiter ทั่วไป
- `/api/ai-check` จำกัด 3 req/min per IP (ป้องกันค่าใช้จ่าย OpenAI)
- `/api/check` ยังคง 10 req/min per IP เหมือนเดิม

**ไฟล์ที่แก้ไข:**
- `docs/VALIDATION_CRITERIA.md` — rewrite ทั้งหมดสำหรับ 12 checks
- `lib/rate-limiter.ts` — เพิ่ม `AIRateLimiter` class + export `aiRateLimiter`
- `middleware.ts` — เพิ่ม AI rate limit check สำหรับ `/api/ai-check`

## อัปเดต — 3 เมษายน 2569 (ช่วงบ่าย)

### 1. อัปเกรด AI Visibility Scoring: 3 มิติ → 6 มิติ

**ปัญหาเดิม:** ทุกเว็บดังได้ 85/100 เหมือนกันหมด (knows 50 + partial 15 + URL 20 = 85)

**Scoring ใหม่ (6 มิติ รวม 100 คะแนน):**

| # | มิติ | คะแนนเต็ม | วิธีวัด |
|---|---|---|---|
| 1 | AI Recognition | 25 | AI รู้จักเว็บ/องค์กรไหม |
| 2 | Accuracy | 20 | ข้อมูลถูกต้องแค่ไหน (accurate/partial/inaccurate) |
| 3 | URL Known | 10 | AI บอก URL ได้ถูกไหม |
| 4 | Knowledge Depth | 15 | รู้ลึกแค่ไหน (deep/moderate/shallow/none) |
| 5 | Products/Services | 15 | บอกชื่อสินค้า/บริการเฉพาะได้ไหม |
| 6 | Google Presence | 15 | ติดอันดับ Google Search ไหม (ใหม่!) |

### 2. เพิ่ม Google Custom Search API

- เปิด Custom Search API บน Google Cloud project "ohmai"
- สร้าง API Key 2 ตัว:
  - `Custom Search` (เดิม): `AIzaSyDXutiUCs74N13k1Vozjo3bhcUNe14wzno`
  - `CSE Unrestricted` (ใหม่): `AIzaSyAVVETa2igp-dwbIdcSJHFo_hAK8NxfdGw`
- Search Engine ID (cx): `6337f6f65d32541d7` (restrict www.google.com) + `768a9d311842e4066` (ตัวใหม่)
- ฟรี 100 req/วัน, หลังจากนั้น 0.16 บาท/ครั้ง
- ตั้ง `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX` บน EC2
- **Billing activated** — free trial upgrade เป็น full account แล้ว (3 เม.ย. 2569)
- **ปัญหาที่ยังเหลือ:** Google CSE API ยัง 403 — อาจเป็น propagation delay หลัง re-enable + billing activate
  - ทดสอบซ้ำด้วย: `curl "https://www.googleapis.com/customsearch/v1?key=AIzaSyAVVETa2igp-dwbIdcSJHFo_hAK8NxfdGw&cx=6337f6f65d32541d7&q=test&num=1"`
  - CSE ยัง restrict site เป็น www.google.com — ต้องเปิด "Search the entire web" (toggle disabled ใน UI)

### 3. ปรับ UI ผลลัพธ์

- เปลี่ยน 3 การ์ดเดิม → **6 การ์ดมิติ** (grid 2x3)
- เพิ่ม **Score Breakdown bar** แสดงคะแนนแต่ละมิติ
- เพิ่ม **Scoring Criteria** อธิบายเกณฑ์ให้คะแนน (EN + TH)

### 4. Deploy ขึ้น AWS

- [x] Build production
- [x] Package standalone + upload to EC2
- [x] เพิ่ม env vars (GOOGLE_CSE_API_KEY, GOOGLE_CSE_CX)
- [x] PM2 restart `ai-checker` port 3001
- [x] ยืนยัน HTTP 200

**ไฟล์ที่แก้ไข:**
- `lib/checkers/ai-visibility-checker.ts` — rewrite scoring 6 มิติ + Google Search
- `app/ai-check/page.tsx` — UI 6 การ์ด + breakdown + criteria
- `lib/i18n/types.ts` — เพิ่ม type definitions
- `lib/i18n/en.ts` — เพิ่ม EN translations
- `lib/i18n/th.ts` — เพิ่ม TH translations

**Git Commit:**
- `68b7cc3` — feat: upgrade AI Visibility scoring from 3 to 6 dimensions + Google Search

**SSH Key ที่ใช้ได้:** `~/Desktop/Keypair/n8n-singapore-key-ed25519.pem`

---

## อัปเดต — 7 เมษายน 2569

### 1. แก้ Google Presence: เปลี่ยนจาก Google CSE → Serper API

**ปัญหา:** Google Custom Search JSON API **ปิดรับลูกค้าใหม่แล้ว** (ลูกค้าเดิมใช้ได้ถึง 1 ม.ค. 2570)
- ลองสร้าง project ใหม่ 2 ตัว + enable API + ผูก billing → ยัง 403 ทุกครั้ง
- Error: "This project does not have the access to Custom Search JSON API"

**วิธีแก้:** เปลี่ยนไปใช้ **Serper.dev API** (ฟรี 2,500 queries, ไม่ต้องบัตรเครดิต)
- สมัคร serper.dev → ได้ API key ทันที
- แก้โค้ด `searchGoogle()` ใน `ai-visibility-checker.ts` ให้เรียก Serper แทน Google CSE
- ทดสอบ google.com → **100/100** (Google Presence 15/15) ✅

**ไฟล์ที่แก้:**
- `lib/checkers/ai-visibility-checker.ts` — เปลี่ยน API endpoint เป็น Serper
- `.env.example` — เพิ่ม `SERPER_API_KEY`

**Env vars บน EC2:**
- `SERPER_API_KEY` — ตั้งผ่าน PM2 inline env
- `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX` — ยังอยู่ใน `.env` แต่โค้ดไม่ใช้แล้ว

### 2. Full Code Review — 3 Agents (Security + Performance + React/TS)

รัน `/review-all` พบ **33 issues** → แก้ **25 ตัว**

#### แก้ไขแล้ว — Critical (3 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 1 | `safeCheck` กลืน error ไม่ log | `api/check/route.ts` |
| 2 | Top-level catch ไม่ log error | `api/check/route.ts` + `api/ai-check/route.ts` |
| 3 | `as` casts ปิด TypeScript safety | `ai-check/page.tsx` |

#### แก้ไขแล้ว — High (8 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 1 | Content-Length: -1 bypass | ทั้ง 2 route.ts |
| 2 | ai-check HTML body ไม่มี size limit | `api/ai-check/route.ts` |
| 3 | SSR checker ReDoS regex `[\s\S]*` | `ssr-checker.ts` |
| 4 | Missing `aria-describedby` (WCAG) | `ai-check/page.tsx` |
| 5 | Score ring SVG ไม่มี accessible label | `ai-check/page.tsx` |
| 6 | Buttons ไม่มี `type="button"` | `ai-check/page.tsx` |
| 7 | Over-memoization `useMemo` | `ai-check/page.tsx` |
| 8 | ไฟล์ `check-references.tsx` เกิน 300 บรรทัด | แยก data → `lib/data/checkReferences.ts` |

#### แก้ไขแล้ว — Medium (10 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 1 | IPv6 Teredo/6to4 ไม่ถูก block | `lib/security.ts` |
| 2 | IPv6 format validation ไม่เข้มงวด | `middleware.ts` |
| 3 | Serper API response ไม่มี size limit | `ai-visibility-checker.ts` |
| 4 | Sitemap concurrency ไม่จำกัด | `sitemap-checker.ts` |
| 5 | Decorative icons ไม่มี `aria-hidden` | `recommendation-group.tsx` |
| 6 | `criteriaItems` type ไม่ readonly | `lib/i18n/types.ts` |
| 7 | `callOpenAI` error body read ไม่มี timeout | `ai-visibility-checker.ts` |
| 8 | TrustIndicator re-render ทุกครั้ง | `hero-section.tsx` |
| 9 | Skip link อยู่หลัง nav | `page.tsx` + `ai-check/page.tsx` |
| 10 | `getStatusInfo` duplicate | ลบจาก `check-helpers.ts` |

#### แก้ไขแล้ว — Low (4 ตัว)
| # | Issue | ไฟล์ |
|---|---|---|
| 1 | i18n context default ไม่มี warning | `lib/i18n/index.ts` |
| 2 | Unused `StatusInfo` import | `check-helpers.ts` |
| 3 | `ReadonlyArray` type consistency | `ai-check/page.tsx` |
| 4 | checkReferences data ปนอยู่ใน component | `check-references.tsx` → `lib/data/` |

### 3. Global Agents Setup

ย้าย 6 custom agents จาก project-level → global (`~/.claude/agents/`):
- `lead`, `backend`, `frontend`, `qa`, `reviewer`, `doc-writer`
- รวมกับ global เดิม: `security-auditor`, `performance-error-reviewer`, `react-typescript-reviewer`
- **รวม 9 agents** ใช้ได้ทุก project

### 4. Deploy ขึ้น AWS (3 ครั้ง)

- [x] Build production × 3
- [x] Package standalone + upload to EC2
- [x] PM2 restart with inline env vars (SERPER_API_KEY + OPENAI_API_KEY + PORT)
- [x] PM2 save
- [x] ยืนยัน HTTP 200 ผ่าน Cloudflare

**Git Commits:**
- `7cc6221` — feat: replace Google CSE with Serper API for Google Presence scoring
- `a5e2998` — fix: resolve 11 critical/high issues from full code review
- `8437b04` — fix: resolve medium/low issues from code review
- `a08ba2d` — refactor: resolve remaining low issues from code review

---

## สถานะปัจจุบัน

- **เว็บ live:** https://aicheck.ohmai.me ✅
- **AI Visibility:** https://aicheck.ohmai.me/ai-check ✅ (6 มิติ + Serper Google Search)
- **Google Presence:** ทำงานแล้ว ✅ (Serper API, ฟรี 2,500 queries)
- **Local = GitHub = AWS:** ทั้ง 3 ตรงกัน ✅
- **Code review:** 25/33 issues แก้ครบ (Critical/High ครบ 100%) ✅
- **AI Rate Limit:** 3 req/min per IP ✅

## TODO

- [ ] พิจารณาเปลี่ยนรูป project cards ที่ ohmai.me เป็น screenshot จริงแทน stock photos
- [ ] Refactor `ai-check/page.tsx` (620+ บรรทัด) แยก AICheckResult/CriteriaCard เป็นไฟล์แยก
- [ ] เพิ่ม i18n สำหรับ `schema-details.tsx` (hardcoded English)
- [ ] Restrict EC2 security group ให้รับ traffic จาก Cloudflare IPs เท่านั้น
- [ ] ลบ GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX ออกจาก `.env` บน EC2 (ไม่ใช้แล้ว)

---

## อัปเดต — 7 เมษายน 2569 (ช่วงเย็น)

### 1. เพิ่มมิติที่ 7: AI Overview (Knowledge Graph Detection)

**ปัญหาเดิม:** Google Presence (มิติที่ 6) ตรวจแค่ SEO ranking แบบเดิม ไม่เกี่ยวกับ AI เลย — ไม่เข้ากับ concept ของ AI Visibility ที่ควรวัดว่า "AI รู้จักแบรนด์แค่ไหน"

**แก้ไข:** เพิ่มมิติที่ 7 **AI Overview** ที่เช็ค Google Knowledge Graph + Answer Box (สิ่งที่ Google AI Overview, ChatGPT, Gemini ใช้อ้างอิงแบรนด์)

**Scoring ใหม่ (7 มิติ รวม 100 คะแนน):**

| # | มิติ | คะแนนเดิม | คะแนนใหม่ |
|---|---|---|---|
| 1 | AI Recognition | 25 | **20** |
| 2 | Accuracy | 20 | **15** |
| 3 | URL Known | 10 | 10 |
| 4 | Knowledge Depth | 15 | 15 |
| 5 | Products Known | 15 | 15 |
| 6 | Google Presence | 15 | **10** |
| 7 | **AI Overview (NEW)** | - | **15** |

**Implementation:**
- เพิ่ม `searchKnowledgeGraph()` ใน `ai-visibility-checker.ts`
- ใช้ Serper query `"{brand} company"` เพื่อ disambiguate (apple → Apple Inc. แทนผลไม้)
- Parse `data.knowledgeGraph` และ `data.answerBox` จาก Serper response
- Run 3 parallel calls ด้วย `Promise.allSettled` (GPT + 2 Serper)
- สร้าง `extractSecondLevelDomain()` helper สำหรับ subdomain + 2-level TLDs (.co.th, .co.uk)

**Scoring formula:**
- Knowledge Graph + Answer Box → 15 points (Full Entity)
- Knowledge Graph only → 12 points (Knowledge Panel)
- Answer Box only → 6 points (Answer Only)
- None → 0 points (Not Indexed)

### 2. เพิ่ม "How we detect this" explanation

ทุก criterion ในหน้า `/ai-check` มี **expandable card** อธิบาย 3 ส่วน:
- **Why it matters** (ทำไมถึงสำคัญ)
- **How to improve** (วิธีปรับปรุง)
- **How we detect this** (อธิบาย algorithm/API ที่ใช้ตรวจ)

**Example — AI Overview:**
> เรียก Serper.dev ด้วย query "{brand} company" แล้วเช็คว่า response มี `knowledgeGraph` และ `answerBox` หรือไม่ สัญญาณทั้งสองนี้คือสิ่งที่ Google AI Overview ใช้ตัดสินใจว่าจะอ้างอิงแบรนด์ไหน

เพิ่มเพื่อให้ product **transparent 100%** ลูกค้าถามว่า "ข้อนี้ตรวจยังไง?" → คลิกขยายดูได้เอง

### 3. ทดสอบกับเว็บจริง 5 ตัว

| เว็บ | คะแนน | Insight |
|---|---|---|
| **apple.com** | **97/100** | Full entity, ทุกมิติเกือบเต็ม (KG 12/15) |
| **amazon.com** | **97/100** | Full entity, AI รู้จักดีมาก |
| **ptt.com** | **22/100** | KG 12/15 แต่ AI Recognition 0/20 — GPT ไม่ train แบรนด์ไทย |
| **ptgenergy.co.th** | **20/100** | SEO 10/10 แต่ไม่มี Knowledge Graph |
| **sorkon.co.th** | **16/100** | SEO ดีแต่ AI ไม่รู้จักเลย — case study หลัก |

**Key insight สำหรับ Sale:** แบรนด์ไทยใหญ่ๆ มี pattern เหมือนกัน — **SEO ดี (10/10) แต่ AI มองไม่เห็น** ใช้เป็น selling point GEO audit ได้ทันที

### 4. Full Code Review รอบ 2 — แก้ 6 Critical/High Issues

รัน `/review-all` หลังเพิ่ม Knowledge Graph feature พบ **15 issues ใหม่** → แก้ **Critical + High ทั้ง 6 ตัว**

**Critical (2):**
- ✅ `Promise.all` fail-fast → เสีย Serper quota — เปลี่ยนเป็น `Promise.allSettled`
- ✅ `as` cast ปิด TypeScript safety — เพิ่ม `parseGooglePresence()` + `parseKnowledgeGraph()` type guards

**High (4):**
- ✅ `brandName` ไม่ sanitize → query injection — `.replace(/[^\w\s-]/g, '')` + `.slice(0, 50)`
- ✅ `jsonTimeout` race condition — refactor ใช้ try/finally
- ✅ `CriteriaCard` ไม่มี `aria-controls` + panel role — WCAG compliant
- ✅ Disabled button ลบ keyboard access — render เป็น `<div>` เมื่อไม่มี details

**Medium (4):**
- ✅ `extractSecondLevelDomain` — handle subdomain + 2-level TLDs (.co.th)
- ✅ Error logging ใน `serperSearch`
- ✅ `React.memo` wrap CriteriaCard
- ✅ Narrow `useMemo` dependencies

### 5. Rename: Knowledge Graph → AI Overview

เปลี่ยนชื่อ dimension "Knowledge Graph" เป็น **"AI Overview"** เพื่อให้สื่อสารง่ายขึ้น — ลูกค้าเข้าใจทันทีว่าเกี่ยวกับ Google AI Overview ที่เจออยู่ใน Google Search (logic ยังเหมือนเดิม)

### 6. Legacy Docs Cleanup + Project Documentation

**ลบเอกสารเก่า 7 ไฟล์** ที่ parent folder (AI Search Project/):
- AI_SEARCH_PROJECT_STRUCTURE.md, ai-search-readiness-summary.html/.pdf
- EXECUTIVE_SUMMARY_GEO.html/.pdf, docs/UI_DESIGN.md, docs/VALIDATION_CRITERIA.md

**สร้างเอกสารใหม่:**
- `AI Search Project/PROJECT_OVERVIEW.md` — technical reference (markdown)
- `AI Search Project/docs/PROJECT_OVERVIEW.html` — interactive HTML doc พร้อม:
  - Language Toggle EN/TH (localStorage persistent)
  - 14 sections ครอบคลุม DEV/CEO/COO ในไฟล์เดียว
  - Reader Hint Cards ด้านบนบอกแต่ละ role ควรเริ่มอ่าน section ไหน
  - Section tags (ALL/DEV/CEO/COO) ใน TOC
  - Responsive + print-friendly

### 7. Git Commits (7 เม.ย. 2569 รอบที่ 2)

| Hash | Message |
|---|---|
| `047791a` | feat: add Knowledge Graph dimension + expandable criteria cards |
| `da104b2` | fix: resolve 6 critical/high issues from Knowledge Graph review |
| `99bc3d8` | feat: rename Knowledge Graph to AI Overview + add detection explanations |

---

## สถานะปัจจุบัน (7 เมษายน 2569)

- **เว็บ live:** https://aicheck.ohmai.me ✅
- **AI Visibility:** 7 มิติ (เพิ่ม AI Overview) ✅ (SERPER_API_KEY หาย — Google Presence/AI Overview ใช้ไม่ได้จนกว่าจะใส่ key ใหม่)
- **Transparency:** Scoring Criteria มี "How we detect this" ทุกมิติ ✅
- **Local = GitHub = AWS:** ทั้ง 3 ตรงกัน ✅
- **Code review:** 31/48 issues แก้ครบ (Critical + High ครบ 100%) ✅
- **AI Rate Limit:** 3 req/min per IP ✅
- **Serper quota:** 2,500 ฟรี (ใช้ไปยังไม่ถึง 100) ✅
- **Documentation:** PROJECT_OVERVIEW.html (EN/TH) พร้อมแจก DEV/CEO/COO ✅

---

## อัปเดต — 7 เมษายน 2569 (กลางคืน) — Production Recovery + Directory Cleanup

### ปัญหาที่แก้แล้ว: ai-checker vs ai-search-checker

**Root cause:** Nginx config ที่ `/etc/nginx/sites-enabled/aicheck.ohmai.me` เป็นไฟล์แยก (ไม่ใช่ symlink) มี path เก่า `/var/www/ai-search-checker/` ขณะที่ไฟล์ใหม่ที่แก้ถูกแก้ที่ `sites-available` (Nginx ใช้ `sites-enabled`)

**สิ่งที่แก้:**
1. `sed` แทน path ใน `/etc/nginx/sites-enabled/aicheck.ohmai.me` จาก `/var/www/ai-search-checker/` → `/var/www/ai-checker/`
2. Sync `sites-available/aicheck.ohmai.me` ให้ตรงกับ `sites-enabled` (cp)
3. `sudo systemctl reload nginx`
4. Deploy `public/` directory (ไม่มีบน server)
5. Restart PM2 ด้วย `PORT=3001` + `OPENAI_API_KEY`

### โครงสร้าง Server ที่ถูกต้อง (canonical)

```
/var/www/ai-checker/          ← real directory (ไม่ใช่ symlink)
├── .next/
│   ├── standalone/           ← PM2 รัน server.js จากที่นี่
│   │   └── server.js
│   └── static/               ← Nginx serve จากที่นี่ (/_next/static)
└── public/                   ← Nginx serve robots.txt, sitemap.xml, llms.txt, favicon.svg
```

**Nginx config:** `/etc/nginx/sites-enabled/aicheck.ohmai.me` (ไม่ใช่ sites-available!)

### Deploy Commands (ทำตามลำดับทุกครั้ง)

```bash
# 1. Build
cd "/Users/alienmacbook/Desktop/OhmProject/AI Search Project/aicheck"
npm run build

# 2. Upload standalone
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i ~/Desktop/Keypair/n8n-singapore-key-ed25519.pem" \
  .next/standalone/ ubuntu@54.169.168.58:/var/www/ai-checker/.next/standalone/

# 3. Upload static (ต้องทำด้วยทุกครั้ง! standalone ไม่รวม static)
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i ~/Desktop/Keypair/n8n-singapore-key-ed25519.pem" \
  .next/static/ ubuntu@54.169.168.58:/var/www/ai-checker/.next/static/

# 4. Upload public
rsync -avz --no-owner --no-group --no-perms \
  -e "ssh -i ~/Desktop/Keypair/n8n-singapore-key-ed25519.pem" \
  public/ ubuntu@54.169.168.58:/var/www/ai-checker/public/

# 5. Restart PM2 (อ่าน keys จาก /var/www/ai-checker/.env ก่อน)
ssh -i ~/Desktop/Keypair/n8n-singapore-key-ed25519.pem ubuntu@54.169.168.58 \
  "source /var/www/ai-checker/.env && pm2 restart ai-checker && pm2 save"
```

### Env vars บน Server

ไฟล์: `/var/www/ai-checker/.env` (permissions 600)

```
OPENAI_API_KEY=sk-proj-tKQitv...  ✅
SERPER_API_KEY=__MISSING__         ← ต้องใส่จาก serper.dev account
PORT=3001                          ✅
```

**หมายเหตุ:** SERPER_API_KEY หายระหว่าง recovery — ต้องเข้า serper.dev → API Keys แล้ว copy key ใส่ใน `.env` แล้ว restart PM2
