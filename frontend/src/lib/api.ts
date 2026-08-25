/**
 * CoinPay API Client
 * Centralized HTTP client for all backend API calls.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * Generic fetch wrapper with error handling and query parameter support.
 */
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  // Append query params
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.detail?.message || errorData?.detail || `API Error: ${response.status}`;
    const error = new Error(message) as Error & { status: number; errorCode: string };
    error.status = response.status;
    error.errorCode = errorData?.detail?.error_code || 'UNKNOWN';
    throw error;
  }

  return response.json();
}


// ──── Transaction Types ────

export interface Transaction {
  id: number;
  txn_id: string;
  timestamp: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  payment_method: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  category?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface FilterOptions {
  categories: string[];
  statuses: string[];
  payment_methods: string[];
  merchants: string[];
  date_range: {
    min: string | null;
    max: string | null;
  };
}

// ──── Analytics Types ────

export interface CategorySpend {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface MonthlySpend {
  month: string;
  total_amount: number;
  transaction_count: number;
}

// ──── Rewards Types ────

export interface CoinBalance {
  user_id: string;
  coins: number;
  updated_at: string;
}

export interface Reward {
  id: number;
  name: string;
  description: string | null;
  coins_required: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
}

export interface RedeemResponse {
  success: boolean;
  message: string;
  coins_spent: number;
  remaining_balance: number;
  reward_name: string;
}

export interface RedemptionHistory {
  id: number;
  reward_name: string;
  coins_spent: number;
  redeemed_at: string;
}


// ──── API Functions ────

export const api = {
  // Transactions
  getTransactions: (filters: TransactionFilters = {}) =>
    apiFetch<PaginatedTransactions>('/api/transactions', {
      params: filters as Record<string, string | number | undefined>,
    }),

  getTransaction: (id: number) =>
    apiFetch<Transaction>(`/api/transactions/${id}`),

  getFilterOptions: () =>
    apiFetch<FilterOptions>('/api/transactions/filters'),

  // Analytics
  getCategoryAnalytics: (params?: { status?: string; date_from?: string; date_to?: string }) =>
    apiFetch<CategorySpend[]>('/api/transactions/analytics/category', { params }),

  getMonthlyAnalytics: (params?: { category?: string; status?: string }) =>
    apiFetch<MonthlySpend[]>('/api/transactions/analytics/monthly', { params }),

  // Rewards
  getCoinBalance: () =>
    apiFetch<CoinBalance>('/api/rewards/balance'),

  getRewardsCatalogue: () =>
    apiFetch<Reward[]>('/api/rewards/catalogue'),

  redeemReward: (rewardId: number) =>
    apiFetch<RedeemResponse>('/api/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ reward_id: rewardId }),
    }),

  getRedemptionHistory: () =>
    apiFetch<RedemptionHistory[]>('/api/rewards/history'),

  healthCheck: () =>
    apiFetch<{ status: string }>('/api/health'),
};

export default api;
