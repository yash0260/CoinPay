import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/coinpay")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Rewards configuration
COINS_PER_100_RUPEES = 1
MAX_COINS_PER_TRANSACTION = 50  # Cap at 50 coins per transaction (₹5,000 spend)
