from sqlalchemy import Column, Integer, String, Numeric, Boolean, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Transaction(Base):
    """Stores all credit card transactions. Uses auto-increment PK since
    the source data contains ~40 duplicate txn_ids."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    txn_id = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    merchant = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="Uncategorized", index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(10), nullable=False, index=True)
    payment_method = Column(String(20), nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('SUCCESS', 'FAILED', 'PENDING')", name="check_status"),
    )


class UserBalance(Base):
    """Tracks the coin balance for a user. Single-user app uses USER001."""
    __tablename__ = "user_balance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), nullable=False, unique=True, default="USER001")
    coins = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False)


class RewardsCatalogue(Base):
    """Available rewards that users can redeem coins for."""
    __tablename__ = "rewards_catalogue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    coins_required = Column(Integer, nullable=False)
    image_url = Column(String(255))
    category = Column(String(50))
    is_active = Column(Boolean, default=True)

    redemptions = relationship("RedemptionHistory", back_populates="reward")


class RedemptionHistory(Base):
    """Log of all reward redemptions."""
    __tablename__ = "redemption_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(20), nullable=False, default="USER001")
    reward_id = Column(Integer, ForeignKey("rewards_catalogue.id"), nullable=False)
    coins_spent = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), nullable=False)

    reward = relationship("RewardsCatalogue", back_populates="redemptions")
