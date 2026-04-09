# UI Design - การแสดงเอกสารอ้างอิงบนเว็บแอป

> เอกสารนี้อธิบายการออกแบบ UI สำหรับแสดงเกณฑ์การตรวจสอบบน aicheck.ohmai.me

---

## 🎯 ภาพรวม

เรามี 2 ระดับของการแสดงข้อมูลอ้างอิง:

1. **Quick Reference (ใน Checklist)** - ปุ่ม "อ้างอิง" ที่แต่ละรายการ
2. **Full Documentation (หน้าแยก)** - หน้า `/docs/validation-criteria` แสดงทั้งหมด

---

## 📍 1. Quick Reference (ใน Checklist)

### ตำแหน่ง
```
┌─────────────────────────────────────────────────────────────┐
│ 1  Schema.org Structured Data              [อ้างอิง] [ดี ▼] │
│    Validate structured data markup...                       │
└─────────────────────────────────────────────────────────────┘
```

### การทำงาน
- คลิกปุ่ม "อ้างอิง" → เปิด Dialog แสดงรายละเอียด
- แสดง: ทำไมต้องตรวจ, รายการที่ตรวจ, ลิงก์อ้างอิง

### ตัวอย่าง Dialog
```
┌─────────────────────────────────────────────────────────────┐
│ Schema.org Structured Data                    [น้ำหนัก 25%] │
│ ตรวจสอบ Structured Data ตามมาตรฐาน Schema.org               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● ทำไมต้องตรวจ?                                         │ │
│ │   ช่วยให้ Search Engine และ AI เข้าใจเนื้อหาเว็บไซต์...  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▼ รายการที่ตรวจสอบ (6 รายการ)                              │
│   • Organization (@type, name, url, logo, sameAs)           │
│   • WebSite (@type, name, url, potentialAction)             │
│   • Article (@type, headline, author, datePublished...)     │
│   ...                                                       │
│                                                             │
│ ▼ อ้างอิงมาตรฐาน (5 แหล่งที่มา)                            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [Schema.org] Schema.org Official              ↗     │   │
│   │ [Google]     Structured Data Guidelines       ↗     │   │
│   │ [Google]     Article Schema                   ↗     │   │
│   │ ...                                                 │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  เกณฑ์การตรวจสอบอ้างอิงตามมาตรฐาน Google Search Central    │
│  อัปเดตล่าสุด: กุมภาพันธ์ 2026                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 2. Full Documentation Page

### URL
```
https://aicheck.ohmai.me/docs/validation-criteria
```

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ←  เกณฑ์การตรวจสอบ                              [อัปเดตล่าสุด]│
│     เอกสารอ้างอิงมาตรฐานการตรวจสอบสำหรับ AI Search Checker │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │   สารบัญ     │  │                                      │ │
│  │              │  │  ℹ️ เกี่ยวกับเอกสารนี้               │ │
│  │ Schema.org   │  │  เอกสารนี้รวบรวมเกณฑ์การตรวจสอบ...   │ │
│  │   [25%]      │  │                                      │ │
│  │              │  │  ┌────────────────────────────────┐  │ │
│  │ robots.txt   │  │  │ 1. Schema.org Structured Data  │  │ │
│  │   [20%]      │  │  │    [สูงมาก]              [25%] │  │ │
│  │              │  │  │    ตรวจสอบ Structured Data...  │  │ │
│  │ XML Sitemap  │  │  │                                │  │ │
│  │   [15%]      │  │  │  ● ทำไมต้องตรวจ?               │  │ │
│  │              │  │  │    ...                         │  │ │
│  │ ...          │  │  │                                │  │ │
│  │              │  │  │  ✓ รายการที่ตรวจสอบ            │  │ │
│  │ ───────────  │  │  │    • Organization [30%]        │  │ │
│  │              │  │  │    • WebSite [20%]             │  │ │
│  │ สรุปน้ำหนัก  │  │  │    • ...                       │  │ │
│  │ 🔴 สูงมาก 60%│  │  │                                │  │ │
│  │ 🟠 สูง 25%   │  │  │  📚 อ้างอิงมาตรฐาน              │  │ │
│  │ 🟡 ปานกลาง   │  │  │    ┌──────────────────────┐    │  │ │
│  │ 🟢 น้อย 5%   │  │  │    │ [Schema.org] ...  ↗  │    │  │ │
│  │              │  │  │    │ [Google]     ...  ↗  │    │  │ │
│  │              │  │  │    └──────────────────────┘    │  │ │
│  │              │  │  └────────────────────────────────┘  │ │
│  │              │  │                                      │ │
│  │              │  │  ┌────────────────────────────────┐  │ │
│  │              │  │  │ 2. robots.txt                  │  │ │
│  │              │  │  │    [สูงมาก]              [20%] │  │ │
│  │              │  │  │    ...                         │  │ │
│  │              │  │  └────────────────────────────────┘  │ │
│  │              │  │                                      │ │
│  │              │  │  ...                                 │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│  เกณฑ์การตรวจสอบจะได้รับการอัปเดตตามประกาศจาก Google...    │
│  เอกสารนี้จัดทำโดย AI Search Checker Team                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### สีสำหรับระดับความสำคัญ
```css
/* สูงมาก */
--importance-high: #ef4444;        /* red-500 */
--importance-high-bg: #fef2f2;     /* red-50 */

