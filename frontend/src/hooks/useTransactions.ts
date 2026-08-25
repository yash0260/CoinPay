'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { 
  Transaction, 
  PaginatedTransactions, 
  TransactionFilters, 
  FilterOptions 
} from '@/lib/api';

export interface UseTransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  filterOptions: FilterOptions | null;
}

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    loading: true,
    error: null,
    filters: { page: 1, page_size: 20, sort_by: 'timestamp', sort_order: 'desc', ...initialFilters },
    filterOptions: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTransactions = useCallback(async (filters: TransactionFilters) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await api.getTransactions(filters);
      setState(prev => ({
        ...prev,
        transactions: data.data,
        total: data.total,
        page: data.page,
        pageSize: data.page_size,
        totalPages: data.total_pages,
        loading: false,
        filters,
      }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch transactions',
      }));
    }
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const options = await api.getFilterOptions();
        setState(prev => ({ ...prev, filterOptions: options }));
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions(state.filters);
  }, [state.filters, fetchTransactions]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
        // Reset to page 1 when filters change (unless page is explicitly set)
        page: newFilters.page || 1,
      },
    }));
  }, []);

  // Set page
  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, page },
    }));
  }, []);

  // Set sort
  const setSort = useCallback((sortBy: string) => {
    setState(prev => {
      const currentSort = prev.filters.sort_by;
      const currentOrder = prev.filters.sort_order;
      const newOrder = currentSort === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        filters: { ...prev.filters, sort_by: sortBy, sort_order: newOrder, page: 1 },
      };
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: { page: 1, page_size: prev.filters.page_size, sort_by: 'timestamp', sort_order: 'desc' },
    }));
  }, []);

  // Retry on error
  const retry = useCallback(() => {
    fetchTransactions(state.filters);
  }, [fetchTransactions, state.filters]);

  return {
    ...state,
    setFilters,
    setPage,
    setSort,
    resetFilters,
    retry,
  };
}
