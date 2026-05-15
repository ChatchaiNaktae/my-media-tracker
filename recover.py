import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

# 1. โหลดข้อมูลการเชื่อมต่อจากไฟล์ .env
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# 2. เชื่อมต่อเข้าสู่ MongoDB
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['MediaTracker']
collection = db['media_list']

# 3. 🌟 ระบุชื่อไอดีที่ต้องการให้เป็นเจ้าของข้อมูลเก่า (จากรูปของคุณคือ DevDroggy)
target_username = "DevDroggy"

# 4. สั่งค้นหาข้อมูลที่ "ไม่มีช่อง username" และทำการ "$set" ค่า username เข้าไปใหม่
result = collection.update_many(
    {"username": {"$exists": False}},
    {"$set": {"username": target_username}}
)

print(f"🎉 กู้คืนข้อมูลสำเร็จ! แปะป้ายชื่อให้ไอดี '{target_username}' ไปทั้งหมด {result.modified_count} รายการ")