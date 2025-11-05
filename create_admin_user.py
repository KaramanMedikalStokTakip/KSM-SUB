#!/usr/bin/env python3
"""
Create admin user if it doesn't exist
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin_user():
    """Create admin user if it doesn't exist"""
    
    # Check if admin user exists
    existing_admin = await db.users.find_one({"username": "admin"})
    
    if existing_admin:
        print("Admin user already exists")
        
        # Check if it has created_at field
        if "created_at" not in existing_admin:
            print("Admin user missing created_at field, updating...")
            await db.users.update_one(
                {"username": "admin"},
                {"$set": {"created_at": datetime.now(timezone.utc).isoformat()}}
            )
            print("Admin user updated with created_at field")
        
        return True
    
    # Create admin user
    admin_user = {
        "id": "admin-user-id",
        "username": "admin",
        "password": hash_password("admin123"),
        "email": None,
        "role": "yönetici",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.users.insert_one(admin_user)
        print("Admin user created successfully")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Role: yönetici")
        return True
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return False

async def main():
    try:
        success = await create_admin_user()
        if success:
            print("Admin user setup completed")
        else:
            print("Failed to setup admin user")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())