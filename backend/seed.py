"""
Seed script — Creates database schema and loads transactions.json into PostgreSQL.
Handles all data quality quirks found in the dataset:

1. Three timestamp formats (ISO datetime, epoch milliseconds, date-only)
2. Timezone offsets in some ISO strings
3. Null/missing category fields → 'Uncategorized'
4. Negative amounts (refunds) — kept as-is
5. String-typed amounts → cast to Decimal
6. Duplicate transaction IDs — allowed (auto-increment PK)
7. Outlier amounts — loaded as-is, handled in coin calculation

Usage:
    python seed.py
    # or with custom DB URL:
    DATABASE_URL=postgresql://user:pass@host:5432/dbname python seed.py
"""
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

# Add parent dir so we can import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import Transaction, UserBalance, RewardsCatalogue, RedemptionHistory
from app.config import COINS_PER_100_RUPEES, MAX_COINS_PER_TRANSACTION


def parse_timestamp(raw_ts) -> datetime:
    """
    Normalize any of the 3 timestamp formats to a timezone-aware datetime.
    
    Formats found in dataset:
    - ISO with Z:        "2025-10-03T21:03:27Z"
    - ISO with offset:   "2026-03-25T06:08:03+05:30"
    - Epoch milliseconds: 1768265109000
    - Date-only:         "2025-07-03"
    """
    if isinstance(raw_ts, (int, float)):
        # Epoch milliseconds → UTC datetime
        return datetime.fromtimestamp(raw_ts / 1000, tz=timezone.utc)

    if isinstance(raw_ts, str):
        ts = raw_ts.strip()

        # Date-only format: "YYYY-MM-DD"
        if len(ts) == 10 and ts[4] == '-' and ts[7] == '-':
            try:
                dt = datetime.strptime(ts, "%Y-%m-%d")
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass

        # Try ISO format with various timezone styles
        # Replace 'Z' with '+00:00' for fromisoformat compatibility
        ts_normalized = ts.replace('Z', '+00:00')
        try:
            return datetime.fromisoformat(ts_normalized)
        except ValueError:
            pass

        # Fallback: try dateutil if simple parsing fails
        try:
            from dateutil import parser as dateutil_parser
            return dateutil_parser.parse(ts, dayfirst=True).replace(tzinfo=timezone.utc)
        except (ImportError, ValueError):
            pass

    # Last resort: return current time (should never reach here with clean data)
    print(f"  ⚠ Could not parse timestamp: {raw_ts!r}, using current time")
    return datetime.now(timezone.utc)


def parse_amount(raw_amount) -> Decimal:
    """
    Handle amount values that may be numbers or strings.
    Dataset has ~20 string-typed amounts like "5065.00".
    """
    try:
        return Decimal(str(raw_amount))
    except (InvalidOperation, ValueError):
        print(f"  ⚠ Could not parse amount: {raw_amount!r}, using 0")
        return Decimal("0.00")


def parse_category(raw_cat) -> str:
    """Handle null, missing, or empty category fields."""
    if not raw_cat or str(raw_cat).strip() == "":
        return "Uncategorized"
    return str(raw_cat).strip()


