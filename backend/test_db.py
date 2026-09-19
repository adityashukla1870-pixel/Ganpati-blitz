import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient

uri = os.getenv("MONGO_URI")
print(f"URI: {uri[:50]}...")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    print("MongoDB Atlas connection SUCCESS!")
    db = client.ganpati_blitz
    print(f"Database: {db.name}")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Connection FAILED: {e}")