/* สูง */
--importance-medium-high: #f97316; /* orange-500 */
--importance-medium-high-bg: #fff7ed; /* orange-50 */

/* ปานกลาง */
--importance-medium: #eab308;      /* yellow-500 */
--importance-medium-bg: #fefce8;   /* yellow-50 */

/* น้อย */
--importance-low: #22c55e;         /* green-500 */
--importance-low-bg: #f0fdf4;      /* green-50 */

/* ไม่นับ */
--importance-none: #6b7280;        /* gray-500 */
--importance-none-bg: #f9fafb;     /* gray-50 */
```

### Badges
```
[Schema.org]  - สี outline, แสดงแหล่งที่มา
[Required]    - สี primary (สำคัญ)
[Recommended] - สี outline (แนะนำ)
[25%]         - สี secondary (น้ำหนัก)
```

### Icons
```
BookOpen      - เอกสารอ้างอิง
ExternalLink  - ลิงก์ภายนอก
CheckCircle2  - รายการที่ตรวจ
AlertCircle   - ทำไมต้องตรวจ
Info          - ข้อมูลทั่วไป
Scale         - สรุปน้ำหนัก
```

---

## 📱 Responsive Design

### Desktop (≥1024px)
- แสดง Sidebar สารบัญ + เนื้อหาหลัก
- 2 คอลัมน์

### Tablet (768px - 1023px)
- ซ่อน Sidebar
- แสดงเนื้อหาเต็มความกว้าง
- มีปุ่ม Jump to section ด้านบน

### Mobile (<768px)
- เนื้อหาเต็มความกว้าง
- Cards แสดงแบบ stack
- Badges ขนาดเล็กลง

---

## 🔗 Navigation

### จากหน้าแรก
```
[Hero Section]
    ↓
[ดูเกณฑ์การตรวจสอบทั้งหมด] → /docs/validation-criteria
```

### จากผลลัพธ์ (Checklist)
```
[Checklist Item]
    ↓
[อ้างอิง] → Dialog แสดงรายละเอียด
    ↓
[ดูเพิ่มเติม] → /docs/validation-criteria#{checkType}
```

---

## 📝 Content Structure

### แต่ละหัวข้อประกอบด้วย:
1. **Title** + Badge ความสำคัญ + Badge น้ำหนัก
2. **Description** - อธิบายสั้นๆ
3. **Why Section** - ทำไมต้องตรวจ (พื้นหลังสีฟ้าอ่อน)
4. **Checks List** - รายการที่ตรวจพร้อม Badge Required/Recommended
5. **Standards** - ลิงก์อ้างอิงพร้อม Icon แหล่งที่มา

### ข้อมูลที่แสดงใน Dialog:
- Title + น้ำหนัก
- ทำไมต้องตรวจ
- รายการที่ตรวจ (expandable)
- ลิงก์อ้างอิง (expandable)
- Footer: แหล่งที่มา + วันที่อัปเดต

---

## 🚀 Implementation Checklist

- [x] สร้าง `docs/VALIDATION_CRITERIA.md` - เอกสาร reference
- [x] สร้าง `components/check-references.tsx` - Quick Reference Dialog
- [x] สร้าง `app/docs/validation-criteria/page.tsx` - Full Documentation Page
- [x] เพิ่มปุ่ม "อ้างอิง" ใน `checklist-item.tsx`
- [x] เพิ่มปุ่ม "ดูเกณฑ์ทั้งหมด" ใน `hero-section.tsx`
- [ ] Copy ไฟล์ไปยัง `aicheck/` (ถ้าต่างโฟลเดอร์)
- [ ] ทดสอบ build
- [ ] Deploy

---

## 📂 File Structure

```
aicheck/
├── app/
│   └── docs/
│       └── validation-criteria/
│           └── page.tsx          # หน้าเอกสารเต็ม
├── components/
│   └── features/
│       └── results/
│           └── components/
│               ├── check-references.tsx   # Dialog อ้างอิง
│               ├── checklist-item.tsx     # +ปุ่มอ้างอิง
│               └── schema-details.tsx
├── docs/
│   └── VALIDATION_CRITERIA.md    # เอกสาร reference
└── public/
    └── (static assets)
```

---

## 🎯 User Flow

```
ผู้ใช้เข้าเว็บ
    ↓
เห็นปุ่ม "ดูเกณฑ์การตรวจสอบทั้งหมด"
    ↓
คลิก → ไปหน้า /docs/validation-criteria
    ↓
อ่านรายละเอียดทั้งหมด / คลิกลิงก์ไปดูมาตรฐานจริง
    ↓
กลับไปตรวจเว็บไซต์
    ↓
ดูผลลัพธ์ → เห็นปุ่ม "อ้างอิง" แต่ละรายการ
    ↓
คลิก "อ้างอิง" → ดูรายละเอียดเฉพาะหัวข้อนั้น
    ↓
คลิกลิงก์ไปดูมาตรฐานจริง
```

---

*ออกแบบโดย AI Search Checker Team*
*อัปเดตล่าสุด: กุมภาพันธ์ 2026*
