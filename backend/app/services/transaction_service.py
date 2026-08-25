"""
Transaction service — handles querying, filtering, sorting, pagination,
and analytics aggregation for the transactions table.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, desc, asc
from app.models import Transaction
from typing import Optional
from datetime import datetime
from decimal import Decimal


def get_transactions(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    category: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
):
    """
    Fetch transactions with server-side filtering, sorting, and pagination.
    Returns (list_of_transactions, total_count).
    """
    query = db.query(Transaction)

    # ── Apply filters ──
    if category:
        # Support comma-separated multi-category
        categories = [c.strip() for c in category.split(",")]
        query = query.filter(Transaction.category.in_(categories))

    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.filter(Transaction.status.in_(statuses))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(Transaction.timestamp >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(Transaction.timestamp <= dt_to)
        except ValueError:
            pass

    if amount_min is not None:
        query = query.filter(Transaction.amount >= Decimal(str(amount_min)))

    if amount_max is not None:
        query = query.filter(Transaction.amount <= Decimal(str(amount_max)))

    if search:
        query = query.filter(Transaction.merchant.ilike(f"%{search}%"))

    # ── Get total before pagination ──
    total = query.count()

    # ── Sorting ──
    sort_column_map = {
        "timestamp": Transaction.timestamp,
        "amount": Transaction.amount,
        "merchant": Transaction.merchant,
        "category": Transaction.category,
        "status": Transaction.status,
    }
    sort_col = sort_column_map.get(sort_by, Transaction.timestamp)
    order_func = desc if sort_order == "desc" else asc
    query = query.order_by(order_func(sort_col), Transaction.id)

    # ── Pagination ──
    offset = (page - 1) * page_size
    transactions = query.offset(offset).limit(page_size).all()

    return transactions, total


def get_transaction_by_id(db: Session, transaction_id: int):
    """Fetch a single transaction by its auto-increment ID."""
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()


def get_category_analytics(
    db: Session,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    """
    Aggregate spending by category. Only counts positive-amount SUCCESS
    transactions by default (unless a different status filter is applied).
    """
    query = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count"),
    )

    # Default to SUCCESS only for meaningful spend analytics
    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.filter(Transaction.status.in_(statuses))
    else:
        query = query.filter(Transaction.status == "SUCCESS")

    # Only positive amounts (exclude refunds for category breakdown)
    query = query.filter(Transaction.amount > 0)

    if date_from:
        try:
            query = query.filter(Transaction.timestamp >= datetime.fromisoformat(date_from))
        except ValueError:
            pass

    if date_to:
        try:
            query = query.filter(Transaction.timestamp <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    results = query.group_by(Transaction.category).order_by(desc("total_amount")).all()

    # Calculate total for percentage
    total_spend = sum(float(r.total_amount) for r in results)

    return [
        {
            "category": r.category,
            "total_amount": round(float(r.total_amount), 2),
            "transaction_count": r.transaction_count,
            "percentage": round((float(r.total_amount) / total_spend * 100), 1) if total_spend > 0 else 0,
        }
        for r in results
    ]


def get_monthly_analytics(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
):
    """Aggregate spending by month (YYYY-MM). Only SUCCESS + positive amounts."""
    # Use database-level date truncation for proper month grouping
    month_label = func.to_char(Transaction.timestamp, 'YYYY-MM')

    query = db.query(
        month_label.label("month"),
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count"),
    )

    if status:
        statuses = [s.strip() for s in status.split(",")]
        query = query.filter(Transaction.status.in_(statuses))
    else:
        query = query.filter(Transaction.status == "SUCCESS")

    query = query.filter(Transaction.amount > 0)

    if category:
        categories = [c.strip() for c in category.split(",")]
        query = query.filter(Transaction.category.in_(categories))

    results = (
        query.group_by("month")
        .order_by("month")
        .all()
    )

    return [
        {
            "month": r.month,
            "total_amount": round(float(r.total_amount), 2),
            "transaction_count": r.transaction_count,
        }
        for r in results
    ]


def get_filter_options(db: Session):
    """Return distinct values for filter dropdowns."""
    categories = [
        r[0] for r in db.query(Transaction.category).distinct().order_by(Transaction.category).all()
    ]
    statuses = [
        r[0] for r in db.query(Transaction.status).distinct().order_by(Transaction.status).all()
    ]
    payment_methods = [
        r[0] for r in db.query(Transaction.payment_method).distinct().order_by(Transaction.payment_method).all()
    ]
    merchants = [
        r[0] for r in db.query(Transaction.merchant).distinct().order_by(Transaction.merchant).all()
    ]

    # Date range
    date_range = db.query(
        func.min(Transaction.timestamp),
        func.max(Transaction.timestamp),
    ).first()

    return {
        "categories": categories,
        "statuses": statuses,
        "payment_methods": payment_methods,
        "merchants": merchants,
        "date_range": {
            "min": date_range[0].isoformat() if date_range[0] else None,
            "max": date_range[1].isoformat() if date_range[1] else None,
        },
    }
