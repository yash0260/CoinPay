'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { CoinBalance, Reward, RedeemResponse, RedemptionHistory } from '@/lib/api';

interface UseRewardsState {
  balance: CoinBalance | null;
  rewards: Reward[];
  history: RedemptionHistory[];
  loading: boolean;
  redeeming: boolean;
  error: string | null;
  redeemError: string | null;
  redeemSuccess: RedeemResponse | null;
}

export function useRewards() {
  const [state, setState] = useState<UseRewardsState>({
    balance: null,
    rewards: [],
    history: [],
    loading: true,
    redeeming: false,
    error: null,
    redeemError: null,
    redeemSuccess: null,
  });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [balance, rewards, history] = await Promise.all([
        api.getCoinBalance(),
        api.getRewardsCatalogue(),
        api.getRedemptionHistory(),
      ]);
      setState(prev => ({
        ...prev,
        balance,
        rewards,
        history,
        loading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load rewards',
      }));
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const redeemReward = useCallback(async (rewardId: number) => {
    setState(prev => ({ ...prev, redeeming: true, redeemError: null, redeemSuccess: null }));

    // Optimistic update: find the reward and deduct coins
    const reward = state.rewards.find(r => r.id === rewardId);
    const previousBalance = state.balance?.coins ?? 0;

    if (reward && state.balance) {
      setState(prev => ({
        ...prev,
        balance: prev.balance ? {
          ...prev.balance,
          coins: prev.balance.coins - reward.coins_required,
        } : null,
      }));
    }

    try {
      const result = await api.redeemReward(rewardId);
      setState(prev => ({
        ...prev,
        redeeming: false,
        redeemSuccess: result,
        balance: prev.balance ? {
          ...prev.balance,
          coins: result.remaining_balance,
        } : null,
      }));

      // Refetch history
      const history = await api.getRedemptionHistory();
      setState(prev => ({ ...prev, history }));

      return result;
    } catch (err) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        redeeming: false,
        redeemError: err instanceof Error ? err.message : 'Redemption failed',
        balance: prev.balance ? { ...prev.balance, coins: previousBalance } : null,
      }));
      throw err;
    }
  }, [state.rewards, state.balance]);

  const clearRedeemState = useCallback(() => {
    setState(prev => ({ ...prev, redeemError: null, redeemSuccess: null }));
  }, []);

  return {
    ...state,
    redeemReward,
    clearRedeemState,
    refetch: fetchAll,
  };
}
