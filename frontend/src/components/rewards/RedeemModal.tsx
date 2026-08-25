'use client';

import React, { useState } from 'react';
import { Reward, RedeemResponse } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import '@/styles/rewards.css';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  userCoins: number;
  onConfirm: (rewardId: number) => Promise<RedeemResponse>;
  redeeming: boolean;
}

type RedeemStep = 'confirm' | 'success' | 'error';

export function RedeemModal({
  isOpen,
  onClose,
  reward,
  userCoins,
  onConfirm,
  redeeming,
}: RedeemModalProps) {
  const [step, setStep] = useState<RedeemStep>('confirm');
  const [result, setResult] = useState<RedeemResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleConfirm = async () => {
    if (!reward) return;
    try {
      const response = await onConfirm(reward.id);
      setResult(response);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redemption failed. Please try again.');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setResult(null);
    setError('');
    onClose();
  };

  if (!reward) return null;

  const canAfford = userCoins >= reward.coins_required;
  const remainingAfter = userCoins - reward.coins_required;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'success' ? 'Redemption Successful!' : step === 'error' ? 'Redemption Failed' : 'Confirm Redemption'}
      footer={
        step === 'confirm' ? (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={redeeming}
              disabled={!canAfford}
            >
              Confirm Redeem
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={handleClose}>
            {step === 'success' ? 'Done' : 'Close'}
          </Button>
        )
      }
    >
      {step === 'confirm' && (
        <div className="redeem-confirm">
          <div className="redeem-reward-preview">
            <div className="redeem-reward-icon">🎁</div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-md)' }}>
              {reward.name}
            </div>
            <div className="redeem-cost-display">
              <span>🪙</span>
              <span>{reward.coins_required}</span>
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {reward.description}
          </div>
          <div className="redeem-balance-info">
            Your balance: <strong>{userCoins.toLocaleString()} coins</strong>
            {canAfford && (
              <> → <strong>{remainingAfter.toLocaleString()} coins</strong> after redemption</>
            )}
          </div>
          {!canAfford && (
            <div style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-3)',
              background: 'var(--color-danger-bg)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-sm)',
            }}>
              ⚠️ You need {reward.coins_required - userCoins} more coins
            </div>
          )}
        </div>
      )}

      {step === 'success' && result && (
        <div className="redeem-success">
          <div className="redeem-success-icon">🎉</div>
          <div className="redeem-success-message">{result.message}</div>
          <div className="redeem-success-details">
            <div>Coins spent: <strong>{result.coins_spent}</strong></div>
            <div>Remaining balance: <strong>{result.remaining_balance.toLocaleString()} coins</strong></div>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="redeem-success">
          <div className="redeem-success-icon">😞</div>
          <div style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-danger)',
            marginBottom: 'var(--space-2)',
          }}>
            Something went wrong
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            {error}
          </div>
          <div style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
          }}>
            Your balance has been restored. No coins were deducted.
          </div>
        </div>
      )}
    </Modal>
  );
}
