'use client';

import React, { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TransactionTable } from '@/components/table/TransactionTable';
import { FilterBar } from '@/components/filters/FilterBar';
import { TransactionDetail } from '@/components/TransactionDetail';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { Spinner } from '@/components/ui/Spinner';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRewards } from '@/hooks/useRewards';
import { Transaction, TransactionFilters } from '@/lib/api';
import { formatCurrency, formatCompact } from '@/lib/utils';

export default function DashboardPage() {
  const {
    transactions,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    filters,
    filterOptions,
    setFilters,
    setPage,
    setSort,
    resetFilters,
    retry,
  } = useTransactions();

  const { balance, loading: coinsLoading } = useRewards();

  // Analytics with cross-filtering support
  const [analyticsFilters, setAnalyticsFilters] = useState<{
    category?: string;
    date_from?: string;
    date_to?: string;
  }>({});

  const { categoryData, monthlyData, loading: analyticsLoading } = useAnalytics(analyticsFilters);

  // Transaction detail drawer
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = useCallback((txn: Transaction) => {
    setSelectedTxn(txn);
    setDrawerOpen(true);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(newFilters);
    // Also update analytics filters for cross-filtering
    if (newFilters.category !== undefined) {
      setAnalyticsFilters(prev => ({ ...prev, category: newFilters.category }));
    }
    if (newFilters.date_from !== undefined || newFilters.date_to !== undefined) {
      setAnalyticsFilters(prev => ({
        ...prev,
        date_from: newFilters.date_from ?? prev.date_from,
        date_to: newFilters.date_to ?? prev.date_to,
      }));
    }
  }, [setFilters]);

  // Chart → table filtering
  const handleCategoryClick = useCallback((category: string) => {
    if (category) {
      setFilters({ category });
      setAnalyticsFilters(prev => ({ ...prev, category }));
    } else {
      setFilters({ category: undefined });
      setAnalyticsFilters(prev => ({ ...prev, category: undefined }));
    }
  }, [setFilters]);

  const handleMonthClick = useCallback((month: string) => {
    if (month) {
      const [year, m] = month.split('-');
      const startDate = `${year}-${m}-01`;
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      const endDate = `${year}-${m}-${lastDay}`;
      setFilters({ date_from: startDate, date_to: endDate });
    } else {
      setFilters({ date_from: undefined, date_to: undefined });
    }
  }, [setFilters]);

  const handleReset = useCallback(() => {
    resetFilters();
    setAnalyticsFilters({});
  }, [resetFilters]);

  const handlePageSizeChange = useCallback((size: number) => {
    setFilters({ page_size: size, page: 1 });
  }, [setFilters]);

  // Compute stats from current data
  const successCount = total; // Total from current filter
  const totalSpend = categoryData.reduce((sum, c) => sum + c.total_amount, 0);

  return (
    <AppLayout coins={balance?.coins ?? 0} coinsLoading={coinsLoading}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Spending Dashboard</h1>
        <p className="page-subtitle">
          Track your transactions, analyze spending patterns, and earn reward coins
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            📋
          </div>
          <div>
            <div className="stat-value">{total.toLocaleString()}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            💰
          </div>
          <div>
            <div className="stat-value">{formatCompact(totalSpend)}</div>
            <div className="stat-label">Total Spend</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            🪙
          </div>
          <div>
            <div className="stat-value">{balance?.coins?.toLocaleString() ?? '...'}</div>
            <div className="stat-label">Coin Balance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
            📊
          </div>
          <div>
            <div className="stat-value">{categoryData.length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Spend by Category</h3>
          </div>
          {analyticsLoading ? (
            <Spinner />
          ) : (
            <CategoryPieChart
              data={categoryData}
              onCategoryClick={handleCategoryClick}
              activeCategory={filters.category}
            />
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Spending Trend</h3>
          </div>
          {analyticsLoading ? (
            <Spinner />
          ) : (
            <MonthlyTrendChart
              data={monthlyData}
              onMonthClick={handleMonthClick}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        error={error}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        sortBy={filters.sort_by || 'timestamp'}
        sortOrder={filters.sort_order || 'desc'}
        onSort={setSort}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        onRetry={retry}
      />

      {/* Transaction Detail Drawer */}
      <TransactionDetail
        transaction={selectedTxn}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </AppLayout>
  );
}
