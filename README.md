# 🎮 My Media Tracker (PWA)

Web Application แบบ Full-Stack สำหรับบันทึกและจัดการคอลเลกชันสื่อส่วนตัว (Games, Anime, Manga, Movies) พัฒนาด้วยสถาปัตยกรรมที่ทันสมัย รองรับการติดตั้งเป็นแอปพลิเคชันมือถือ (Progressive Web App) และมีระบบรักษาความปลอดภัยระดับมาตรฐานอุตสาหกรรม

## ✨ Key Features (ฟีเจอร์หลัก)
- **🔐 Secure Authentication (JWT & Bcrypt):** ระบบสมาชิกที่เข้ารหัสผ่านอย่างปลอดภัย และมี Data Isolation (ผู้ใช้งานแต่ละคนจะมองเห็นและจัดการได้เฉพาะข้อมูลของตัวเองเท่านั้น)
- **📱 Progressive Web App (PWA):** สามารถกดติดตั้ง (Install) ลงบนหน้าจอโฮมของมือถือหรือคอมพิวเตอร์ได้ พร้อมระบบ Service Worker สำหรับจัดการ Cache
- **⚡ Jikan API Auto-fill:** ดึงข้อมูลอนิเมะและมังงะอัตโนมัติ (เช่น รูปหน้าปก, หมวดหมู่, แท็ก, จำนวนตอน) เพียงแค่พิมพ์ชื่อเรื่อง
- **📊 Smart Dashboard & Analytics:** สรุปสถิติข้อมูลด้วยกราฟ Chart.js และคำนวณสัดส่วนรายการที่ดูจบแล้ว/ดองไว้ แบบเรียลไทม์
- **🧠 Undo / Redo Memory Stack:** ระบบจดจำการกระทำล่าสุด (ย้อนหลังได้ 30 ขั้น) สามารถกู้คืนข้อมูลที่เผลอลบ หรือย้อนกลับการแก้ไขได้อย่างสมบูรณ์แบบ
- **🗑️ Multi-Select & Batch Delete:** ระบบ Checkbox เลือกหลายรายการเพื่อทำการลบข้อมูลพร้อมกันในคลิกเดียว
- **☁️ Cloud Database & Export/Import:** จัดเก็บข้อมูลบน **MongoDB Atlas** และมีระบบ Export/Import เป็นไฟล์ JSON เพื่อสำรองข้อมูลลงเครื่อง (พร้อมระบบ Upsert กันข้อมูลซ้ำ)
- **🎨 Modern Responsive UI:** รองรับ Dark / Light Mode และออกแบบตามหลัก Mobile-First ทำให้แสดงผลบนจอมือถือได้อย่างสมบูรณ์แบบ (ลดปัญหา Flexbox Blowout)

## 🛠️ Technologies Used (เครื่องมือที่ใช้พัฒนา)
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript, Chart.js
- **Backend:** Python, Flask, Flask-Bcrypt, Flask-JWT-Extended, Flask-CORS
- **Database:** MongoDB Atlas (ผ่าน PyMongo)
- **Environment & Hosting:** python-dotenv, Render (API), GitHub Pages (Frontend)

## 🚀 How to Run (วิธีเปิดใช้งานบนเครื่อง Local)
1. **โคลนโปรเจกต์และติดตั้งไลบรารีที่จำเป็น:**
   ```bash
   pip install -r requirements.txt
   ```
2. **ตั้งค่า Environment Variables:**<br>
**สร้างไฟล์ .env ไว้ในโฟลเดอร์หลัก และกำหนดค่าเชื่อมต่อดังนี้:**
   ```bash
   MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
   JWT_SECRET_KEY="your-super-secret-key"
   ```
3. **รันเซิร์ฟเวอร์ Backend:**
   ```bash
   python app.py
   ```
**(หรือดับเบิลคลิกไฟล์ mt.bat สำหรับผู้ใช้ Windows)** <br>
## 👨‍💻 Developer
**พัฒนาโดย: Chatchai Naktae (Computer Science Student, RMUTTO)**