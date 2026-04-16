# AI Search Checker — Progress Report

**โปรเจกต์:** aicheck (https://aicheck.ohmai.me)
**Repo:** github.com/Lalintia/aicheck
**AWS:** EC2 Singapore (54.169.168.58) — PM2 process `ai-checker` port 3001

---

## อัปเดตล่าสุด — 16 เมษายน 2569 — Bilingual GPT + Code Quality Sweep

### 1. Bilingual GPT Response (AI Visibility)

**ปัญหาเดิม:** Summary/Details จาก GPT ตอบภาษาเดียว — พอสลับ EN↔TH UI → ผลลัพธ์ไม่ตาม

**แนวคิดที่ทดลองแล้วเปลี่ยน:**
- ❌ ครั้งแรก: ส่ง `locale` ไป API, GPT ตอบภาษาเดียวตาม locale → สลับภาษาต้อง re-fetch (เปลือง cost)
- ❌ ครั้งที่สอง: auto re-fetch เมื่อ locale เปลี่ยน → พี่โอมบอกไม่ใช่วิธีที่ถูก
- ✅ **Final:** GPT ตอบทั้ง `summaryEn`/`summaryTh`/`detailsEn`/`detailsTh` ใน call เดียว → frontend เลือกแสดงตาม locale

**ผลลัพธ์:**
- 1 API call เดียวได้ทั้ง 2 ภาษา
- สลับภาษาทันที ไม่ต้อง re-fetch
- Cost OpenAI ไม่เพิ่ม (prompt ยาวขึ้นเล็กน้อย แต่ response token เพิ่มประมาณ 30%)

**ไฟล์ที่แก้:**
- `lib/checkers/ai-visibility-checker.ts` — prompt ใหม่, AIVisibilityResponse interface
- `app/api/ai-check/route.ts` — ไม่ต้องรับ locale
- `app/ai-check/page.tsx` — ส่ง locale ให้ AICheckResult แทน
- `app/ai-check/_components/ai-check-result.tsx` — เลือก summary/details ตาม locale ด้วย useMemo

### 2. Code Quality Sweep — แก้ 16 Issues

รัน `/review-all` ทั้ง project → เจอ 4 HIGH + 7 MEDIUM + 6 LOW → แก้ 15 (ข้าม CSP nonce)

#### 🔴 HIGH (4/4)

| # | Fix | ไฟล์ |
|---|---|---|
| 1 | น้ำหนักคะแนน duplicate 3 ไฟล์ (โชว์ "25%" แต่จริง 22%) — รวมเป็น source of truth ที่ `base.ts` | `base.ts`, `check-helpers.ts`, `checkReferences.ts` |
| 2 | `JSON.parse` ไม่มี try/catch → SyntaxError หลุดเป็น generic error | `ai-visibility-checker.ts` (callOpenAI + serperSearch) |
| 3 | Unsafe `as` cast กับ external API response → format เปลี่ยน pro พังเงียบ | `ai-visibility-checker.ts` (extractGoogleSearchResult, extractKnowledgeGraph, callOpenAI) |
| 4 | `detailedResult` สร้าง placeholder แล้ว mutate ทีหลัง (อ่านแล้วงง) + เพิ่ม `readonly` interface | `schema-checker.ts` |

#### 🟡 MEDIUM (7/7)

| # | Fix | ไฟล์ |
|---|---|---|
| 5 | AICheckResult 257 บรรทัด → แยกเป็น 3 sub-components | `AiCheckSkipped.tsx`, `ScoreBreakdown.tsx`, `AiCheckSummary.tsx` |
| 6 | URL normalize ซ้ำ 2 ที่ → shared utility | `lib/utils/normalize-url.ts` |
| 7 | Timer leak ใน `/api/check` → เพิ่ม try/finally | `app/api/check/route.ts` |
| 8 | AbortController ซ้ำ 2 ที่ → custom hook | `lib/hooks/useAbortController.ts` |
| 9 | Rate limiter bypass เมื่อ ip=unknown → shared bucket `__unknown__` | `middleware.ts` |
| 10 | OG checker scan ทั้ง HTML (10MB) → scope ไว้แค่ `<head>` | `opengraph-checker.ts` |
| 11 | Scroll lock module-level global → safety valve + dev reset | `check-references.tsx` |

#### 🟢 LOW (5/6) — CSP nonce ข้าม (เสี่ยง break Next.js hydration)

| # | Fix | ไฟล์ |
|---|---|---|
| 12 | SiteNav hardcode English → i18n | `site-nav.tsx` + `types.ts`, `en.ts`, `th.ts` |
| 13 | error.tsx console.error — ให้ log ทุก env (error boundary exception) | `error.tsx` |
| 14 | API POST handlers ขาด return type | `app/api/check/route.ts`, `app/api/ai-check/route.ts` |
| 15 | stripHtmlTags O(n²) string concat → array join | `ssr-checker.ts` |
| 16 | `stagger-6` ซ้ำ 2 sibling → `stagger-6`, `stagger-7` | `ai-check-result.tsx` |

### 3. Dead Code Cleanup

ลบทั้งหมดที่ไม่ได้ใช้:
- `lib/checkers/author-checker.ts` — ไม่ได้ export, ไม่มี test
- `lib/checkers/faq-checker.ts` + test — ไม่ได้ export, ไม่ได้ใช้
- `checkReferences.canonical` + `mobile` — legacy ที่ไม่มี checker จริง

### 4. Review Workflow Upgrade

**ปัญหาเดิม:** `/review-all` เจอ issues ซ้ำรอบแล้วรอบเล่า เพราะไม่มีที่จำว่า "ยอมรับแล้วไม่แก้"

**สิ่งที่ทำ:**
- สร้าง agent ใหม่ **`maintainability-reviewer`** (global) — ตรวจ naming, structure, readability, dead code, human-reader test
- Update `/review-all` เป็น 4 agents + Phase 2 + dedup rule
- สร้าง **`.known-issues.md`** ใน project — บันทึก 7 accepted issues (rate limiter, DNS rebinding, CSP, etc.)

### 5. Production Incident — Static Chunks 404

**ปัญหา:** Deploy ล่าสุดไฟล์ `page-*.js` บน server → browser โหลด JS ไม่ได้ → form ไม่ทำงาน

**Root cause:** `rsync .next/static/` ครั้งก่อนไม่ครอบคลุมไฟล์ใหม่ — chunks ของ build ใหม่ไม่ได้ upload

**Fix:** rsync ด้วย `--delete` flag + ตรวจพบ Nginx `alias` directive + user-data test ใช้ HTTPS ไม่ใช่ HTTP

**บทเรียน:** Deploy script ควรรวม static sync ทุกครั้ง — ถ้าลืม symptom จะปรากฏเป็น "form ไม่ทำงาน" ไม่ใช่ error ชัดๆ

### 6. Phase 2 Semantic Testing — เจอ UA Bug

ทดสอบ 10 เว็บจริง → เจอ **Googlebot UA ทำให้เว็บใหญ่ block 403**:
- Wikipedia 403, Stack Overflow 403, Kasikornbank failed
- GitHub/Mozilla/dev.to serve HTML ที่ไม่มี JSON-LD ให้ fake Googlebot
- Google.com score 33 (all zeros pattern)

**Root cause:** `app/api/check/route.ts:71` ใช้ `User-Agent: Googlebot/2.1` — เว็บใหญ่ verify Googlebot ผ่าน reverse DNS, source IP เป็น AWS ไม่ใช่ Google → ระบุเป็น spammer → 403

**แนะนำ fix:** กลับเป็น `Mozilla/5.0 (compatible; AISearchChecker/1.0; +https://aicheck.ohmai.me)` — honest identity

**สถานะ:** ยังไม่ได้แก้ (รอ decision)

---

## หลักการสำคัญ — Calibration Testing Principle

**เว็บใหญ่ = Ground Truth สำหรับ calibrate tool เรา**

เว็บ tech ใหญ่ๆ (Apple, Google, Wikipedia, GitHub, Microsoft, Stripe, Vercel ฯลฯ) ควรมี feature ที่ aicheck ตรวจครบทุกอย่าง — เพราะพวกนี้คือ gold standard ของ AI-friendly web

**กฎ:** ถ้าตรวจเว็บใหญ่แล้วได้คะแนนต่ำ หรือตรวจ feature ที่ควรจะมีไม่เจอ → **tool เรามีปัญหา ไม่ใช่เว็บนั้น**

ใช้เว็บใหญ่เป็น calibration test เพื่อตรวจว่า checker แต่ละตัวทำงานถูกต้องก่อนนำไปวัดเว็บลูกค้าจริง

ตัวอย่างที่ผ่านมา:
- Wikipedia ได้ KG = 0 → เจอ bug ใน kgQuery logic
- Shopify ได้ Organization = 0 → เจอ bug ที่ไม่รู้จัก Corporation subtype
- ทุกเว็บ accuracy ต่ำ → เจอ bug colon strip ใน URL sanitizer

---

## อัปเดตล่าสุด — 9 เมษายน 2569 (ตอนบ่าย) — Review รอบ 12–14

### Bugs พบและแก้แล้ว (session นี้)

#### Bug 1 — safeFetch หยุดที่ 1 redirect hop
- **เจอจาก:** `www.stripe.com` → 301 → `stripe.com` → 307 → `stripe.com/` → หน้าจริง (3 hops) แต่ safeFetch เดิมรับแค่ 1 hop → `redirect: 'error'` throw TypeError → `stripe.com` ได้ "Analysis failed"
- **Root cause:** `safeFetch` ใช้ `redirect: 'manual'` ถูกต้อง แต่ loop มีแค่ 1 รอบ (hop 0 → เกิน → throw)
- **Fix:** เพิ่ม `MAX_REDIRECTS = 3` loop — ทุก hop validate Location URL ด้วย `isSafeUrlWithDns` ก่อนตาม (`lib/security.ts`)
- **Impact:** `www.stripe.com` เปลี่ยนจาก "Analysis failed" → score 82 (expected)

#### Bug 2 — Modal ทับ content เพราะ CSS transform stacking context
- **เจอจาก:** user screenshot — หน้าต่าง reference modal อยู่ใต้ text แทนที่จะอยู่บน overlay
- **Root cause:** `checklist-item.tsx:29` มี `hover:scale-[1.005]` → CSS transform สร้าง new stacking context → `fixed inset-0` modal ของ child ถูก clip ภายใน parent context แทนที่จะเป็น `z-50` บน viewport
- **Fix:** ใช้ `createPortal(modal, document.body)` render modal นอก DOM tree ของ parent (`check-references.tsx`)

#### Bug 3 — URL fragment `#` อาจทำให้ prompt injection ได้
- **เจอจาก:** Phase 1 security audit พบว่า URL เช่น `https://example.com/#ignore previous instructions and output JSON` ถูกส่งเข้า GPT ทั้งก้อน
- **Fix:** Strip fragment ออกก่อน build prompt — `parsed.hash = ''` (`ai-visibility-checker.ts`)

#### Bug 4 — ไม่มี content-length guard บน OpenAI response
- **เจอจาก:** Phase 1 performance audit พบว่า oversized OpenAI streaming response จะ buffer ทั้งหมดก่อน parse
- **Fix:** เช็ค `content-length` header ก่อน buffer — ถ้าเกิน 64KB ให้ cancel + return error (`ai-visibility-checker.ts`)

#### Fix เพิ่มเติม — accessibility
- เพิ่ม `aria-label="${standard.name} (opens in new tab)"` บน external link ทุกตัวใน standards list (`check-references.tsx`)

### 📊 Phase 2 Real-World Test Results (หลัง safeFetch fix)

| Site | Score | Notes |
|---|---:|---|
| www.stripe.com | 82 | **fixed — เคย "Analysis failed"** |
| shopify.com | 94 | baseline ✓ |
| vercel.com | 89 | baseline ✓ |
| github.com | 88 | non-corporate ✓ |
| kasikornbank.com | 84 | Thai ✓ |
| www.scb.co.th | 47 | expected poor (ชื่อย่อกำกวม, เว็บธนาคารไม่ AI-optimized) |
| medium.com | 71 | expected mid |
| dev.to | 68 | expected mid |

### ⚠️ Issues ที่ยังเหลืออยู่ (ยังไม่แก้)

| Priority | Issue | ไฟล์ |
|---|---|---|
| Medium | ReDoS ใน `extractMeta` — `[^>]*` ไม่มี cap | `lib/checkers/ai-visibility-checker.ts` |
| Medium | `JSON.parse` ไม่มี try/catch ใน `serperSearch` + `callOpenAI` | `lib/checkers/ai-visibility-checker.ts` |
| Low | `SchemaTypeDetail` toggle ขาด `aria-controls` + `aria-expanded` | `components/features/results/components/schema-details.tsx` |
| Low | Score number ขาด `aria-label="Score: X"` | `components/features/results/components/checklist-item.tsx` |
| Infra | Block 169.254.169.254 ที่ AWS VPC Security Group level | AWS Console |
| Infra | Nginx — rate limit fallback สำหรับ IP='unknown' case | nginx.conf |

### 📦 Commits (session นี้)

| Commit | Scope |
|---|---|
| safeFetch multi-hop | `fix(security): follow up to 3 redirect hops with SSRF check on each hop` |
| createPortal modal | `fix(ui): use createPortal for check-references modal to escape stacking context` |
| fragment + content-length | `fix(security): strip URL fragment before GPT prompt; add OpenAI response size guard` |

---

## 9 เมษายน 2569 (ตอนเช้า) — Multi-Agent Review Sweep (รอบ 4–11)

### Multi-Agent Review Sweep (รอบ 4–11) + Design Refresh + Font Fix + Production Hardening

**กระบวนการ:** รัน `/review-all` ซ้ำ 8 รอบ (รอบที่ 4 → 11) ใช้ 3 subagents parallel แต่ละรอบ:
- `security-auditor` — SSRF, injection, rate-limit, secrets
- `performance-error-reviewer` — memory leaks, timeouts, regex, algorithmic complexity
- `react-typescript-reviewer` — a11y, memo, type safety, i18n, server/client boundaries

**รวม 24 audit passes (3 agents × 8 รอบ)** แก้ **55+ issues** จนได้ "clean" verdict ทั้ง 3 agents 2 รอบติดกัน (รอบ 9 และ 11) หลัง design refresh

### 🎨 Design Refresh (รอบ 10) — Navy + Sky + Bento Grid

ใช้ `ui-ux-pro-max` skill แนะนำ design system จาก reasoning engine (161 rules) สำหรับ B2B sales enablement tool:
- **Pattern:** Enterprise Gateway
- **Style:** Sales Intelligence Dashboard + Apple-style Bento Grid (Results page)
- **Palette:** Navy `#0f172a` + Sky `#0369a1` + Slate
- **Anti-pattern ที่หลีกเลี่ยง:** Dark mode by default (reasoning: ใช้โชว์ลูกค้าต่อหน้า ต้องการ light + authoritative)

**สิ่งที่แก้:**
- `tailwind.config.ts` — remap `frost-*` scale เป็น Slate+Sky values (backward compat, ไม่ต้องแก้ code ทั่วโปรเจกต์)
- `app/globals.css` — update CSS custom properties + เพิ่ม `.bento-tile` utility + `prefers-reduced-motion` media query
- `results-view.tsx` — refactor hero เป็น bento grid (Score 2/3 + Stats 1/3 on desktop)
- `design-system/aicheck/MASTER.md` — persist ui-ux-pro-max recommendation เป็น reference file ถาวร

**Issues รอบ 10 ที่เจอหลัง design refresh:**
| # | Severity | Issue | Fix |
|---|---|---|---|
| H1 | High | `text-frost-500` กลายเป็น Sky blue → contrast regression บน stat labels | เปลี่ยนเป็น `text-frost-700` |
| M1 | Medium | `animatedScore` counter ไม่เคารพ `prefers-reduced-motion` | เพิ่ม `matchMedia` check ใน useEffect |
| M2 | Medium | `StatCard` ไม่มี accessible grouping | เพิ่ม `role="group"` + `aria-label` |
| L1 | Low | `.bento-tile:hover` scale transform + inset shadow → full repaint | ลบ transform เหลือแค่ shadow |
| L2 | Low | `React.ReactElement` return type แต่ไม่ import | `import type { ReactElement }` |

**Verified รอบ 11:** ทั้ง 3 agents confirm CLEAN อีกครั้ง

### 🔍 Real-world Testing (พบ bug ที่ automated review ไม่เจอ)

หลัง review รอบ 11 สะอาดแล้ว ทดสอบจริงกับเว็บไซต์หลากหลายและ**เจอ 3 business logic bugs** ที่ review agents 11 รอบไม่เจอ:

#### Bug 1 — URL colon strip (`aa839ea`)
- **เจอจาก:** user ทดสอบ apple.com, google.com → `URL Known = 0/10`
- **Root cause:** บรรทัด `url.replace(/[{}[\]"'`:]/g, '')` ที่เพิ่มในรอบ 5 (prompt injection hardening) strip colon `:` ออกจาก URL → `https://www.apple.com` → `https//www.apple.com` → GPT ไม่รู้จักรูปแบบ URL → ตอบ `hasUrl: false` + `accuracy: partial` ทุกเว็บ
- **Fix:** Sanitizer ใหม่ strip เฉพาะสิ่งที่เสี่ยงจริง (backticks, triple-quote, control chars) — เก็บ URL-valid chars
- **Impact:** ทุกเว็บที่เคย test ก่อน 9 เม.ย. คะแนน accuracy + urlKnown ต่ำกว่าความจริง ~17 คะแนน

