/**
 * shared.js
 * ไฟล์กลางที่ใช้ร่วมกันทุกหน้า
 * ประกอบด้วย: ข้อมูลจุดจอด, สีรถ, ค่าคงที่ simulation,
 * state management ผ่าน localStorage, helper functions,
 * และ simulation engine สำหรับจำลองการเคลื่อนที่ของรถ
 */

// =============================================================
// DATA: จุดจอดทั้งหมด 10 จุดในเส้นทางวนรอบ
// แต่ละจุดมี:
//   id        - หมายเลขลำดับ (1-10)
//   name      - ชื่อภาษาไทย
//   nameEn    - ชื่อภาษาอังกฤษ
//   code      - รหัสย่อ (P1-P10) ใช้แสดงบนแผนที่
//   facilities - รายการสิ่งอำนวยความสะดวกใกล้เคียง
//   x, y      - พิกัดอ้างอิงบนแผนที่ (หน่วย pixel ของ canvas เดิม)
// =============================================================
const stops = [
  { id:1,  name:"ประตูหลัก",          nameEn:"Main Gate",               code:"P1",  facilities:["ที่จอดรถ","ห้องน้ำ","ตู้ ATM"],               x:150, y:190 },
  { id:2,  name:"คณะครุศาสตร์",       nameEn:"Faculty of Education",    code:"P2",  facilities:["ห้องน้ำ","ร้านกาแฟ"],                         x:350, y:80  },
  { id:3,  name:"หอสมุดกลาง",         nameEn:"Central Library",         code:"P3",  facilities:["ห้องน้ำ","Wi-Fi","ร้านกาแฟ","ห้องสมุด"],      x:560, y:100 },
  { id:4,  name:"อาคารวิทยาศาสตร์",   nameEn:"Science Building",        code:"P4",  facilities:["ห้องน้ำ","ร้านกาแฟ","ตู้ ATM"],               x:700, y:190 },
  { id:5,  name:"อาคารกีฬา",          nameEn:"Sports Complex",          code:"P5",  facilities:["ห้องน้ำ","ฟิตเนส","ร้านสะดวกซื้อ"],           x:800, y:250 },
  { id:6,  name:"หอพักนักศึกษา",      nameEn:"Student Dormitory",       code:"P6",  facilities:["ร้านสะดวกซื้อ","ตลาดนัด","ห้องน้ำ","Wi-Fi"], x:750, y:370 },
  { id:7,  name:"คณะวิศวกรรมศาสตร์", nameEn:"Engineering Faculty",     code:"P7",  facilities:["ห้องน้ำ","ที่จอดรถ","ร้านกาแฟ"],              x:550, y:420 },
  { id:8,  name:"อาคารบริหาร",        nameEn:"Administration Building", code:"P8",  facilities:["ห้องน้ำ","ตู้ ATM","ที่จอดรถ"],               x:350, y:400 },
  { id:9,  name:"โรงอาหาร",           nameEn:"Canteen",                 code:"P9",  facilities:["ร้านอาหาร","ห้องน้ำ","ตลาดนัด","Wi-Fi"],      x:200, y:350 },
  { id:10, name:"ศูนย์แพทย์",         nameEn:"Medical Center",          code:"P10", facilities:["โรงพยาบาล","ร้านยา","ห้องน้ำ"],               x:120, y:230 },
];

// =============================================================
// DATA: ข้อมูล icon และสีของสิ่งอำนวยความสะดวกแต่ละประเภท
// ใช้ใน stops.html เพื่อ render badge สิ่งอำนวยความสะดวก
// =============================================================
const FACILITY_MAP = {
  "ห้องน้ำ":       { label:"ห้องน้ำ",        icon:"💧", color:"#2196F3" },
  "ตลาดนัด":       { label:"ตลาดนัด",        icon:"🛒", color:"#FF9800" },
  "ตู้ ATM":       { label:"ตู้ ATM",        icon:"💳", color:"#4CAF50" },
  "ร้านกาแฟ":      { label:"ร้านกาแฟ",       icon:"☕", color:"#795548" },
  "ที่จอดรถ":      { label:"ที่จอดรถ",       icon:"🅿️", color:"#607D8B" },
  "Wi-Fi":         { label:"Wi-Fi",          icon:"📶", color:"#9C27B0" },
  "ร้านอาหาร":     { label:"ร้านอาหาร",      icon:"🍽️", color:"#F44336" },
  "ร้านยา":        { label:"ร้านยา",         icon:"💊", color:"#00BCD4" },
  "ร้านสะดวกซื้อ": { label:"ร้านสะดวกซื้อ", icon:"🏪", color:"#E91E63" },
  "ฟิตเนส":        { label:"ฟิตเนส",         icon:"🏋️", color:"#FF5722" },
  "ห้องสมุด":      { label:"ห้องสมุด",       icon:"📚", color:"#3F51B5" },
  "โรงพยาบาล":     { label:"โรงพยาบาล",      icon:"❤️", color:"#F44336" },
};

