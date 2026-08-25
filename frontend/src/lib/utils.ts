/**
 * Utility functions for formatting currencies, dates, and other display values.
 */

/**
 * Format a number as Indian Rupees.
 */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format a number in compact form (e.g., 1.2K, 3.4L).
 */
export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  }
  if (Math.abs(amount) >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

/**
 * Format an ISO timestamp to a readable date string.
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO timestamp to full date and time.
 */
export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a month string (YYYY-MM) to a display name.
 */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

/**
 * Get the CSS class for a transaction status.
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'status-success';
    case 'FAILED': return 'status-failed';
    case 'PENDING': return 'status-pending';
    default: return '';
  }
}

/**
 * Get the category color CSS variable.
 */
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Travel': 'var(--cat-travel)',
    'Shopping': 'var(--cat-shopping)',
    'Utilities': 'var(--cat-utilities)',
    'Food & Dining': 'var(--cat-food-dining)',
    'Health': 'var(--cat-health)',
    'Education': 'var(--cat-education)',
    'Entertainment': 'var(--cat-entertainment)',
    'Groceries': 'var(--cat-groceries)',
    'Fuel': 'var(--cat-fuel)',
    'Insurance': 'var(--cat-insurance)',
    'Uncategorized': 'var(--cat-uncategorized)',
  };
  return colorMap[category] || 'var(--cat-uncategorized)';
}

/**
 * Get the hex color for a category (for chart libraries).
 */
export function getCategoryHex(category: string): string {
  const colorMap: Record<string, string> = {
    'Travel': '#6366f1',
    'Shopping': '#8b5cf6',
    'Utilities': '#06b6d4',
    'Food & Dining': '#f59e0b',
    'Health': '#10b981',
    'Education': '#3b82f6',
    'Entertainment': '#ec4899',
    'Groceries': '#14b8a6',
    'Fuel': '#f97316',
    'Insurance': '#ef4444',
    'Uncategorized': '#64748b',
  };
  return colorMap[category] || '#64748b';
}

/**
 * Debounce function for search inputs.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Get category icon emoji.
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Travel': '✈️',
    'Shopping': '🛍️',
    'Utilities': '💡',
    'Food & Dining': '🍽️',
    'Health': '🏥',
    'Education': '📚',
    'Entertainment': '🎬',
    'Groceries': '🛒',
    'Fuel': '⛽',
    'Insurance': '🛡️',
    'Uncategorized': '📦',
  };
  return iconMap[category] || '📦';
}

/**
 * Get payment method icon.
 */
export function getPaymentMethodIcon(method: string): string {
  const iconMap: Record<string, string> = {
    'Credit Card': '💳',
    'Debit Card': '💳',
    'UPI': '📱',
    'Netbanking': '🏦',
  };
  return iconMap[method] || '💰';
}
