# 🎮 My Media Tracker

Web Application สำหรับบันทึกและจัดการคอลเลกชันสื่อส่วนตัว (Games, Anime, Manga, Movies) พัฒนาด้วย Python (Flask) และ Vanilla JavaScript พร้อม UI ที่ทันสมัย

## ✨ Features (จุดเด่นของระบบ)
- **Smart Dashboard:** สรุปสถิติรายการทั้งหมด, รายการที่จบแล้ว และรายการที่ดองไว้
- **Multi-Select & Batch Delete:** ระบบเลือกหลายรายการเพื่อลบข้อมูลพร้อมกันในคลิกเดียว
- **Undo / Redo System:** ระบบ Memory Stack จดจำการกระทำล่าสุด สามารถย้อนกลับการลบหรือแก้ไขได้
- **Cloud Backup & Restore:** เชื่อมต่อกับฐานข้อมูล **MongoDB Atlas** เพื่อสำรองข้อมูลขึ้นคลาวด์และดึงข้อมูลกลับมาที่เครื่องได้ตลอดเวลา
- **Dark / Light Mode:** ระบบปรับสียามค่ำคืนอัตโนมัติตามความต้องการของผู้ใช้
- **Smart Search & Filter:** ค้นหาด้วยชื่อเรื่อง, ตัวย่อ หรือ Tag หมวดหมู่ย่อยได้อย่างรวดเร็ว

## 🛠️ Technologies Used (เครื่องมือที่ใช้พัฒนา)
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend:** Python, Flask, Flask-CORS
- **Database:** SQLite (Local) & MongoDB Atlas (Cloud)
- **Environment:** python-dotenv (สำหรับการซ่อน Credentials)

## 🚀 How to Run (วิธีเปิดใช้งาน)
1. ติดตั้ง Python และไลบรารีที่จำเป็น:
   ```bash
   pip install flask flask-cors pymongo certifi python-dotenv
   ```
2. **สร้างไฟล์ .env และใส่ลิงก์ MongoDB URI ของคุณ**
3. **รันไฟล์ mt.bat (สำหรับ Windows) เพื่อเริ่มทำงานเซิร์ฟเวอร์และเปิดหน้าเว็บอัตโนมัติ**