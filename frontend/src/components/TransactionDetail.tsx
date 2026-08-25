'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, getCategoryIcon, getPaymentMethodIcon } from '@/lib/utils';

interface TransactionDetailProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-in drawer showing full transaction details.
 * Hand-built with focus trap, Escape to close, click outside to close.
 */
export function TransactionDetail({ transaction, isOpen, onClose }: TransactionDetailProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && drawerRef.current) {
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        const closeBtn = drawerRef.current?.querySelector<HTMLElement>('.modal-close');
        closeBtn?.focus();
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !transaction) return null;

  const coinsEarned = transaction.status === 'SUCCESS' && transaction.amount > 0
    ? Math.min(Math.floor(transaction.amount / 100), 50)
    : 0;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Transaction details for ${transaction.merchant}`}
        tabIndex={-1}
      >
        <div className="drawer-header">
          <h2 className="modal-title">Transaction Details</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close drawer"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {/* Merchant Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            paddingBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}>
              {getCategoryIcon(transaction.category)}
            </div>
            <div>
              <div style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-semibold)',
                marginBottom: 'var(--space-1)',
              }}>
                {transaction.merchant}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                {transaction.txn_id}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-5)',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              fontSize: 'var(--text-4xl)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-mono)',
              color: transaction.amount < 0 ? 'var(--color-danger)' : 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              {formatCurrency(transaction.amount)}
            </div>
            <StatusBadge status={transaction.status} />
          </div>

          {/* Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <DetailRow label="Date & Time" value={formatDateTime(transaction.timestamp)} />
            <DetailRow label="Category" value={`${getCategoryIcon(transaction.category)} ${transaction.category}`} />
            <DetailRow label="Payment Method" value={`${getPaymentMethodIcon(transaction.payment_method)} ${transaction.payment_method}`} />
            <DetailRow label="Currency" value={transaction.currency} />
            <DetailRow label="Transaction ID" value={transaction.txn_id} mono />
            {coinsEarned > 0 && (
              <DetailRow label="Coins Earned" value={`🪙 ${coinsEarned} coins`} highlight />
            )}
            {transaction.amount < 0 && (
              <DetailRow label="Type" value="↩️ Refund / Cashback" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, mono, highlight }: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-3) 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-tertiary)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        color: highlight ? 'var(--color-warning)' : 'var(--color-text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}
