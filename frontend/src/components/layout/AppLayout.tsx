'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CoinBalance } from '@/components/rewards/CoinBalance';
import { useTheme } from '@/hooks/useTheme';
import '@/styles/layout.css';

interface AppLayoutProps {
  children: React.ReactNode;
  coins: number;
  coinsLoading: boolean;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/rewards', label: 'Rewards', icon: '🎁' },
];

export function AppLayout({ children, coins, coinsLoading }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand" onClick={() => setSidebarOpen(false)}>
            <div className="brand-icon">C</div>
            <div className="brand-text">
              <span className="brand-name">CoinPay</span>
              <span className="brand-tagline">Pay · Earn · Redeem</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">CoinPay v1.0 — Digital Alpha</p>
        </div>
      </aside>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h1 style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-primary)',
          }}>
            {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
          </h1>
        </div>
        <div className="header-right">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '16px'
            }}
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <CoinBalance coins={coins} loading={coinsLoading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