// =============================================================
// DATA: ชุดสีประจำรถแต่ละคัน (id 1-3)
//   main  - สีหลัก ใช้กับ header card, badge, progress bar
//   light - สีพื้นหลังอ่อน ใช้กับ info box ขณะจอด
//   text  - สีตัวอักษรบนพื้น light
// =============================================================
const BUS_COLORS = {
  1: { main:"#E53935", light:"#FFEBEE", text:"#B71C1C" }, // แดง
  2: { main:"#F9A825", light:"#FFF8E1", text:"#F57F17" }, // เหลือง
  3: { main:"#7B1FA2", light:"#F3E5F5", text:"#4A148C" }, // ม่วง
};

// =============================================================
// CONSTANTS: ค่าคงที่สำหรับ simulation
//   TRAVEL_TIME - เวลาเดินทางระหว่างจุดจอด (วินาที)
//   DWELL_TIME  - เวลาจอดรับ-ส่งผู้โดยสารที่แต่ละจุด (วินาที)
//   SIM_TICK    - ความถี่ในการ update UI (มิลลิวินาที)
//   SIM_SPT     - จำนวนวินาทีที่ผ่านไปต่อ 1 tick (Seconds Per Tick)
//                 ทำให้ simulation เร็วกว่าเวลาจริง
// =============================================================
const TRAVEL_TIME = 300, DWELL_TIME = 300, SIM_TICK = 2000, SIM_SPT = 15;

// =============================================================
// STATE MANAGEMENT: บันทึก/โหลด state ของรถผ่าน localStorage
// ทำให้ข้อมูลตำแหน่งรถ sync กันระหว่างหน้าต่างๆ
// เมื่อผู้ใช้สลับหน้า รถจะยังอยู่ในตำแหน่งเดิม
// =============================================================

/**
 * โหลด state รถจาก localStorage
 * ถ้ายังไม่มีข้อมูล (เปิดครั้งแรก) จะ return ค่าเริ่มต้น
 * @returns {Array} array ของ bus objects
 */
function loadBuses() {
  const saved = localStorage.getItem('busState');
  if (saved) return JSON.parse(saved);
  // ค่าเริ่มต้น: รถ 3 คันกระจายอยู่คนละจุดในเส้นทาง
  return [
    { id:1, name:"รถเมล์ที่ 1", currentStopIndex:0, progress:0,   speed:0,  passengers:12, battery:85, status:"จอดรับผู้โดยสาร", isDwelling:true,  dwellRemaining:180 },
    { id:2, name:"รถเมล์ที่ 2", currentStopIndex:3, progress:0.4, speed:22, passengers:8,  battery:68, status:"กำลังเดินทาง",    isDwelling:false, dwellRemaining:0   },
    { id:3, name:"รถเมล์ที่ 3", currentStopIndex:7, progress:0,   speed:0,  passengers:15, battery:48, status:"จอดรับผู้โดยสาร", isDwelling:true,  dwellRemaining:60  },
  ];
}

/**
 * บันทึก state รถลง localStorage
 * เรียกทุกครั้งหลัง tickBus() เพื่อให้หน้าอื่นเห็นข้อมูลล่าสุด
 * @param {Array} buses - array ของ bus objects ที่ต้องการบันทึก
 */
function saveBuses(buses) {
  localStorage.setItem('busState', JSON.stringify(buses));
}

// =============================================================
// HELPERS: ฟังก์ชันช่วยเหลือทั่วไป
// =============================================================

/**
 * เติม 0 นำหน้าตัวเลขให้มี 2 หลักเสมอ
 * เช่น pad(5) => "05", pad(12) => "12"
 * @param {number} n
 * @returns {string}
 */
function pad(n) { return String(n).padStart(2, '0'); }

/**
 * แปลงวินาทีเป็น string รูปแบบ "MM:SS"
 * เช่น fmtTime(90) => "01:30"
 * @param {number} s - จำนวนวินาที
 * @returns {string}
 */
