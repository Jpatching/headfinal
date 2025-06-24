'use client';

import { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePV3 } from '@/hooks/usePV3';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import WalletStatus from './WalletStatus';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  title?: string;
  subtitle?: string;
  showWalletStatus?: boolean;
}

export default function Layout({ 
  children, 
  currentPage, 
  title, 
  subtitle,
  showWalletStatus = true 
}: LayoutProps) {
  const { connected } = useWallet();
  const { balance, formatSOL } = usePV3();

  return (
    <div className="min-h-screen bg-bg-main flex font-inter">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <PageHeader />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Page Header */}
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-4xl font-bold text-text-primary mb-2 font-audiowide uppercase">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-text-secondary text-lg font-inter">{subtitle}</p>
              )}
            </div>
          )}

          {/* Wallet Status */}
          {showWalletStatus && (
            <WalletStatus 
              connected={connected}
              balance={balance}
              formatSOL={formatSOL}
            />
          )}

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
} 