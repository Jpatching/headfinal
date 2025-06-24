'use client';

import { useState, useEffect } from 'react';
import { usePV3 } from '@/hooks/usePV3';

interface VaultManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationType = 'success' | 'error' | null;

export default function VaultManager({ isOpen, onClose }: VaultManagerProps) {
  const { 
    connected, 
    balance, 
    vaultBalance, 
    loading, 
    depositToVault, 
    withdrawFromVault, 
    formatSOL 
  } = usePV3();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [notification, setNotification] = useState<{type: NotificationType; message: string} | null>(null);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!isOpen) return null;

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    
    try {
      await depositToVault(Number(depositAmount));
      setDepositAmount('');
      showNotification('success', `Successfully deposited ${depositAmount} SOL to vault!`);
    } catch (error) {
      showNotification('error', `Deposit failed: ${error}`);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
    
    try {
      await withdrawFromVault(Number(withdrawAmount));
      setWithdrawAmount('');
      showNotification('success', `Successfully withdrew ${withdrawAmount} SOL from vault!`);
    } catch (error) {
      showNotification('error', `Withdraw failed: ${error}`);
    }
  };

  const setMaxDeposit = () => {
    const maxDeposit = Math.max(0, (balance - 5000000) / 1000000000);
    setDepositAmount(maxDeposit.toFixed(6));
  };

  const setMaxWithdraw = () => {
    const maxWithdraw = vaultBalance / 1000000000;
    setWithdrawAmount(maxWithdraw.toFixed(6));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-elevated border border-border rounded-xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary font-audiowide">💰 Vault Manager</h2>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Built-in Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          } animate-pulse-slow`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-inter text-sm">{notification.message}</span>
            </div>
          </div>
        )}

        {!connected && (
          <div className="text-center p-8">
            <p className="text-text-secondary font-inter">Connect your wallet first</p>
          </div>
        )}

        {connected && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4">
                <div className="text-text-secondary text-sm font-inter mb-1">Wallet Balance</div>
                <div className="text-text-primary font-bold font-audiowide">{formatSOL(balance)}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-text-secondary text-sm font-inter mb-1">Vault Balance</div>
                <div className="text-accent-primary font-bold font-audiowide">{formatSOL(vaultBalance)}</div>
              </div>
            </div>

            <div className="flex bg-bg-card rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-2 px-4 rounded-md font-audiowide text-sm transition-all ${
                  activeTab === 'deposit'
                    ? 'bg-accent-primary text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-2 px-4 rounded-md font-audiowide text-sm transition-all ${
                  activeTab === 'withdraw'
                    ? 'bg-accent-primary text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Withdraw
              </button>
            </div>

            {activeTab === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm font-inter mb-2">
                    Amount to Deposit (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary font-inter focus:outline-none focus:border-accent-primary"
                    />
                    <button
                      onClick={setMaxDeposit}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-secondary text-sm font-audiowide hover:text-accent-primary"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-text-muted font-inter">
                  💡 Deposits go directly to your personal PDA vault - non-custodial and secure
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || loading || Number(depositAmount) <= 0}
                  className="primary-button w-full font-audiowide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Deposit to Vault'}
                </button>
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm font-inter mb-2">
                    Amount to Withdraw (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary font-inter focus:outline-none focus:border-accent-primary"
                    />
                    <button
                      onClick={setMaxWithdraw}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-secondary text-sm font-audiowide hover:text-accent-primary"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-text-muted font-inter">
                  ⚠️ Withdrawals require smart contract execution (demo mode for now)
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || loading || Number(withdrawAmount) <= 0}
                  className="secondary-button w-full font-audiowide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Withdraw from Vault'}
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-bg-card border border-border rounded-lg">
              <h3 className="font-audiowide text-sm text-text-primary mb-2">How Vaults Work:</h3>
              <ul className="text-xs text-text-secondary font-inter space-y-1">
                <li>• Each player gets their own PDA vault address</li>
                <li>• Funds are non-custodial - you control the keys</li>
                <li>• Games deduct wagers directly from your vault</li>
                <li>• Winnings are deposited back to your vault</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 