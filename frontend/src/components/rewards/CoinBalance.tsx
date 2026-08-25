'use client';

import React from 'react';
import '@/styles/rewards.css';

interface CoinBalanceProps {
  coins: number;
  loading?: boolean;
}

export function CoinBalance({ coins, loading }: CoinBalanceProps) {
  return (
    <div className="coin-balance" title={`${coins} reward coins`}>
      <span className="coin-icon">🪙</span>
      <span className="coin-count">
        {loading ? '...' : coins.toLocaleString()}
      </span>
      <span className="coin-label">coins</span>
    </div>
  );
}