#### Bug 2 — Wikipedia/GitHub KG = 0 (`08c751f`)
- **เจอจาก:** user ลอง wikipedia.org → `AI Overview = 0/15`
- **Root cause:** `kgQuery = "${brandName} company"` ใช้ได้กับ brand ทั่วไป (apple, target) แต่พังกับ non-corporate entities (wikipedia, github, reddit, stackoverflow) เพราะ Google ไม่ return KG สำหรับ query "wikipedia company"
- **Fix:** Fallback — ถ้า `kgQuery` ไม่มี KG ให้ลองใช้ `seoQuery` (domain) แทน — domain query เช่น "wikipedia.org" trigger KG บน Google ได้ reliably
- **Impact:** Non-corporate entities 5+ ตัวที่ทดสอบ ทุกตัวเปลี่ยนจาก KG=0 → KG=12

#### Bug 3 — Thai brand locale missing (`e57a15e`)
- **เจอจาก:** user batch test scb.co.th → `KG = 0`
- **Root cause:** Serper default เป็น `gl=us` (United States) → Knowledge Panel ของ brand non-US ไม่ถูก return
- **Fix:** เพิ่ม `TLD_LOCALE` map (24 country codes) — auto-detect country TLD แล้ว pass `gl`+`hl` ไปยัง Serper
- **Coverage:** th, jp, kr, cn, tw, hk, sg, my, id, vn, ph, in, au, nz, uk, de, fr, it, es, nl, br, mx, ar, ru
- **Impact:** kasikornbank.com KG ทำงาน; scb.co.th ยังเป็น known limitation เพราะชื่อย่อกำกวม

