import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise ValueError(
            "FATAL: MONGO_URI environment variable is not set. "
            "Please configure your MongoDB connection string in .env or your hosting platform."
        )

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        raise ValueError(
            "FATAL: JWT_SECRET_KEY environment variable is not set. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(64))\""
        )

    MASTER_API_KEY = os.getenv("MASTER_API_KEY", "ChatchaiSecret123")
