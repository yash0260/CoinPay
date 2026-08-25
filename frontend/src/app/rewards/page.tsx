'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RedeemModal } from '@/components/rewards/RedeemModal';
import { Spinner } from '@/components/ui/Spinner';
import { useRewards } from '@/hooks/useRewards';
import { Reward } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import '@/styles/rewards.css';

export default function RewardsPage() {
  const {
    balance,
    rewards,
    history,
    loading,
    redeeming,
    redeemReward,
  } = useRewards();

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setModalOpen(true);
  };

  const handleConfirm = async (rewardId: number) => {
    return await redeemReward(rewardId);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReward(null);
  };

  if (loading) {
    return (
      <AppLayout coins={balance?.coins ?? 0} coinsLoading={true}>
        <Spinner size="lg" />
      </AppLayout>
    );
  }

  return (
    <AppLayout coins={balance?.coins ?? 0} coinsLoading={false}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Rewards Center</h1>
        <p className="page-subtitle">
          Redeem your earned coins for exciting rewards and vouchers
        </p>
      </div>

      {/* Balance Overview */}
      <div className="card" style={{
        marginBottom: 'var(--space-6)',
        background: 'linear-gradient(135deg, var(--color-bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}>
          <div>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-tertiary)',
              marginBottom: 'var(--space-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 'var(--weight-medium)',
            }}>
              Available Balance
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}>
              <span style={{ fontSize: '40px' }}>🪙</span>
              <span style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 'var(--weight-extrabold)',
                color: 'var(--color-warning)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {balance?.coins?.toLocaleString() ?? 0}
              </span>
              <span style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-tertiary)',
                fontWeight: 'var(--weight-medium)',
              }}>
                coins
              </span>
            </div>
          </div>
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            textAlign: 'right',
          }}>
            <div>Earn 1 coin per ₹100 spent</div>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
              Max 50 coins per transaction
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Catalogue */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          marginBottom: 'var(--space-4)',
        }}>
          Available Rewards
        </h2>
        <div className="rewards-grid">
          {rewards.map((reward, index) => (
            <div key={reward.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
              <RewardCard
                reward={reward}
                userCoins={balance?.coins ?? 0}
                onRedeem={handleRedeem}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Redemption History */}
      {history.length > 0 && (
        <div>
          <h2 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-semibold)',
            marginBottom: 'var(--space-4)',
          }}>
            Redemption History
          </h2>
          <div className="card">
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div>
                    <div className="history-item-name">{item.reward_name}</div>
                    <div className="history-item-date">{formatDate(item.redeemed_at)}</div>
                  </div>
                  <div className="history-item-coins">-{item.coins_spent} coins</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        reward={selectedReward}
        userCoins={balance?.coins ?? 0}
        onConfirm={handleConfirm}
        redeeming={redeeming}
      />
    </AppLayout>
  );
}
