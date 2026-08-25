import type { Metadata } from "next";
import '@/styles/globals.css';
import '@/styles/components.css';

export const metadata: Metadata = {
  title: "CoinPay — Credit Card Bill Payments & Rewards",
  description: "Pay credit card bills, earn reward coins on every payment, and track your spending with detailed analytics. A modern financial dashboard by Digital Alpha Technologies.",
  keywords: "credit card, bill payment, rewards, coins, spending analytics, financial dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#06080f" />
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (!theme || theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