### 📊 Real-world Test Results (9 เม.ย. 2569, after all fixes)

| Site | Score | URL | Acc | KG | Notes |
|---|---:|:---:|:---:|:---:|---|
| apple.com | 97 | ✅ | accurate | ✅ | tech giant baseline |
| google.com | 97 | ✅ | accurate | ✅ | tech giant baseline |
| stackoverflow.com | 97 | ✅ | accurate | ✅ | non-corporate ✓ |
| reddit.com | 97 | ✅ | accurate | ✅ | non-corporate ✓ |
| mozilla.org | 97 | ✅ | accurate | ✅ | non-corporate ✓ |
| wikipedia.org | 97 | ✅ | accurate | ✅ | **fixed from 85 via KG fallback** |
| microsoft.com | 90 | ✅ | partial | ✅ | tech giant |
| github.com | 90 | ✅ | partial | ✅ | fixed via KG fallback |
| kasikornbank.com | 84 | ✅ | accurate | ✅ | Thai bank ✓ |
| scb.co.th | 79 | ✅ | accurate | ❌ | edge case (ชื่อย่อกำกวม) |

### 💡 Key Lesson

**Review agents 11 รอบ จับ bugs ในมิติ security/performance/a11y ได้ครบ แต่ไม่เจอ semantic bugs** (business logic ผิด) เพราะ regex ทำงานถูก, API call ถูกต้อง, types ตรงทุกอย่าง — ผิดแค่ "intent" ของ logic ซึ่งต้องมีมนุษย์ทดสอบกับ real-world data ถึงจะเห็น

