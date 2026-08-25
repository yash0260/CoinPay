'use client';

import React from 'react';
import { Reward } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import '@/styles/rewards.css';

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
  onRedeem: (reward: Reward) => void;
}

const rewardIcons: Record<string, string> = {
  'Vouchers': '🎫',
  'Cashback': '💰',
  'Experiences': '✨',
};

export function RewardCard({ reward, userCoins, onRedeem }: RewardCardProps) {
  const canAfford = userCoins >= reward.coins_required;

  return (
    <div className="reward-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <div className="reward-card-icon">
          {rewardIcons[reward.category || ''] || '🎁'}
        </div>
        <div className="reward-card-content">
          <div className="reward-card-name">{reward.name}</div>
          <div className="reward-card-description">{reward.description}</div>
        </div>
      </div>
      <div className="reward-card-footer">
        <div className="reward-cost">
          <span>🪙</span>
          <span>{reward.coins_required}</span>
          {reward.category && <span className="reward-card-category">{reward.category}</span>}
        </div>
        <Button
          variant={canAfford ? 'primary' : 'secondary'}
          size="sm"
          disabled={!canAfford}
          onClick={() => onRedeem(reward)}
        >
          {canAfford ? 'Redeem' : 'Not enough coins'}
        </Button>
      </div>
    </div>
  );
}
