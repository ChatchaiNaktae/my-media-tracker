from pymongo import MongoClient
import certifi
from config import Config

# Connect to MongoDB Atlas
client = MongoClient(Config.MONGO_URI, tlsCAFile=certifi.where())
db = client['MediaTracker']
collection = db['media_list']
users_coll = db['users']

# Function to run initial data migration
def init_db():
    if collection.count_documents({}) == 0:
        backup_coll = db['backups']
        if backup_coll.count_documents({}) > 0:
            collection.insert_many(list(backup_coll.find({}, {'_id': 0})))
            print("Migrated data from backup successfully!")