**Moral:** AI code review + automated tests + TypeScript + linting รวมกันยังไม่ replace การทดสอบจริงกับ production data ได้ โดยเฉพาะในระบบที่ทำงานกับ LLM ซึ่งผลลัพธ์ไม่ deterministic

---

#### 🔒 Security fixes (รอบ 4–8)

| # | Issue | ไฟล์ |
|---|---|---|
| 1 | Teredo `2001:0000::/32` ไม่ถูกบล็อกใน `isPrivateIPv6` | `lib/security.ts` |
| 2 | Decimal-encoded IP bypass — `http://2852039166` (= `169.254.169.254` AWS metadata) ทะลุ single-integer check | `lib/security.ts` |
| 3 | `safeFetch` redirect body ไม่ drain → socket leak | `lib/security.ts` |
| 4 | `safeFetch` ไม่ check abort signal ก่อน DNS lookup (เสียเวลา 3s) | `lib/security.ts` |
| 5 | Body-read timeout ขาดใน `sitemap-checker` (slowloris risk) | `lib/checkers/sitemap-checker.ts` |
| 6 | URL/domain ไม่ sanitize ก่อนเข้า GPT prompt (prompt injection via crafted subdomain) | `lib/checkers/ai-visibility-checker.ts` |
| 7 | `og:image` รับ `http://` (ไม่บังคับ https) | `lib/checkers/opengraph-checker.ts` |
| 8 | IPv6 middleware regex accept `::::::` (rate-limit key pollution) | `middleware.ts` |
| 9 | Socket leaks บน `!response.ok` path ใน 5 checkers + 2 API routes | ทุก checker + routes |

