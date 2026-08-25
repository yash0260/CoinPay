"""
Transaction API routes — provides endpoints for fetching, filtering,
searching, sorting transactions, and retrieving spend analytics.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TransactionOut, PaginatedTransactions, CategorySpend, MonthlySpend
from app.services import transaction_service
from typing import Optional
import math

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactions)
def list_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category (comma-separated)"),
    status: Optional[str] = Query(None, description="Filter by status (comma-separated)"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    amount_min: Optional[float] = Query(None, description="Minimum amount"),
    amount_max: Optional[float] = Query(None, description="Maximum amount"),
    search: Optional[str] = Query(None, description="Search merchant name"),
    sort_by: Optional[str] = Query("timestamp", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_db),
):
    """Fetch transactions with server-side filtering, sorting, and pagination."""
    transactions, total = transaction_service.get_transactions(
        db=db,
        page=page,
        page_size=page_size,
        category=category,
        status=status,
        date_from=date_from,
        date_to=date_to,
        amount_min=amount_min,
        amount_max=amount_max,
        search=search,
        sort_by=sort_by or "timestamp",
        sort_order=sort_order or "desc",
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedTransactions(
        data=[TransactionOut.model_validate(t) for t in transactions],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/filters")
def get_filter_options(db: Session = Depends(get_db)):
    """Get available filter values (categories, statuses, date range, etc.)."""
    return transaction_service.get_filter_options(db)


@router.get("/analytics/category", response_model=list[CategorySpend])
def category_analytics(
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get spending breakdown by category."""
    return transaction_service.get_category_analytics(db, status, date_from, date_to)


@router.get("/analytics/monthly", response_model=list[MonthlySpend])
def monthly_analytics(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get monthly spending trend."""
    return transaction_service.get_monthly_analytics(db, category, status)


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a single transaction by ID."""
    txn = transaction_service.get_transaction_by_id(db, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionOut.model_validate(txn)
