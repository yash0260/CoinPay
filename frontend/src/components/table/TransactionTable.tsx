'use client';

import React from 'react';
import { Transaction } from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils';
import '@/styles/table.css';

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick: (transaction: Transaction) => void;
  onRetry: () => void;
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  const isActive = sortBy === field;
  return (
    <span className={`sort-icon ${isActive ? 'active' : ''}`}>
      <span className={`sort-arrow ${isActive && sortOrder === 'asc' ? 'active' : ''}`}>▲</span>
      <span className={`sort-arrow ${isActive && sortOrder === 'desc' ? 'active' : ''}`}>▼</span>
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="skeleton-row">
          <td><div className="skeleton-cell" style={{ width: '80%' }} /></td>
          <td><div className="skeleton-cell" style={{ width: '70%' }} /></td>
          <td><div className="skeleton-cell" style={{ width: '60%' }} /></td>
          <td><div className="skeleton-cell" style={{ width: '50%' }} /></td>
          <td><div className="skeleton-cell" style={{ width: '55%' }} /></td>
          <td><div className="skeleton-cell" style={{ width: '65%' }} /></td>
        </tr>
      ))}
    </>
  );
}

export function TransactionTable({
  transactions,
  loading,
  error,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onRetry,
}: TransactionTableProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate pagination numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="txn-table" role="table" aria-label="Transactions">
          <thead>
            <tr>
              <th className="col-date th-sortable" onClick={() => onSort('timestamp')}>
                <span className="th-content">
                  Date <SortIcon field="timestamp" sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </th>
              <th className="col-merchant">
                <span className="th-content">Merchant</span>
              </th>
              <th className="col-category">
                <span className="th-content">Category</span>
              </th>
              <th className="col-amount th-sortable" onClick={() => onSort('amount')} style={{ textAlign: 'right' }}>
                <span className="th-content" style={{ justifyContent: 'flex-end' }}>
                  Amount <SortIcon field="amount" sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </th>
              <th className="col-status">
                <span className="th-content">Status</span>
              </th>
              <th className="col-method">
                <span className="th-content">Method</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}

            {!loading && error && (
              <tr>
                <td colSpan={6}>
                  <div className="table-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-title">Failed to load transactions</div>
                    <div className="error-message">{error}</div>
                    <Button variant="secondary" size="sm" onClick={onRetry}>
                      Try Again
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && transactions.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No transactions found</div>
                    <div className="empty-description">
                      Try adjusting your filters or search terms
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && transactions.map((txn) => (
              <tr
                key={txn.id}
                onClick={() => onRowClick(txn)}
                tabIndex={0}
                role="row"
                aria-label={`Transaction ${txn.txn_id}: ${txn.merchant} ${formatCurrency(txn.amount)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(txn);
                  }
                }}
              >
                <td className="cell-date">{formatDate(txn.timestamp)}</td>
                <td>
                  <div className="cell-merchant">
                    <span className="merchant-icon">{getCategoryIcon(txn.category)}</span>
                    <span className="truncate">{txn.merchant}</span>
                  </div>
                </td>
                <td className="truncate">{txn.category}</td>
                <td className={`cell-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>
                  {formatCurrency(txn.amount)}
                </td>
                <td><StatusBadge status={txn.status} /></td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                  {txn.payment_method}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!error && total > 0 && (
        <div className="table-footer">
          <div className="table-info">
            Showing {startItem}–{endItem} of {total.toLocaleString()} transactions
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              style={{ marginLeft: 'var(--space-3)' }}
            >
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
          <nav className="pagination" aria-label="Table pagination">
            <button
              className="page-btn"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            {getPageNumbers().map((p, i) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-tertiary)' }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="page-btn"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