function fmtTime(s) { return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }

/**
 * แปลงวินาทีเป็นจำนวนนาที (ปัดขึ้น, ขั้นต่ำ 1 นาที)
 * ใช้แสดง ETA แบบ "X นาที"
 * @param {number} s - จำนวนวินาที
 * @returns {number}
 */
function fmtMin(s) { return Math.max(1, Math.ceil(s / 60)); }

/**
 * คำนวณเวลาโดยประมาณ (ETA) ที่รถจะถึงจุดจอดเป้าหมาย (วินาที)
 *
 * Logic:
 * - ถ้ารถจอดอยู่ที่จุดเป้าหมายพอดี => return 0
 * - ถ้ารถกำลังจอด (isDwelling):
 *     ETA = เวลาจอดที่เหลือ + (จำนวนจุดที่ต้องผ่าน × TRAVEL_TIME)
 *           + (จำนวนจุดแวะพัก × DWELL_TIME)
 * - ถ้ารถกำลังวิ่ง:
 *     ETA = เวลาถึงจุดถัดไป + เวลาจอด + เวลาเดินทางที่เหลือ
 *
 * ใช้ modular arithmetic เพื่อรองรับเส้นทางวนรอบ (circular route)
 *
 * @param {Object} bus       - bus object ที่ต้องการคำนวณ
 * @param {number} targetIdx - index ของจุดจอดเป้าหมายใน stops[]
 * @returns {number} ETA เป็นวินาที
 */
function calcEta(bus, targetIdx) {
  const n = stops.length;
  // รถจอดอยู่ที่จุดเป้าหมายพอดี
  if (bus.currentStopIndex === targetIdx && bus.isDwelling) return 0;
  if (bus.isDwelling) {
    // นับจำนวนจุดที่ต้องผ่านไปข้างหน้า (วนรอบ)
    const away = (targetIdx - bus.currentStopIndex + n) % n;
    if (away === 0) return 0;
    return bus.dwellRemaining + away * TRAVEL_TIME + (away - 1) * DWELL_TIME;
  } else {
    // รถกำลังวิ่งอยู่ระหว่างจุด currentStopIndex -> next
    const next = (bus.currentStopIndex + 1) % n;
    if (next === targetIdx) return Math.round((1 - bus.progress) * TRAVEL_TIME);
    const away = (targetIdx - next + n) % n;
    return Math.round((1 - bus.progress) * TRAVEL_TIME) + DWELL_TIME + away * TRAVEL_TIME + Math.max(0, away - 1) * DWELL_TIME;
  }
}

// =============================================================
// SIMULATION ENGINE
// =============================================================

/**
 * คำนวณ state ของรถในรอบถัดไป (pure function - ไม่ mutate ต้นฉบับ)
 *
 * State machine มี 2 สถานะ:
 *   isDwelling = true  → รถจอดอยู่ที่จุดจอด นับถอยหลัง dwellRemaining
 *   isDwelling = false → รถกำลังวิ่ง เพิ่ม progress ตาม SIM_SPT/TRAVEL_TIME
 *
 * เมื่อ dwellRemaining หมด → เปลี่ยนเป็นวิ่ง
 * เมื่อ progress >= 1      → ถึงจุดจอดถัดไป เปลี่ยนเป็นจอด
 *                             อัปเดต passengers และ battery แบบสุ่ม
 *
 * @param {Object} bus - bus object ปัจจุบัน
 * @returns {Object} bus object ใหม่ที่อัปเดตแล้ว
 */
