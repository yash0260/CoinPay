'use client';

import React, { useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CategorySpend } from '@/lib/api';
import { formatCompact, getCategoryHex } from '@/lib/utils';

interface CategoryPieChartProps {
  data: CategorySpend[];
  onCategoryClick?: (category: string) => void;
  activeCategory?: string;
}

export function CategoryPieChart({ data, onCategoryClick, activeCategory }: CategoryPieChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback((_data: any, index: number) => {
    if (onCategoryClick && data[index]) {
      const entry = data[index];
      // Toggle: if already active, deselect
      onCategoryClick(activeCategory === entry.category ? '' : entry.category);
    }
  }, [onCategoryClick, activeCategory, data]);

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: 'var(--color-text-tertiary)',
      }}>
        No spending data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={2}
          dataKey="total_amount"
          nameKey="category"
          onClick={handleClick}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.category}
              fill={getCategoryHex(entry.category)}
              opacity={activeCategory && activeCategory !== entry.category ? 0.3 : 1}
              stroke={activeCategory === entry.category ? '#fff' : 'transparent'}
              strokeWidth={activeCategory === entry.category ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown) => [formatCompact(Number(value)), 'Total Spend']}
          contentStyle={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
          }}
          itemStyle={{ color: 'var(--color-text-primary)' }}
          labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}
        />
        <Legend
          verticalAlign="bottom"
          height={56}
          formatter={(value: string) => (
            <span style={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
            }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