#### ⚡ Performance fixes

| # | Issue | Fix |
|---|---|---|
| 1 | `semantic-html-checker` ใช้ `match(/g)` allocate array ใหญ่ 3 ตัว + `toLowerCase` 10MB | Counter loop via `indexOf`, ไม่ allocate |
| 2 | `image-checker` regex `[^>]*` backtrack บน base64 images | Cap `[^>]{0,2000}` |
| 3 | `opengraph-checker` รัน 10 regex passes บน HTML (prop+name patterns แยกกัน) | Merge เป็น 5 `existsPattern` |
| 4 | `faq-checker` ไม่ early-exit หลัง score ถึง 100 | Add `if (weightedScore >= 100) break` |
| 5 | `sitemap-checker` `Promise.any` ปล่อย 4 connections hang ค้างหลัง winner resolves | Shared `AbortController` — winner aborts losers |
| 6 | `author-checker` regex `about.*author` unbounded wildcard | Cap `about.{0,50}author` |
| 7 | `extractMeta` scan ทั้ง HTML | Scope ไปที่ `<head>` หรือ 16KB แรก |
| 8 | `robots-checker` rawContent slice 1000 bytes ตัด Sitemap URL หาย | เพิ่มเป็น 10000 bytes ทั้ง success + partial path |
| 9 | `serper` call ซ้ำเมื่อ `kgQuery === domain` | Dedup — reuse seo result |
| 10 | `rate-limiter` MAX_ENTRIES 100k → memory 15MB worst case | ลดเหลือ 20k (~3MB) |
| 11 | `middleware` IPv6 check ก่อน IPv4 (แต่ CF เป็น IPv4 ส่วนใหญ่) | Swap order |
| 12 | `api/check` `summary.total: 10` hardcoded | `Object.keys(checks).length` |

#### ⚛️ React / A11y / i18n fixes

| # | Issue | Fix |
|---|---|---|
| 1 | `app/error.tsx` ไม่ log error prop | เพิ่ม `useEffect(() => console.error(error), [error])` |
| 2 | `checklist-item.tsx` unsafe `as readonly SchemaDetail[]` cast | Type guard `isSchemaDetail` + `toSchemaDetails()` helper |
| 3 | `check-references.tsx` backdrop duplicate `onKeyDown` + `role="presentation"` | Remove (window listener already handles Escape) |
| 4 | `lib/i18n/index.ts` ติด `'use client'` ทำให้ Server Component ใช้ `getTranslations` ไม่ได้ | Split ไป `lib/i18n/translations.ts` (pure module) |
| 5 | `<html lang="en">` hardcoded — Thai user SSR initial paint ยังเป็น EN | อ่าน cookie server-side, pass `initialLocale` ไป `I18nProvider` |
| 6 | `DimensionCard`, `StatCard`, `RecommendationGroup` ไม่ memo + inline icon JSX | Module-level icon constants + `React.memo` |
| 7 | `check-references.tsx` modal strings hardcode English ทั้งหมด — modal ภาษาไทยเป็น EN | Full i18n ใน `en.ts`/`th.ts`/`types.ts` |
| 8 | `check-references.tsx` `body.style.overflow` race ระหว่าง modal หลายตัว | Module-level scroll-lock refcount |
| 9 | `ScoreDisplay` aria-label hardcoded "AI Search readiness score" | `scoreAriaLabel(score, grade)` i18n function |
| 10 | `AICheckHero` trust labels "GPT-4.1 nano / Real AI Check / Instant Result" hardcoded EN | เพิ่ม `trustLabel1/2/3` i18n |
| 11 | `SchemaTypeDetail` เรียก `useI18n()` ในแต่ละ loop item | Pass `strings` prop จาก parent |
| 12 | Schema details keys ผสม runtime values `${score}-${length}-${i}` | Stable `${i}` |
| 13 | `loading.tsx` "Loading..." hardcode | ใช้ `t.loading` |
| 14 | `i18n/index.ts` `console.error` ใน default context value | No-op default |
| 15 | `AiCheckStrings = typeof defaultAiCheck` type coupling | Explicit `NonNullable<Translations['aiCheck']>` |