def calculate_initial_balance(transactions_data: list) -> int:
    """
    Calculate total coins earned from the transaction dataset.
    Rule: 1 coin per ₹100 spent, max 50 coins per transaction.
    Only SUCCESS transactions with positive amounts earn coins.
    """
    total_coins = 0
    for txn in transactions_data:
        status = txn.get("status", "")
        amount = parse_amount(txn.get("amount", 0))
        
        if status == "SUCCESS" and amount > 0:
            coins = min(
                int(amount // 100) * COINS_PER_100_RUPEES,
                MAX_COINS_PER_TRANSACTION
            )
            total_coins += coins
    
    return total_coins


def seed_rewards_catalogue(session):
    """Insert the 5 default reward items."""
    rewards = [
        RewardsCatalogue(
            name="₹100 Amazon Voucher",
            description="Get ₹100 off your next Amazon.in purchase. Valid for 30 days.",
            coins_required=50,
            image_url="/rewards/amazon.png",
            category="Vouchers",
            is_active=True,
        ),
        RewardsCatalogue(
            name="₹250 Swiggy Voucher",
            description="Food delivery credit worth ₹250 on Swiggy. Valid for 15 days.",
            coins_required=120,
            image_url="/rewards/swiggy.png",
            category="Vouchers",
            is_active=True,
        ),
        RewardsCatalogue(
            name="₹500 Flipkart Voucher",
            description="Shopping credit worth ₹500 on Flipkart. Valid for 30 days.",
            coins_required=240,
            image_url="/rewards/flipkart.png",
            category="Vouchers",
            is_active=True,
        ),
        RewardsCatalogue(
            name="1% Cashback Coupon",
            description="Get 1% cashback on your next credit card bill payment, up to ₹200.",
            coins_required=100,
            image_url="/rewards/cashback.png",
            category="Cashback",
            is_active=True,
        ),
        RewardsCatalogue(
            name="Premium Lounge Pass",
            description="Complimentary access to airport lounges across India. Single use.",
            coins_required=500,
            image_url="/rewards/lounge.png",
            category="Experiences",
            is_active=True,
        ),
    ]
    session.add_all(rewards)
    session.commit()
    print(f"  ✓ Seeded {len(rewards)} rewards in catalogue")


def seed():
    """Main seed function — creates schema and loads data."""
    print("=" * 60)
    print("CoinPay Database Seed Script")
    print("=" * 60)

    # ── Find transactions.json ──
    script_dir = Path(__file__).parent
    json_paths = [
        script_dir / "transactions.json",
        script_dir.parent / "transactions.json",
        Path("transactions.json"),
    ]
    
    json_path = None
    for p in json_paths:
        if p.exists():
            json_path = p
            break
    
    if not json_path:
        print("✗ transactions.json not found! Place it in the backend/ directory.")
        sys.exit(1)
    
    print(f"\n📂 Loading data from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    print(f"  Found {len(raw_data)} transactions")

    # ── Drop and recreate all tables ──
    print("\n🗄️  Setting up database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("  ✓ Tables created: transactions, user_balance, rewards_catalogue, redemption_history")

    session = SessionLocal()

    try:
        # ── Seed transactions ──
        print("\n📊 Seeding transactions...")
        batch_size = 500
        error_count = 0
        
        for i in range(0, len(raw_data), batch_size):
            batch = raw_data[i:i + batch_size]
            tx_objects = []
            
            for txn in batch:
                try:
                    tx_objects.append(Transaction(
                        txn_id=txn.get("id", f"UNKNOWN_{i}"),
                        timestamp=parse_timestamp(txn.get("timestamp")),
                        merchant=txn.get("merchant", "Unknown"),
                        category=parse_category(txn.get("category")),
                        amount=parse_amount(txn.get("amount", 0)),
                        currency=txn.get("currency", "INR"),
                        status=str(txn.get("status", "PENDING")).upper(),
                        payment_method=txn.get("payment_method", "Unknown"),
                    ))
                except Exception as e:
                    error_count += 1
                    if error_count <= 5:
                        print(f"  ⚠ Error on record {txn.get('id', '?')}: {e}")
            
            session.add_all(tx_objects)
            session.commit()
            
            progress = min(i + batch_size, len(raw_data))
            print(f"  ✓ {progress}/{len(raw_data)} transactions loaded", end="\r")

        print(f"\n  ✓ All {len(raw_data)} transactions seeded ({error_count} errors)")

        # ── Seed rewards catalogue ──
        print("\n🎁 Seeding rewards catalogue...")
        seed_rewards_catalogue(session)

        # ── Calculate and seed initial coin balance ──
        print("\n💰 Calculating initial coin balance...")
        total_coins = calculate_initial_balance(raw_data)
        print(f"  Total coins earned: {total_coins}")

        balance = UserBalance(
            user_id="USER001",
            coins=total_coins,
            updated_at=datetime.now(timezone.utc),
        )
        session.add(balance)
        session.commit()
        print(f"  ✓ User balance set to {total_coins} coins")

        # ── Print summary ──
        print("\n" + "=" * 60)
        print("✅ Seed completed successfully!")
        print("=" * 60)
        
        # Stats
        txn_count = session.query(Transaction).count()
        success_count = session.query(Transaction).filter(Transaction.status == "SUCCESS").count()
        failed_count = session.query(Transaction).filter(Transaction.status == "FAILED").count()
        pending_count = session.query(Transaction).filter(Transaction.status == "PENDING").count()
        
        print(f"\n  Transactions:  {txn_count}")
        print(f"    SUCCESS:     {success_count}")
        print(f"    FAILED:      {failed_count}")
        print(f"    PENDING:     {pending_count}")
        print(f"  Rewards:       {session.query(RewardsCatalogue).count()}")
        print(f"  Coin Balance:  {total_coins}")
        print()

    except Exception as e:
        session.rollback()
        print(f"\n✗ Seed failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    seed()