function tickBus(bus) {
  const b = { ...bus }; // shallow copy เพื่อไม่ mutate ต้นฉบับ
  if (b.isDwelling) {
    // ลดเวลาจอดลงตาม SIM_SPT วินาที
    b.dwellRemaining = Math.max(0, b.dwellRemaining - SIM_SPT);
    if (b.dwellRemaining <= 0) {
      // ออกจากจุดจอด เริ่มวิ่ง
      b.isDwelling = false;
      b.progress = 0;
      b.speed = 20 + Math.floor(Math.random() * 10); // ความเร็วสุ่ม 20-29 กม./ชม.
      b.status = "กำลังเดินทาง";
    }
  } else {
    // เพิ่ม progress ตามสัดส่วนเวลาที่ผ่านไป
    b.progress = Math.min(1, b.progress + SIM_SPT / TRAVEL_TIME);
    b.speed = 18 + Math.floor(Math.random() * 12); // ความเร็วสุ่ม 18-29 กม./ชม.
    if (b.progress >= 1) {
      // ถึงจุดจอดถัดไป
      b.currentStopIndex = (b.currentStopIndex + 1) % stops.length;
      b.progress = 0;
      b.isDwelling = true;
      b.dwellRemaining = DWELL_TIME;
      b.speed = 0;
      b.status = "จอดรับผู้โดยสาร";
      // จำนวนผู้โดยสารเปลี่ยนแบบสุ่ม ±2 คน (ขั้นต่ำ 0, สูงสุด 40)
      b.passengers = Math.max(0, Math.min(40, b.passengers + Math.floor(Math.random() * 6) - 2));
      // แบตเตอรี่ลดลงเล็กน้อยทุกครั้งที่ถึงจุดจอด (ขั้นต่ำ 10%)
      b.battery = Math.max(10, b.battery - Math.random() * 0.5);
    }
  }
  return b;
}

// =============================================================
// HEADER / FOOTER RENDERERS
// ฟังก์ชันเหล่านี้ inject HTML เข้า #site-header และ #site-footer
// ที่มีอยู่ในทุกหน้า ทำให้ไม่ต้องเขียน header/footer ซ้ำ
// =============================================================

/**
 * Render header (top bar + nav) เข้า element #site-header
 * และตั้ง document.title ให้ตรงกับหน้าปัจจุบัน
 *
 * @param {string} activePage  - id ของหน้าปัจจุบัน ('tracking'|'schedule'|'stops'|'report')
 * @param {string} titleSuffix - ข้อความต่อท้าย title เช่น 'ติดตามสด'
 */
function renderLayout(activePage, titleSuffix) {
  const pages = [
    { id:'tracking', href:'index.html',    label:'ติดตามสด',     icon:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
    { id:'schedule', href:'schedule.html', label:'ตารางเวลา',    icon:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    { id:'stops',    href:'stops.html',    label:'ข้อมูลจุดจอด', icon:'<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
    { id:'report',   href:'report.html',   label:'รายงานปัญหา',  icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
  ];
  document.title = 'Bus Tracker' + (titleSuffix ? ' - ' + titleSuffix : '');
  document.getElementById('site-header').innerHTML = `
    <div class="top-bar text-white">
      <div class="container-xl px-3 py-3 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-3">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <h1 class="fs-4 fw-bold mb-0">ระบบติดตามรถเมล์ไฟฟ้า</h1>
              <span class="live-badge"><span class="live-dot"></span>LIVE</span>
            </div>
            <p class="mb-0 opacity-75">ม.ราชภัฏนครปฐม · 3 คัน</p>
          </div>
        </div>
        <div class="text-end">
          <div class="text-uppercase small opacity-75" style="letter-spacing:0.1em">เวลา</div>
          <div id="clock" class="text-white">--:--</div>
        </div>
      </div>
    </div>
    <nav class="bg-white border-bottom shadow-sm">
      <div class="container-xl px-2 d-flex">
        ${pages.map(p => `
          <a href="${p.href}" class="tab-btn${activePage === p.id ? ' active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p.icon}</svg>
            <span class="tab-label">${p.label}</span>
          </a>`).join('')}
      </div>
    </nav>`;
  updateClock();
  setInterval(updateClock, 1000); // อัปเดตนาฬิกาทุก 1 วินาที
}

/**
 * อัปเดตเวลาใน #clock ให้ตรงกับเวลาปัจจุบัน (HH:MM)
 * เรียกโดย renderLayout() และ setInterval ทุก 1 วินาที
 */
function updateClock() {
  const el = document.getElementById('clock');
  if (el) { const n = new Date(); el.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()); }
}

/**
 * Render footer เข้า element #site-footer
 * แสดงข้อมูลลิขสิทธิ์และหมายเหตุการใช้งาน
 */
function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
    <div class="d-flex align-items-center justify-content-center gap-2 text-muted small">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      <span>© 2026 มหาวิทยาลัยราชภัฏนครปฐม | ระบบติดตามรถเมล์ไฟฟ้า</span>
    </div>
    <p class="mt-1 mb-0" style="font-size:0.8rem;color:rgba(107,114,128,0.7)">ข้อมูลในระบบเป็นข้อมูลเบื้องต้นสำหรับการเดินทาง · เส้นทางอาจมีการเปลี่ยนแปลงตามสภาพจราจร · 3 คันให้บริการ</p>`;
}