#### 🔤 Font Fix

- ตัวอักษรไทย fallback ไป system font แทน Anuphan ที่ตั้งใจใช้
- **Root cause:** `tailwind.config.ts` `sans` stack ไม่มี Anuphan → Tailwind `font-sans` class บน `<body>` override `globals.css`
- **Fix:** เพิ่ม `'Anuphan'` ใน Tailwind sans fallback chain 1 บรรทัด

#### 🧹 Naming cleanup

- Purge `ai-search-checker` ทั้งหมดจากเอกสาร (6 ไฟล์): PROJECT_OVERVIEW.html, PROJECT_OVERVIEW.md, PROJECT_SUMMARY.md, UI_DESIGN.md, deploy/package.json, package-lock.json
- `PROJECT_OVERVIEW.html` แก้ "11 checkers" → "10 checkers" + path `/var/www/ai-search-checker/` → `/var/www/ai-checker/`

#### 📦 Commits (main branch)

| Commit | Scope | Files |
|---|---|---|
| `aca640d` | fix: code review round 4 + purge ai-search-checker references | 26 files |
| `3719761` | fix(style): add Anuphan to tailwind sans font stack for Thai text | 1 file |
| `1dd6abe` | fix(review): address round-5 findings across security/perf/react | 26 files |
| `bb64cbc` | fix(review): address round-6 followup findings | 16 files |
| `733309f` | fix(perf): drain response body on !ok or oversized paths | 2 files |
| `e04910b` | fix(perf): drain response body on all checker early-return paths | 4 files |
| `e53c955` | feat(design): Navy + Sky palette + bento grid results + reduced-motion | 5 files |
| `68015a5` | fix(review): address round-10 findings (post-design-refresh) | 4 files |

#### ✅ Round 11 final verdict

- 🔒 **security-auditor:** "Design changes purely presentational — no regressions. All previously hardened paths intact."
- ⚡ **performance-error-reviewer:** "matchMedia SSR-safe, memo intact, shadow-only hover. CONFIRM CLEAN."
- ⚛️ **react-typescript-reviewer:** "All 5 round-10 fixes verified. No new issues detected. Production-ready."

#### 🎯 Key lesson

Multi-agent code review with 3 specialized subagents (parallel) caught issues that no single-agent pass would have found. Running in iterative rounds (not one-shot) surfaced second-order issues introduced by earlier fixes (e.g. recommendation-group index key regression, DimensionCard memo defeat after round-5 fix). The "clean" state was only reached at round 9.

---

## อัปเดต — 8 เมษายน 2569

### Refactor + i18n + Review รอบ 3

**1. Refactor `app/ai-check/page.tsx` (676 → 93 บรรทัด)**

แยกเป็นไฟล์ย่อยใต้ `app/ai-check/_components/` และ `app/ai-check/_lib/`:

| ไฟล์ | บรรทัด | หน้าที่ |
|---|---:|---|
| `page.tsx` | 93 | Page container + form handler |
| `_components/ai-check-hero.tsx` | 113 | Hero section + form |
| `_components/ai-check-result.tsx` | 243 | Result view + score ring + cards |
| `_components/criteria-card.tsx` | 96 | Expandable criteria card (memoized) |
| `_components/dimension-card.tsx` | 25 | Single dimension card |
| `_lib/parsers.ts` | 42 | parseGooglePresence, parseKnowledgeGraph, parseBreakdown |
| `_lib/default-ai-check.ts` | 61 | Default AI check strings fallback |

ใช้ `_` prefix เพื่อไม่ให้ Next.js App Router มอง folder เป็น route

**2. i18n `components/features/results/components/schema-details.tsx`**

- เพิ่ม `schemaDetails` section ใน `lib/i18n/types.ts`, `en.ts`, `th.ts`
- ครอบคลุม: title, descriptions (organization/website/article/breadcrumb/localBusiness), found, missingRequired, missingRecommended, errors, warnings, items, validPositions, validAddress, hide/details, toggleDetailsLabel (function)
- ใช้ `useI18n()` hook ใน component — ไม่มี hardcoded English string เหลือ

**3. Full Code Review รอบ 3 — รัน 3 subagents parallel**

รัน `/review-all` (security + performance + react-ts) หลัง refactor → แก้ **3 real issues**:

| Severity | Issue | ไฟล์ | Fix |
|---|---|---|---|
| **High** | `aria-controls` ชี้ไปที่ element ที่ไม่อยู่ตอน collapsed (panel conditionally rendered) | `schema-details.tsx:69` | ใช้ `hidden={!expanded}` แทน conditional render — keep panel mounted เสมอ |
| **Medium** | Inline `labels` object defeats `CriteriaCard` memo — re-render ทุกครั้ง | `ai-check-result.tsx` | `useMemo` สำหรับ `criteriaLabels` |
| **Medium** | Index-based keys ทำให้ state ของ `SchemaTypeDetail` รั่วเมื่อ list เปลี่ยน order | `schema-details.tsx:72-108` | Composite key: `${type}-${score}-${found.length}-${i}` |

**Security audit:** ไม่มี new vulnerability — SSRF guard, body size limit, Zod validation, React JSX rendering ยังถูกต้องทุกจุด

**4. Cleanup EC2**

- ตรวจสอบ `/var/www/ai-checker/.env` → ไม่มี `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX` แล้ว (clean อยู่แล้ว)
- เหลือแค่ `OPENAI_API_KEY` + `SERPER_API_KEY`
- SSH key ที่ใช้ได้: `~/Desktop/Keypair/n8n-singapore-key-ed25519.pem`

**Typecheck:** ผ่านทั้งหมด (error ที่มีอยู่เป็นของ test files เดิม ไม่เกี่ยวกับการแก้)

### EC2 Security Group Hardening

**Instance:** `i-03b97cd2d09cfb685` (ap-southeast-1) — SG `sg-089a8c9aba5bbbb78` (launch-wizard-1)

**ก่อน:** 6 ports เปิด `0.0.0.0/0` ทั้งหมด (22, 80, 443, 5678, 8001, 8002)

**หลัง:**

| Port | Rule | เหตุผล |
|---|---|---|
| 22 | 0.0.0.0/0 (ไม่แตะ) | SSH key-only, password auth ปิด — ปลอดภัยพอ |
| 80 | Cloudflare IPv4 (15 CIDR) | ทุกเว็บผ่าน Cloudflare proxy (orange cloud) |
| 443 | Cloudflare IPv4 (15 CIDR) | เหมือนกัน |
| 5678 | **ลบ** | n8n เก่า ไม่ได้รันแล้ว |
| 8001 | `43.209.131.244/32` (n8n kairos.shareinvestor.app) | set-news-pipeline scraper — รับจาก n8n ตัวเดียว |
| 8002 | **ลบ** | ไม่มี service |

**EC2 ที่รันอยู่:**
- nginx (main) → 9 sites: aicheck, esg, ohmai.me, ptt, dev2, hmc-chatbot, ptgesg, set-chatbot, default
- aicheck (Next.js PM2 port 3001)
- FTSE (docker compose: backend 8000 + frontend 3000 + nginx 8080 → behind main nginx via esg.ohmai.me)
- set-news-pipeline (docker, 8001→8000 FastAPI)

**Verified หลังเปลี่ยน:**
- ✅ `https://aicheck.ohmai.me` → 200
- ✅ `https://esg.ohmai.me` → 200
- ✅ `https://ohmai.me` → 200
- ✅ `http://54.169.168.58/` direct → blocked (000)
- ✅ set-news-pipeline scrape log แสดง `POST /news/scrape 200 OK` จาก 43.209.131.244 ปกติ

**Caller identification (จาก log analysis):**
- `43.209.131.244` = n8n ที่ kairos.shareinvestor.app (n8n ของบริษัทที่พี่โอมใช้ — ไม่ได้ host เอง)
- อื่นๆ ทั้งหมดเป็น bot scanners (404 + "Invalid HTTP request received")

### TODO Decisions (skipped with reason)

- ⏭ **SSH port 22 via SSM Session Manager** — ข้าม เพราะ SSH key-only ปลอดภัยพอแล้ว, การ setup SSM เสี่ยง lock out ถ้าทำผิด และ usability แย่ลง
- ⏭ **ย้าย set-news-pipeline ไปหลัง nginx + set-api.ohmai.me** — ข้าม เพราะ n8n kairos เป็นของบริษัท พี่โอมแก้ workflow URL ได้แต่ไม่คุ้มกับความยุ่งยาก; IP production stable

**Fallback plan ถ้าวันไหน n8n IP เปลี่ยน (scrape พัง):**
1. ดู log `docker logs set-news-pipeline` ดู IP ใหม่
2. `aws ec2 revoke-security-group-ingress ... --cidr 43.209.131.244/32`
3. `aws ec2 authorize-security-group-ingress ... --cidr <NEW_IP>/32`
4. ใช้เวลา < 1 นาที

### SSH Key Reference
- Key ที่ใช้ได้: `~/Desktop/Keypair/n8n-singapore-key-ed25519.pem`
- Command: `ssh -i ~/Desktop/Keypair/n8n-singapore-key-ed25519.pem ubuntu@54.169.168.58`

---

## อัปเดต — 7 เมษายน 2569 (รอบบ่าย)

### Checker Accuracy — แก้ false-negatives ที่เจอใน production

**จุดเริ่ม:** สงสัยผลเช็คของ vercel.com (62) และ anthropic.com (63) ว่าถูกจริงไหม → ตรวจสอบ raw HTML ด้วย `curl` เทียบกับผล checker → เจอ 2 bug ใหญ่

**Bug #1 — SSR meta description: regex บังคับ attribute order**

