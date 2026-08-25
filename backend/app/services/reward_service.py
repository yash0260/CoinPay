"""
Reward service — handles coin balance calculation, redemption logic,
and catalogue management. Uses DB transactions for atomic balance updates.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import UserBalance, RewardsCatalogue, RedemptionHistory, Transaction
from app.config import COINS_PER_100_RUPEES, MAX_COINS_PER_TRANSACTION
from datetime import datetime, timezone
from decimal import Decimal
import math


def calculate_total_coins_earned(db: Session) -> int:
    """
    Calculate total coins earned from all SUCCESS transactions with positive amounts.
    Rule: 1 coin per ₹100 spent, capped at MAX_COINS_PER_TRANSACTION per transaction.
    """
    # Get all successful positive-amount transactions
    transactions = (
        db.query(Transaction.amount)
        .filter(Transaction.status == "SUCCESS")
        .filter(Transaction.amount > 0)
        .all()
    )

    total_coins = 0
    for (amount,) in transactions:
        # Floor division: coins = floor(amount / 100), capped
        coins_for_txn = min(
            int(float(amount) // 100) * COINS_PER_100_RUPEES,
            MAX_COINS_PER_TRANSACTION
        )
        total_coins += coins_for_txn

    return total_coins


def get_total_coins_redeemed(db: Session, user_id: str = "USER001") -> int:
    """Get total coins spent on redemptions."""
    result = (
        db.query(func.coalesce(func.sum(RedemptionHistory.coins_spent), 0))
        .filter(RedemptionHistory.user_id == user_id)
        .scalar()
    )
    return int(result)


def get_coin_balance(db: Session, user_id: str = "USER001") -> dict:
    """Get current coin balance for a user."""
    balance_row = (
        db.query(UserBalance)
        .filter(UserBalance.user_id == user_id)
        .first()
    )

    if not balance_row:
        # Calculate and create if not exists
        earned = calculate_total_coins_earned(db)
        redeemed = get_total_coins_redeemed(db, user_id)
        balance_row = UserBalance(
            user_id=user_id,
            coins=earned - redeemed,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(balance_row)
        db.commit()
        db.refresh(balance_row)

    return {
        "user_id": balance_row.user_id,
        "coins": balance_row.coins,
        "updated_at": balance_row.updated_at,
    }


def get_rewards_catalogue(db: Session) -> list:
    """Get all active rewards."""
    return (
        db.query(RewardsCatalogue)
        .filter(RewardsCatalogue.is_active == True)
        .order_by(RewardsCatalogue.coins_required)
        .all()
    )


def redeem_reward(db: Session, reward_id: int, user_id: str = "USER001") -> dict:
    """
    Redeem a reward. Uses pessimistic locking to prevent race conditions.
    Returns success dict or raises ValueError with descriptive message.
    """
    # 1. Check reward exists and is active
    reward = (
        db.query(RewardsCatalogue)
        .filter(RewardsCatalogue.id == reward_id)
        .filter(RewardsCatalogue.is_active == True)
        .first()
    )
    if not reward:
        raise ValueError("REWARD_NOT_FOUND", "Reward not found or no longer available.")

    # 2. Get current balance with row-level lock
    balance_row = (
        db.query(UserBalance)
        .filter(UserBalance.user_id == user_id)
        .with_for_update()  # Pessimistic lock
        .first()
    )
    if not balance_row:
        raise ValueError("USER_NOT_FOUND", "User balance not found.")

    # 3. Check sufficient coins
    if balance_row.coins < reward.coins_required:
        raise ValueError(
            "INSUFFICIENT_BALANCE",
            f"Insufficient coins. Required: {reward.coins_required}, Available: {balance_row.coins}",
        )

    # 4. Deduct coins and record redemption (atomic within DB transaction)
    balance_row.coins -= reward.coins_required
    balance_row.updated_at = datetime.now(timezone.utc)

    redemption = RedemptionHistory(
        user_id=user_id,
        reward_id=reward.id,
        coins_spent=reward.coins_required,
        redeemed_at=datetime.now(timezone.utc),
    )
    db.add(redemption)

    try:
        db.commit()
        db.refresh(balance_row)
    except Exception:
        db.rollback()
        raise ValueError("REDEEM_FAILED", "Redemption failed. Please try again.")

    return {
        "success": True,
        "message": f"Successfully redeemed {reward.name}!",
        "coins_spent": reward.coins_required,
        "remaining_balance": balance_row.coins,
        "reward_name": reward.name,
    }


def get_redemption_history(db: Session, user_id: str = "USER001") -> list:
    """Get past redemptions for a user."""
    results = (
        db.query(RedemptionHistory, RewardsCatalogue.name)
        .join(RewardsCatalogue)
        .filter(RedemptionHistory.user_id == user_id)
        .order_by(RedemptionHistory.redeemed_at.desc())
        .all()
    )

    return [
        {
            "id": r.RedemptionHistory.id,
            "reward_name": r.name,
            "coins_spent": r.RedemptionHistory.coins_spent,
            "redeemed_at": r.RedemptionHistory.redeemed_at,
        }
        for r in results
    ]
