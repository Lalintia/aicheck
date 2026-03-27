# AI Search Checker — Progress Report

**วันที่:** 27 มีนาคม 2569
**โปรเจกต์:** aicheck (https://aicheck.ohmai.me)
**Repo:** github.com/Lalintia/aicheck
**AWS:** EC2 Singapore (54.169.168.58) — PM2 process `ai-checker` port 3001

---

## สิ่งที่ทำวันนี้

### 1. Setup & Sync

- [x] Clone repo จาก GitHub มาในเครื่อง
- [x] Copy agent skills จาก FTSE project (7 skills)
- [x] Sync `deploy/server.js` ให้ตรงกับ AWS production
- [x] ลบ PM2 process ซ้ำ `ai-search-checker` (id 1) บน AWS — เหลือแค่ `ai-checker` (id 0)
- [x] ยืนยันเว็บ live ยังทำงานปกติ (HTTP 200)
- [x] Commit + Push ขึ้น GitHub

### 2. เพิ่ม 3 Checkers ใหม่ (10 → 13 ข้อ)

| # | Checker | ไฟล์ | ประเภท |
|---|---|---|---|
| 11 | SSR/CSR Detection | `lib/checkers/ssr-checker.ts` | Rule-based |
| 12 | Image AI Readiness | `lib/checkers/image-checker.ts` | Rule-based |
| 13 | AI Visibility Check | `lib/checkers/ai-visibility-checker.ts` | GPT-4.1 nano (~0.03 บาท/ครั้ง) |

**ไฟล์ที่แก้ไข:**
- `lib/types/checker.ts` — เพิ่ม 3 CheckTypes ใหม่
- `lib/checkers/base.ts` — weights 13 ข้อ + recommendations ใหม่
- `lib/checkers/index.ts` — exports ใหม่
- `app/api/check/route.ts` — รัน 13 checkers ใน Promise.all
- `lib/utils/check-helpers.ts` — labels + descriptions 13 ข้อ
- `.env.example` — เพิ่ม `OPENAI_API_KEY`

### 3. Redesign UI — Arctic Frost Theme

**เปลี่ยนจาก:** Light blue generic → Arctic Frost (ฟ้าน้ำแข็ง Steel Blue)

| สี | Hex | ใช้ที่ |
|---|---|---|
| Ice Blue (พื้นหลัง) | `#f4f8fc` | Background |
| Steel Blue (accent) | `#4a6fa5` | ปุ่ม, heading, badge |
| Silver | `#c0c0c0` | Scrollbar, muted elements |
| Crisp White | `#fafafa` → `#ffffff` | Cards |

**Font:** Satoshi (หัวข้อ/ปุ่ม) + JetBrains Mono (ตัวเลข/scores)

**Effects ที่เพิ่ม:**
- Parallax frost orbs บน hero section
- Staggered fade-up animation ทุก checklist item
- Animated SVG ring gauge (score นับขึ้นแบบ ease-out)
- Hover scale + active press บนปุ่ม/cards
- AI Visibility check มี special glow + scan-line effect + "AI" badge
- Subtle grid pattern + frost grain overlay

**ไฟล์ที่แก้ไข (16 ไฟล์):**
- `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`
- `app/loading.tsx`, `app/error.tsx`
- `components/features/checker/hero-section.tsx`, `url-form.tsx`
- `components/features/results/results-view.tsx`
- `components/features/results/components/score-display.tsx`
- `components/features/results/components/stats-summary.tsx`
- `components/features/results/components/checklist.tsx`
- `components/features/results/components/checklist-item.tsx`
- `components/features/results/components/recommendations.tsx`
- `components/features/results/components/recommendation-group.tsx`
- `components/features/results/components/reset-button.tsx`

### 4. ระบบ i18n (TH/EN)

**ไฟล์ใหม่:**
- `lib/i18n/types.ts` — TypeScript interface สำหรับ translations
- `lib/i18n/en.ts` — English translations
- `lib/i18n/th.ts` — Thai translations
- `lib/i18n/index.ts` — Context + `useI18n()` hook
- `components/i18n-provider.tsx` — React context provider
- `components/language-switcher.tsx` — ปุ่ม EN/TH มุมขวาบน

**Components ที่อัปเดตใช้ i18n:**
- hero-section, url-form, page.tsx
- score-display, stats-summary, checklist, checklist-item
- recommendations, reset-button

### 5. Code Review (3 reviews พร้อมกัน)

#### Review 1: React/TypeScript
- **High (6):** Non-null assertions, unsafe type cast, ARIA live region ผิดที่, `<html lang>` ไม่ sync, dynamic stagger class, modal ไม่ใช้ `<dialog>`
- **Medium (5):** useI18n ไม่ throw error, prefers-reduced-motion, schema buttons ขาด aria, animated counter รบกวน SR, array index เป็น key

#### Review 2: Performance & Error Handling
- **High (1):** ReDoS nested quantifier ใน `ssr-checker.ts:43`
- **Medium (4):** DNS timer leak, ReDoS stripHtmlTags, body read timeout x2

#### Review 3: Security
- **High (2):** Prompt injection via title/meta, ReDoS (เดียวกัน)
- **Medium (4):** Rate limiter in-memory, content-length bypass, OpenAI error leak, DNS rebinding

---

## น้ำหนัก 13 ข้อ (ลำดับความสำคัญ)

| # | Checker | น้ำหนัก |
|---|---|---|
| 1 | Schema.org (JSON-LD) | 18% |
| 2 | SSR/CSR Detection ✨ | 14% |
| 3 | robots.txt | 11% |
| 4 | Heading Hierarchy | 9% |
| 5 | Image AI Readiness ✨ | 8% |
| 6 | Semantic HTML | 7% |
| 7 | Sitemap.xml | 7% |
| 8 | Open Graph | 5% |
| 9 | llms.txt | 5% |
| 10 | FAQ/QA Blocks | 4% |
| 11 | Author Authority (E-E-A-T) | 3% |
| 12 | Page Speed | 4% |
| 13 | AI Visibility ✨ (GPT-4.1 nano) | 5% |

---

## สิ่งที่ต้องทำก่อน Deploy

### ต้องแก้ (High Priority)

1. **ReDoS ใน `ssr-checker.ts:43`** — เปลี่ยน regex เป็น indexOf loop
2. **Prompt Injection ใน `ai-visibility-checker.ts`** — sanitize title/meta + system message
3. **OpenAI error body leaked** — log server-side only, return generic message
4. **`<html lang>` ไม่ sync** — เพิ่ม `useEffect` ใน I18nProvider
5. **ARIA live region** — แยก container ออกจาก error content
6. **Dynamic stagger class** — ใช้ inline `style={{ animationDelay }}` แทน

### ควรแก้ (Medium)

7. DNS timer clearTimeout (`security.ts`)
8. Body read timeout (`ai-visibility-checker.ts`, `route.ts`)
9. `prefers-reduced-motion` CSS media query
10. `useI18n()` throw error เมื่อใช้นอก Provider
11. Schema details `aria-expanded`
12. Animated score counter `aria-hidden`

---

## ยังไม่ได้ทำ

- [ ] แก้ปัญหา High 6 ตัว
- [ ] ตั้ง `OPENAI_API_KEY` ใน `.env` บน server
- [ ] Build + Deploy ขึ้น AWS
- [ ] ทดสอบ AI Visibility Checker กับเว็บจริง
- [ ] อัปเดต docs/validation-criteria page ให้ครอบคลุม 13 ข้อ
- [ ] Commit + Push ทั้งหมดขึ้น GitHub