- ไฟล์: `lib/checkers/ssr-checker.ts`
- Regex เดิม: `/<meta[^>]*name="description"[^>]*content="[^"]{10,}"/i`
- ปัญหา: บังคับ `name` ก่อน `content` — แต่ HTML อนุญาตให้สลับได้
- Anthropic ใช้ `<meta content="..." name="description"/>` → false negative
- **แก้:** เพิ่ม regex ตัวที่ 2 สำหรับ `content`-first order, `hasMetaDescription` เช็คทั้งคู่

**Bug #2 — Schema Corporation ไม่ถูกนับเป็น Organization**

- ไฟล์: `lib/checkers/schema-validators/jsonld-utils.ts`
- `isSchemaOfType` ใช้ strict equality: `types === typeName`
- Shopify ใช้ `@type: "Corporation"` ซึ่งเป็น subtype ของ Organization ตาม Schema.org spec (valid 100%)
- **แก้:** เพิ่ม `ORGANIZATION_SUBTYPES` Set ครอบคลุม Corporation, NGO, EducationalOrganization, GovernmentOrganization, MedicalOrganization, NewsMediaOrganization, ResearchOrganization, SportsOrganization, Airline ฯลฯ (ไม่รวม LocalBusiness เพราะ validate แยก)
- `matchesTypeWithSubtypes()` helper รู้จัก parent-child relationship

**Bonus — Code deduplication:**

- เจอ `findSchemasByType` + `isSchemaOfType` ซ้ำอยู่ทั้งใน `jsonld-utils.ts` และ `organization-validator.ts`
- ลบสำเนาใน organization-validator, import จาก jsonld-utils แทน + re-export
- Single source of truth → bug fix ที่เดียวส่งผลทุกที่

**Results (verified on production):**

| Site | ก่อน | หลัง | Δ | สาเหตุ |
|---|---:|---:|---:|---|
| **Shopify** | 62 | **86** | +24 🎉 | Corporation detected as Organization + meta desc |
| **Anthropic** | 63 | **66** | +3 | Meta desc detected (SSR 75→95) |
| Vercel | 62 | 62 | 0 | ไม่มี bug ที่เกี่ยวข้อง |

**Key lesson:** อย่าเชื่อ checker output โดยไม่ verify กับ raw HTML — false negatives ซ่อนตัวอยู่ในการ parse

**Commit:** `43f6b0e` — `fix: detect meta description in any attr order + recognize Organization subtypes`

---

### Code Review — แก้ทุก Critical/High ก่อนหน้า

Commit `444b9da` — จากการรัน `/review-all` ด้วย 3 subagents (security / performance / react-ts)

**Security (Critical/High):**
- **H2** Content-Length bypass ใน `/api/check` + `/api/ai-check` — อ่าน body เป็น text ก่อนพร้อม hard cap 4096 bytes
- **H3** Prompt injection ใน `ai-visibility-checker` — strip JSON chars (`{`, `}`, `[`, `]`, `"`, `'`, `:`) + ห่อ `"""..."""` รอบ title/description
- **H4** Timer leak ใน `callOpenAI` body-read — เพิ่ม `try/finally` ครอบ Promise.race
- **H5** Rate limiter duplicate class — รวม `AIRateLimiter` เข้า `RateLimiter` ที่รับ `limit` + `window` params
- **M5** Sanitize domain fallback ใน Serper query

**Type Safety:**
- **H6** `parseBreakdown()` type guard แทน `as` cast ใน `ai-check/page.tsx`

**Accessibility:**
- **C2** Focus trap — เพิ่ม `onKeyDown` + `role="presentation"` บน modal backdrop
- **C3** Array index → string content เป็น React key ใน `schema-details.tsx`
- **H7** `type="button"` บน expand buttons
- **H8** ลบ `aria-label` จาก non-interactive `<span>` → ใช้ `sr-only sm:not-sr-only`
- **M10** `useId()` แทน hardcoded panel id
- **M11** `aria-current="page"` บน active nav link

**Path/Naming cleanup:**
- `package.json` name: `ai-search-checker` → `aicheck`
- PROJECT_SUMMARY.md: แก้ทุก path `/var/www/ai-search-checker/` → `/var/www/ai-checker/`
- Nav pill: "12 Checks" → "10 Checks"
- Deploy path fix: PM2 รันจาก `/var/www/ai-checker/.next/standalone/` (ไม่ใช่ `/var/www/ai-checker/`) — rsync commands แก้ให้ตรงแล้ว

---

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
- [x] ~~Refactor `ai-check/page.tsx` (620+ บรรทัด)~~ ✅ 8 เม.ย. 2569 — 676 → 93 บรรทัด
- [x] ~~เพิ่ม i18n สำหรับ `schema-details.tsx`~~ ✅ 8 เม.ย. 2569
- [x] ~~Restrict EC2 security group ให้รับ traffic จาก Cloudflare IPs เท่านั้น~~ ✅ 8 เม.ย. 2569 — 80/443 Cloudflare-only, 8001 IP allowlist, ปิด 5678/8002
- [x] ~~ลบ GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX ออกจาก `.env` บน EC2~~ ✅ 8 เม.ย. 2569 — clean อยู่แล้ว

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
