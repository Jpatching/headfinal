'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn, buttonStyles, formatSOL, formatWallet } from '@/lib/utils';

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [balance, setBalance] = useState(2.847); // Mock balance - replace with actual

  if (!connected) {
    return (
      <div className="wallet-adapter-button-container">
        <WalletMultiButton className={cn(buttonStyles.primary, "!px-4 !py-2")} />
      </div>
    );
  }

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      // TODO: Add toast notification
    }
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}`, '_blank');
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 bg-bg-elevated border border-border rounded-lg",
          "hover:border-border-hover transition-all duration-200",
          "text-text-primary font-medium"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Wallet className="w-4 h-4" />
        
        <div className="flex flex-col items-start">
          <span className="text-xs text-text-secondary">Balance</span>
          <span className="text-sm font-semibold">{formatSOL(balance)}</span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-secondary">Wallet</span>
          <span className="text-sm">{formatWallet(publicKey?.toString() || '')}</span>
        </div>
        
        <ChevronDown 
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isDropdownOpen && "rotate-180"
          )} 
        />
      </motion.button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)} 
          />
          
          {/* Dropdown content */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-border rounded-lg shadow-2xl z-20"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">Wallet Details</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-text-secondary">Connected</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-text-secondary">Address</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-text-primary font-mono">
                      {formatWallet(publicKey?.toString() || '')}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleViewExplorer}
                      className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-text-secondary">Balance</span>
                  <div className="text-lg font-bold text-text-primary">
                    {formatSOL(balance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-4 space-y-2">
              <button className={cn(buttonStyles.secondary, "w-full justify-center")}>
                Deposit SOL
              </button>
              
              <button className={cn(buttonStyles.secondary, "w-full justify-center")}>
                Withdraw SOL
              </button>
              
              <button className={cn(buttonStyles.secondary, "w-full justify-center")}>
                Transaction History
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <button
                onClick={disconnect}
                className={cn(
                  buttonStyles.ghost, 
                  "w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
                )}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
} 