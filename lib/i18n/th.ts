import type { Translations } from './types';

export const th: Translations = {
  hero: {
    badge: '13 ปัจจัยสำหรับ AI Search',
    title: 'เว็บไซต์ของคุณ',
    titleHighlight: 'AI ค้นเจอไหม?',
    subtitle: 'ตรวจสอบ 13 ปัจจัยสำคัญที่กำหนดว่า AI Search อย่าง ChatGPT, Perplexity และ Google AI Overview จะค้นพบ เข้าใจ และอ้างอิงเว็บไซต์ของคุณได้ดีแค่ไหน',
    trustFree: 'วิเคราะห์ฟรี',
    trustChecks: '13 รายการ',
    trustAI: 'ขับเคลื่อนด้วย AI',
  },
  form: {
    label: 'URL เว็บไซต์',
    placeholder: 'www.example.com',
    submit: 'เริ่มวิเคราะห์',
    scanning: 'กำลังสแกน...',
    errorEmpty: 'กรุณากรอก URL ที่ถูกต้อง',
  },
  results: {
    title: 'ผลการวิเคราะห์',
    checklist: 'รายการตรวจสอบ',
    checksCount: '13 รายการ',
    recommendations: 'สิ่งที่ควรปรับปรุง',
    itemsToImprove: 'รายการที่ควรแก้ไข',
    allClear: 'ผ่านทั้งหมด',
    allClearMessage: 'เว็บไซต์ของคุณพร้อมสำหรับ AI Search แล้ว ไม่พบปัญหาสำคัญ',
    criticalIssues: 'ปัญหาเร่งด่วน',
    highPriority: 'ความสำคัญสูง',
    mediumPriority: 'ความสำคัญปานกลาง',
    lowPriority: 'ความสำคัญต่ำ',
    passed: 'ผ่าน',
    partial: 'ผ่านบางส่วน',
    failed: 'ไม่ผ่าน',
    pass: 'ผ่าน',
    fail: 'ไม่ผ่าน',
    analyzeAnother: 'วิเคราะห์เว็บไซต์อื่น',
  },
  grades: {
    excellent: 'ดีเยี่ยม',
    good: 'ดี',
    fair: 'พอใช้',
    poor: 'ต้องปรับปรุง',
  },
  checks: {
    schema: {
      title: 'Schema.org (JSON-LD)',
      description: 'ข้อมูลเชิงโครงสร้างที่ช่วยให้ AI เข้าใจเนื้อหา',
    },
    ssrCsr: {
      title: 'การแสดงผลฝั่งเซิร์ฟเวอร์',
      description: 'เนื้อหาแสดงได้โดยไม่ต้องรัน JavaScript',
    },
    robotsTxt: {
      title: 'robots.txt',
      description: 'บอก AI ว่าเข้าถึงหน้าไหนได้บ้าง',
    },
    headingHierarchy: {
      title: 'ลำดับหัวข้อ',
      description: 'โครงสร้าง H1 → H2 → H3 ที่ชัดเจน',
    },
    imageAI: {
      title: 'รูปภาพพร้อมสำหรับ AI',
      description: 'Alt text และบริบทเพื่อให้ AI เข้าใจรูปภาพ',
    },
    semanticHTML: {
      title: 'Semantic HTML',
      description: 'โครงสร้าง HTML ที่มีความหมาย',
    },
    sitemap: {
      title: 'Sitemap.xml',
      description: 'แผนผังเว็บไซต์สำหรับ AI',
    },
    openGraph: {
      title: 'Open Graph',
      description: 'แท็กตัวอย่างสำหรับ AI และโซเชียลมีเดีย',
    },
    llmsTxt: {
      title: 'llms.txt',
      description: 'ไฟล์คำแนะนำสำหรับ AI โดยเฉพาะ',
    },
    faqBlocks: {
      title: 'FAQ/คำถามที่พบบ่อย',
      description: 'รูปแบบถาม-ตอบสำหรับผลลัพธ์ Zero-Click',
    },
    authorAuthority: {
      title: 'ข้อมูลผู้เขียน (E-E-A-T)',
      description: 'ข้อมูลผู้เขียนและสัญญาณความน่าเชื่อถือ',
    },
    pageSpeed: {
      title: 'ความเร็วเว็บ',
      description: 'ประสิทธิภาพการโหลดหน้าเว็บสำหรับ Crawler',
    },
    aiVisibility: {
      title: 'AI รู้จักเว็บนี้ไหม',
      description: 'ทดสอบว่า AI รู้จักเว็บไซต์หรือองค์กรนี้หรือไม่',
    },
  },
  error: {
    title: 'วิเคราะห์ไม่สำเร็จ',
    message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    tryAgain: 'ลองอีกครั้ง',
  },
  loading: 'กำลังโหลด...',
};
