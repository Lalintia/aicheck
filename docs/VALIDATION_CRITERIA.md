# AI Search Checker - เกณฑ์การตรวจสอบ

> **เอกสารอ้างอิงมาตรฐานการตรวจสอบ** สำหรับ AI Search Checker (aicheck.ohmai.me)
>
> อัปเดตล่าสุด: เมษายน 2026 — **12 checks** (AI Visibility แยกเป็นหน้าต่างหาก)

---

## สารบัญ

1. [Schema.org Structured Data](#1-schemaorg-structured-data) — 20%
2. [SSR/CSR Detection](#2-ssrcsr-detection) — 15%
3. [robots.txt](#3-robotstxt) — 12%
4. [Heading Hierarchy](#4-heading-hierarchy) — 9%
5. [Image AI Readiness](#5-image-ai-readiness) — 8%
6. [Semantic HTML](#6-semantic-html) — 7%
7. [XML Sitemap](#7-xml-sitemap) — 7%
8. [Open Graph Protocol](#8-open-graph-protocol) — 5%
9. [llms.txt](#9-llmstxt) — 5%
10. [FAQ/QA Blocks](#10-faqqa-blocks) — 4%
11. [Author Authority (E-E-A-T)](#11-author-authority-e-e-a-t) — 3%
12. [Page Speed](#12-page-speed) — 5%

---

## 1. Schema.org Structured Data

**น้ำหนัก: 20%** | ความสำคัญ: สูงมาก

### ทำไมต้องตรวจ?

Schema.org Structured Data ช่วยให้ Search Engine และ AI สามารถเข้าใจเนื้อหาของเว็บไซต์ได้ดีขึ้น นำไปสู่:
- **Rich Snippets** ในผลการค้นหา
- **AI Overviews** ที่แสดงข้อมูลจากเว็บไซต์
- **Knowledge Graph** ที่เชื่อมโยงข้อมูล

### ตรวจอะไรบ้าง?

| Schema Type | น้ำหนัก | ตรวจ Fields หลัก |
|-------------|--------|------------------|
| **Organization** | 30% | `@type`, `name`, `url`, `logo`, `sameAs` |
| **WebSite** | 20% | `@type`, `name`, `url`, `potentialAction` |
| **Article** | 15% | `@type`, `headline`, `author`, `datePublished`, `publisher`, `image` |
| **BreadcrumbList** | 15% | `@type`, `itemListElement`, `position`, `name`, `item` |
| **WebPage** | 10% | `@type`, `name`, `description`, `url` |
| **LocalBusiness** | 10% | `@type`, `name`, `address`, `telephone`, `geo` |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Schema.org Official** | https://schema.org/ |
| **Google Search Central - Structured Data** | https://developers.google.com/search/docs/appearance/structured-data |

---

## 2. SSR/CSR Detection

**น้ำหนัก: 15%** | ความสำคัญ: สูงมาก

### ทำไมต้องตรวจ?

AI Search Crawlers (เช่น GPTBot, ClaudeBot) ส่วนใหญ่ไม่รัน JavaScript — ถ้าเว็บใช้ Client-Side Rendering (CSR) อย่างเดียว AI จะเห็นแค่หน้าว่าง:
- **SSR (Server-Side Rendering):** AI เห็นเนื้อหาทันที
- **CSR (Client-Side Rendering):** AI อาจเห็นแค่ `<div id="root"></div>` ว่างเปล่า
- **Hybrid/SSG:** ดีที่สุด — AI เห็นเนื้อหา + โหลดเร็ว

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| HTML response มีเนื้อหาจริง (ไม่ใช่แค่ skeleton) | **Required** |
| มี meaningful text content ใน initial HTML | **Required** |
| ไม่พึ่ง JavaScript อย่างเดียวสำหรับเนื้อหาหลัก | **Required** |
| ตรวจ framework indicators (Next.js SSR, Nuxt, etc.) | Informational |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google - JavaScript SEO** | https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics |
| **Web.dev - Rendering on the Web** | https://web.dev/articles/rendering-on-the-web |

---

## 3. robots.txt

**น้ำหนัก: 12%** | ความสำคัญ: สูง

### ทำไมต้องตรวจ?

robots.txt บอก Search Engine Crawler ว่าควรหรือไม่ควรเข้าถึงส่วนใดของเว็บไซต์:
- ป้องกันการ index เนื้อหาที่ไม่ต้องการ
- ประหยัด crawl budget
- **สำคัญสำหรับ AI:** ถ้า block GPTBot, ClaudeBot ฯลฯ AI จะไม่เจอเว็บเลย

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| ไฟล์มีอยู่ (`/robots.txt`) | Required |
| มี `User-agent` directive | Required |
| มี `Sitemap` directive | Recommended |
| ไม่มี syntax error | Required |
| ไม่ block AI crawlers (GPTBot, ClaudeBot, Google-Extended) | **Important** |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google Search Central - robots.txt** | https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt |
| **RFC 9309 - Robots Exclusion Protocol** | https://www.rfc-editor.org/rfc/rfc9309.html |

---

## 4. Heading Hierarchy

**น้ำหนัก: 9%** | ความสำคัญ: ปานกลาง

### ทำไมต้องตรวจ?

Heading Hierarchy ช่วย:
- ผู้ใช้ screen reader นำทางเนื้อหา
- Search Engine เข้าใจความสำคัญของเนื้อหา
- AI สรุปโครงสร้างของบทความ

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| มี `<h1>` 1 อันต่อหน้า | **Required** |
| ไม่ข้ามระดับ (h1 → h3) | **Required** |
| h1 ต้องอยู่ก่อน h2, h3... | **Required** |
| ใช้ heading ตามลำดับ | Best Practice |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **W3C - Heading Rank** | https://www.w3.org/WAI/tutorials/page-structure/headings/ |
| **WebAIM - Headings** | https://webaim.org/techniques/semanticstructure/#headings |

---

## 5. Image AI Readiness

**น้ำหนัก: 8%** | ความสำคัญ: ปานกลาง

### ทำไมต้องตรวจ?

AI ไม่สามารถ "มองเห็น" รูปภาพได้โดยตรง — ต้องอาศัย metadata:
- **alt text** บอก AI ว่ารูปคืออะไร
- **title/figcaption** เพิ่มบริบท
- รูปที่ไม่มี alt text = AI มองไม่เห็นเลย

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| ทุกรูปมี `alt` attribute | **Required** |
| alt text อธิบายเนื้อหาจริง (ไม่ใช่แค่ "image" หรือ filename) | **Required** |
| Decorative images ใช้ `alt=""` (empty alt) | Best Practice |
| มี `<figcaption>` สำหรับรูปสำคัญ | Recommended |
| จำนวนรูปไม่มี alt จากทั้งหมด | Informational |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **W3C - Image Alt Text** | https://www.w3.org/WAI/tutorials/images/ |
| **Google - Image Best Practices** | https://developers.google.com/search/docs/appearance/google-images |

---

## 6. Semantic HTML

**น้ำหนัก: 7%** | ความสำคัญ: ปานกลาง

### ทำไมต้องตรวจ?

Semantic HTML ช่วย:
- Screen readers เข้าใจโครงสร้าง (Accessibility)
- Search Engine เข้าใจ context ของเนื้อหา
- AI แยกแยะส่วนต่างๆ ของหน้าเว็บ

### ตรวจอะไรบ้าง?

| Element | ใช้สำหรับ | สถานะ |
|---------|----------|--------|
| `<header>` | ส่วนหัวของเว็บ/section | Recommended |
| `<nav>` | Navigation links | Recommended |
| `<main>` | เนื้อหาหลัก | **Required** |
| `<article>` | เนื้อหาอิสระ (blog post, news) | Recommended |
| `<section>` | กลุ่มเนื้อหาที่เกี่ยวข้อง | Recommended |
| `<aside>` | เนื้อหาเสริม (sidebar) | Recommended |
| `<footer>` | ส่วนท้ายของเว็บ/section | Recommended |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **MDN - HTML Semantic Elements** | https://developer.mozilla.org/en-US/docs/Glossary/Semantics |
| **W3C HTML5 Specification** | https://html.spec.whatwg.org/multipage/ |

---

## 7. XML Sitemap

**น้ำหนัก: 7%** | ความสำคัญ: ปานกลาง

### ทำไมต้องตรวจ?

XML Sitemap ช่วย Search Engine และ AI ค้นพบหน้าสำคัญของเว็บไซต์ได้เร็วขึ้น:
- แจ้ง URL ทั้งหมดที่ต้องการ index
- บอกความสำคัญและความถี่ในการ update

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| ไฟล์มีอยู่ (`/sitemap.xml`) | Required |
| Valid XML format | Required |
| มี `<urlset>` หรือ `<sitemapindex>` | Required |
| URL ไม่เกิน 50,000 URLs | Best Practice |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google Search Central - Sitemaps** | https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview |
| **Sitemap.org Protocol** | https://www.sitemaps.org/protocol.html |

---

## 8. Open Graph Protocol

**น้ำหนัก: 5%** | ความสำคัญ: ต่ำ

### ทำไมต้องตรวจ?

Open Graph กำหนดวิธีแสดงตัวอย่างลิงก์บน Social Media และ AI chat:
- Facebook, LinkedIn, Twitter/X
- Messaging apps (LINE, WhatsApp)
- AI responses ที่แสดง link preview

### ตรวจอะไรบ้าง?

| Property | สถานะ |
|----------|--------|
| `og:title` | **Required** |
| `og:description` | **Required** |
| `og:image` | **Required** |
| `og:url` | **Required** |
| `og:type` | Recommended |
| `og:site_name` | Recommended |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Open Graph Protocol** | https://ogp.me/ |

---

## 9. llms.txt

**น้ำหนัก: 5%** | ความสำคัญ: ต่ำ

### ทำไมต้องตรวจ?

llms.txt เป็นมาตรฐานใหม่ที่ช่วย AI (ChatGPT, Claude, Gemini) เข้าใจเว็บไซต์:
- บอก AI ว่าเว็บมีเนื้อหาอะไรบ้าง
- ช่วย AI อ้างอิงข้อมูลถูกต้อง
- เพิ่มโอกาสถูก cite ใน AI responses

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| ไฟล์มีอยู่ (`/llms.txt`) | Required |
| มี H1 Title | Required |
| มี Bullet list ของหน้าสำคัญ | Required |
| มี Optional sections | Recommended |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **llms.txt Specification** | https://llmstxt.org/ |

---

## 10. FAQ/QA Blocks

**น้ำหนัก: 4%** | ความสำคัญ: ต่ำ

### ทำไมต้องตรวจ?

FAQ content เป็น "อาหาร" ที่ AI ชอบมาก:
- AI ดึง FAQ ไปตอบคำถามได้โดยตรง (zero-click results)
- Google Featured Snippets ใช้ FAQ schema
- เพิ่มโอกาสที่เว็บจะถูก cite ใน AI responses

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| มี FAQ Schema (`@type: FAQPage`) | Recommended |
| มี Question + Answer pairs ใน HTML | Recommended |
| ใช้ `<details>/<summary>` สำหรับ Q&A | Optional |
| มีอย่างน้อย 3 คำถาม | Best Practice |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google - FAQ Schema** | https://developers.google.com/search/docs/appearance/structured-data/faqpage |
| **Schema.org - FAQPage** | https://schema.org/FAQPage |

---

## 11. Author Authority (E-E-A-T)

**น้ำหนัก: 3%** | ความสำคัญ: ต่ำ

### ทำไมต้องตรวจ?

Google ใช้ E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) ในการจัดอันดับ:
- AI ใช้ author signals ตัดสินความน่าเชื่อถือ
- เว็บที่มี author info ชัดเจนจะถูก cite บ่อยกว่า
- สำคัญมากสำหรับ YMYL (Your Money Your Life) content

### ตรวจอะไรบ้าง?

| รายการ | สถานะ |
|--------|--------|
| มี `<meta name="author">` | Recommended |
| มี Author Schema (`@type: Person`) | Recommended |
| มีลิงก์ไปยัง author profile (LinkedIn, About page) | Recommended |
| มี `@type: Organization` พร้อม contact info | Recommended |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google - E-E-A-T** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **Schema.org - Person** | https://schema.org/Person |

---

## 12. Page Speed

**น้ำหนัก: 5%** | ความสำคัญ: ต่ำ

### ทำไมต้องตรวจ?

Core Web Vitals เป็นปัจจัยการจัดอันดับของ Google:
- **LCP** (Largest Contentful Paint) — ความเร็วโหลด
- **INP** (Interaction to Next Paint) — การตอบสนอง
- **CLS** (Cumulative Layout Shift) — ความเสถียรของ layout
- AI Crawlers ก็มี timeout — เว็บช้าเกินไป AI จะข้ามไป

### ตรวจอะไรบ้าง?

| Metric | เกณฑ์ดี | ต้องปรับปรุง |
|--------|---------|--------------|
| **LCP** | ≤ 2.5s | > 4.0s |
| **INP** | ≤ 200ms | > 500ms |
| **CLS** | ≤ 0.1 | > 0.25 |

### อ้างอิงมาตรฐาน

| แหล่งที่มา | ลิงก์ |
|-----------|--------|
| **Google Core Web Vitals** | https://web.dev/articles/vitals |
| **PageSpeed Insights** | https://pagespeed.web.dev/ |

---

## สรุปน้ำหนักการตรวจสอบ (12 checks)

| # | หัวข้อ | น้ำหนัก | ความสำคัญ |
|---|--------|--------|-----------|
| 1 | Schema.org Structured Data | **20%** | สูงมาก |
| 2 | SSR/CSR Detection | **15%** | สูงมาก |
| 3 | robots.txt | **12%** | สูง |
| 4 | Heading Hierarchy | **9%** | ปานกลาง |
| 5 | Image AI Readiness | **8%** | ปานกลาง |
| 6 | Semantic HTML | **7%** | ปานกลาง |
| 7 | XML Sitemap | **7%** | ปานกลาง |
| 8 | Open Graph Protocol | **5%** | ต่ำ |
| 9 | llms.txt | **5%** | ต่ำ |
| 10 | FAQ/QA Blocks | **4%** | ต่ำ |
| 11 | Author Authority (E-E-A-T) | **3%** | ต่ำ |
| 12 | Page Speed | **5%** | ต่ำ |
| | **รวม** | **100%** | |

---

## AI Visibility Check (แยกต่างหาก)

AI Visibility ถูกแยกเป็นหน้าต่างหากที่ `/ai-check` เนื่องจากใช้ OpenAI API มีค่าใช้จ่าย (~$0.001/ครั้ง)

ตรวจโดยใช้ GPT-4.1 nano ถามว่า AI รู้จักเว็บไซต์/องค์กรนี้หรือไม่ — เป็นการทดสอบ "real-world AI awareness"

---

*เอกสารนี้จัดทำโดย AI Search Checker Team — อัปเดตล่าสุด เมษายน 2026*
