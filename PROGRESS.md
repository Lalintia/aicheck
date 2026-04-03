# AI Search Checker — Progress Report

**โปรเจกต์:** aicheck (https://aicheck.ohmai.me)
**Repo:** github.com/Lalintia/aicheck
**AWS:** EC2 Singapore (54.169.168.58) — PM2 process `ai-checker` port 3001

---

## อัปเดตล่าสุด — 2 เมษายน 2569

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

---

## สถานะปัจจุบัน

- **เว็บ live:** https://aicheck.ohmai.me ✅
- **AI Visibility:** https://aicheck.ohmai.me/ai-check ✅ (OPENAI_API_KEY ตั้งแล้ว)
- **Local = GitHub = AWS:** ทั้ง 3 ตรงกัน ✅
- **Code review:** 22 issues แก้ครบ ✅
- **AI Rate Limit:** 3 req/min per IP ✅

## TODO

- [ ] พิจารณาเปลี่ยนรูป project cards ที่ ohmai.me เป็น screenshot จริงแทน stock photos
