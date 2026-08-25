from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ──── Transaction Schemas ────

class TransactionOut(BaseModel):
    """Single transaction in API responses."""
    id: int
    txn_id: str
    timestamp: datetime
    merchant: str
    category: str
    amount: float
    currency: str
    status: str
    payment_method: str

    class Config:
        from_attributes = True


class PaginatedTransactions(BaseModel):
    """Paginated transaction list response."""
    data: List[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class TransactionFilters(BaseModel):
    """Query parameters for filtering transactions."""
    category: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    search: Optional[str] = None
    sort_by: Optional[str] = Field(default="timestamp", pattern="^(timestamp|amount|merchant|category|status)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# ──── Analytics Schemas ────

class CategorySpend(BaseModel):
    """Spending breakdown by category."""
    category: str
    total_amount: float
    transaction_count: int
    percentage: float


class MonthlySpend(BaseModel):
    """Monthly spending trend."""
    month: str  # YYYY-MM
    total_amount: float
    transaction_count: int


class AnalyticsResponse(BaseModel):
    """Combined analytics data."""
    by_category: List[CategorySpend]
    by_month: List[MonthlySpend]
    total_spend: float
    total_transactions: int


# ──── Rewards Schemas ────

class CoinBalanceOut(BaseModel):
    """User's current coin balance."""
    user_id: str
    coins: int
    updated_at: datetime


class RewardOut(BaseModel):
    """Reward item from the catalogue."""
    id: int
    name: str
    description: Optional[str]
    coins_required: int
    image_url: Optional[str]
    category: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class RedeemRequest(BaseModel):
    """Request to redeem a reward."""
    reward_id: int


class RedeemResponse(BaseModel):
    """Response after a successful redemption."""
    success: bool
    message: str
    coins_spent: int
    remaining_balance: int
    reward_name: str


class RedemptionHistoryOut(BaseModel):
    """Past redemption record."""
    id: int
    reward_name: str
    coins_spent: int
    redeemed_at: datetime


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: Optional[str] = None
