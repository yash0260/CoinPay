'use client';

import React, { useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, BarChart,
} from 'recharts';
import { MonthlySpend } from '@/lib/api';
import { formatCompact, formatMonth } from '@/lib/utils';

interface MonthlyTrendChartProps {
  data: MonthlySpend[];
  onMonthClick?: (month: string) => void;
  activeMonth?: string;
}

export function MonthlyTrendChart({ data, onMonthClick, activeMonth }: MonthlyTrendChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = useCallback((barData: any) => {
    if (onMonthClick && barData && typeof barData.month === 'string') {
      onMonthClick(activeMonth === barData.month ? '' : barData.month);
    }
  }, [onMonthClick, activeMonth]);

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: 'var(--color-text-tertiary)',
      }}>
        No monthly data available
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    displayMonth: formatMonth(d.month),
    isActive: activeMonth === d.month,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148, 163, 184, 0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="displayMonth"
          tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value: number) => formatCompact(value)}
          tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value: unknown) => [formatCompact(Number(value)), 'Total Spend']}
          labelFormatter={(label: unknown) => `Month: ${String(label)}`}
          contentStyle={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
          }}
          itemStyle={{ color: 'var(--color-text-primary)' }}
          labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <Bar
          dataKey="total_amount"
          fill="url(#barGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          onClick={handleBarClick}
          style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
