'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { CategorySpend, MonthlySpend } from '@/lib/api';

interface UseAnalyticsState {
  categoryData: CategorySpend[];
  monthlyData: MonthlySpend[];
  loading: boolean;
  error: string | null;
}

export function useAnalytics(filters?: { category?: string; date_from?: string; date_to?: string }) {
  const [state, setState] = useState<UseAnalyticsState>({
    categoryData: [],
    monthlyData: [],
    loading: true,
    error: null,
  });

  const fetchAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [categoryData, monthlyData] = await Promise.all([
        api.getCategoryAnalytics({
          date_from: filters?.date_from,
          date_to: filters?.date_to,
        }),
        api.getMonthlyAnalytics({
          category: filters?.category,
        }),
      ]);
      setState({ categoryData, monthlyData, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch analytics',
      }));
    }
  }, [filters?.category, filters?.date_from, filters?.date_to]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { ...state, refetch: fetchAnalytics };
}
