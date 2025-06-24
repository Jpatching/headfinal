'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import VaultManager from './VaultManager';
import { usePV3 } from '@/hooks/usePV3';

interface PageHeaderProps {
  onMenuClick?: () => void;
}

export default function PageHeader({ onMenuClick }: PageHeaderProps) {
  const { connected, vaultBalance, formatSOL } = usePV3();
  const [showVaultManager, setShowVaultManager] = useState(false);

  return (
    <>
      <header className="bg-bg-elevated border-b border-border px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden text-text-secondary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-accent-primary rounded-md flex items-center justify-center">
                <span className="text-black font-audiowide font-bold text-sm">P</span>
              </div>
              <span className="text-xl text-text-primary font-audiowide">PV3</span>
            </Link>
          </div>

          {/* Vault Balance */}
          <div className="flex items-center space-x-3 ml-2 lg:ml-8">
            <div 
              onClick={() => setShowVaultManager(true)}
              className="flex items-center bg-bg-card border border-border rounded-lg px-3 lg:px-4 py-2 hover:bg-bg-hover transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" viewBox="0 0 512 512" fill="none">
                <defs>
                  <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9945FF"/>
                    <stop offset="100%" stopColor="#14F195"/>
                  </linearGradient>
                </defs>
                <path d="M79.4 374.2C82.1 371.5 85.9 370 90 370H460C469.8 370 476.2 380.7 471.4 389.1L432.6 457.8C429.9 462.5 425.1 466 420 466H50C40.2 466 33.8 455.3 38.6 446.9L79.4 374.2Z" fill="url(#solanaGradient)"/>
                <path d="M79.4 137.8C82.1 140.5 85.9 142 90 142H460C469.8 142 476.2 131.3 471.4 122.9L432.6 54.2C429.9 49.5 425.1 46 420 46H50C40.2 46 33.8 56.7 38.6 65.1L79.4 137.8Z" fill="url(#solanaGradient)"/>
                <path d="M432.6 254.2C429.9 251.5 426.1 250 422 250H52C42.2 250 35.8 260.7 40.6 269.1L79.4 337.8C82.1 342.5 86.9 346 92 346H462C471.8 346 478.2 335.3 473.4 326.9L432.6 254.2Z" fill="url(#solanaGradient)"/>
              </svg>
              <span className="text-text-primary font-inter font-medium text-sm lg:text-base">
                {connected ? formatSOL(vaultBalance) : '0.00000000'}
              </span>
              <span className="text-text-secondary font-inter text-sm font-bold ml-2">Vault</span>
              <svg className="w-4 h-4 text-text-secondary ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Vault Manager Modal */}
      <VaultManager 
        isOpen={showVaultManager} 
        onClose={() => setShowVaultManager(false)} 
      />
    </>
  );
} 