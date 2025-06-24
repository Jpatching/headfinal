'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { usePV3, ReferralStats, RewardHistory } from '@/hooks/usePV3';

export default function RewardsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'history'>('overview');
  const [notification, setNotification] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  
  const { 
    connected, 
    publicKey, 
    formatSOL, 
    loading,
    loadReferralStats,
    claimReferralRewards,
    loadRewardHistory
  } = usePV3();

  // Real data state
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [stats, history] = await Promise.all([
        loadReferralStats(),
        loadRewardHistory(),
      ]);

      setReferralStats(stats);
      setRewardHistory(history);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      setNotification({ type: 'error', message: 'Failed to load rewards data' });
    } finally {
      setDataLoading(false);
    }
  }, [loadReferralStats, loadRewardHistory]);

  // Load all data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadAllData();
    } else {
      setReferralStats(null);
      setRewardHistory([]);
    }
  }, [connected, publicKey, loadAllData]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const copyReferralCode = () => {
    if (!referralStats) return;
    
    const fullReferralLink = `${window.location.origin}?ref=${referralStats.referralCode}`;
    navigator.clipboard.writeText(fullReferralLink);
    setNotification({ type: 'success', message: 'Referral link copied to clipboard!' });
  };

  const claimRewards = async () => {
    if (!connected || !referralStats || referralStats.pendingRewards === 0) return;
    
    try {
      const result = await claimReferralRewards();
      setNotification({ 
        type: 'success', 
        message: `Successfully claimed ${formatSOL(Math.floor(result.amount * 1000000000))} SOL!` 
      });
      
      // Reload data after successful claim
      await loadAllData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim rewards';
      setNotification({ type: 'error', message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-main text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen">
        <PageHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          {/* Built-in Notification */}
          {notification && (
            <div className={`mb-4 p-3 rounded-lg border max-w-6xl mx-auto ${
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

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💰</div>
              <h1 className="text-4xl font-bold text-text-primary mb-2 font-audiowide uppercase">Referral Rakeback</h1>
              <p className="text-lg text-text-secondary font-inter">Earn 1% of all platform fees from your referrals</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-bg-card rounded-lg p-1 mb-8 max-w-lg mx-auto">
              {[
                { key: 'overview' as const, label: '📊 Overview' },
                { key: 'referrals' as const, label: '👥 Referrals' },
                { key: 'history' as const, label: '📜 History' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 px-4 rounded-md font-audiowide text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-accent-primary text-black'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!connected && (
              <div className="text-center glass-card p-12">
                <div className="text-4xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">Connect Wallet</h2>
                <p className="text-text-secondary font-inter">Connect your wallet to view your referral rakeback stats</p>
              </div>
            )}

            {connected && (
              <>
                {/* Loading State */}
                {(dataLoading || loading) && (
                  <div className="text-center glass-card p-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">Loading...</h2>
                    <p className="text-text-secondary font-inter">Fetching your rakeback data from the blockchain</p>
                  </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && !dataLoading && !loading && referralStats && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="glass-card p-6">
                        <div className="text-text-secondary text-sm font-inter mb-1">Total Earned</div>
                        <div className="text-2xl font-bold text-accent-primary font-audiowide">
                          {formatSOL(referralStats.totalEarned)}
                        </div>
                      </div>
                      <div className="glass-card p-6">
                        <div className="text-text-secondary text-sm font-inter mb-1">Pending Rakeback</div>
                        <div className="text-2xl font-bold text-yellow-400 font-audiowide">
                          {formatSOL(referralStats.pendingRewards)}
                        </div>
                      </div>
                      <div className="glass-card p-6">
                        <div className="text-text-secondary text-sm font-inter mb-1">This Week</div>
                        <div className="text-2xl font-bold text-green-400 font-audiowide">
                          {formatSOL(referralStats.weeklyEarnings)}
                        </div>
                      </div>
                      <div className="glass-card p-6">
                        <div className="text-text-secondary text-sm font-inter mb-1">Referrals</div>
                        <div className="text-2xl font-bold text-text-primary font-audiowide">
                          {referralStats.totalReferred}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-text-primary mb-4 font-audiowide">💸 Quick Claim</h3>
                        <p className="text-text-secondary font-inter mb-4">
                          You have {formatSOL(referralStats.pendingRewards)} rakeback ready to claim
                        </p>
                        <button
                          onClick={claimRewards}
                          disabled={referralStats.pendingRewards === 0 || loading}
                          className="primary-button w-full font-audiowide disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Claim Rakeback'}
                        </button>
                      </div>

                      <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-text-primary mb-4 font-audiowide">👥 Share & Earn</h3>
                        <p className="text-text-secondary font-inter mb-4">
                          Earn 1% of all platform fees from your referrals
                        </p>
                        <button
                          onClick={copyReferralCode}
                          className="secondary-button w-full font-audiowide"
                        >
                          Copy Referral Link
                        </button>
                      </div>
                    </div>

                    {/* How Rakeback Works */}
                    <div className="glass-card p-6">
                      <h3 className="text-xl font-bold text-text-primary mb-4 font-audiowide">💡 How Rakeback Works</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-text-secondary font-inter">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🎮</div>
                          <h4 className="font-audiowide text-text-primary mb-2">Platform Fees</h4>
                          <p>PV3 takes 6.5% from every game pot as platform fee</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl mb-2">💰</div>
                          <h4 className="font-audiowide text-text-primary mb-2">1% to Referrals</h4>
                          <p>1% of all platform fees goes to the referral pool</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl mb-2">🤝</div>
                          <h4 className="font-audiowide text-text-primary mb-2">Auto Distribution</h4>
                          <p>Rakeback is automatically distributed to referrers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referrals Tab */}
                {activeTab === 'referrals' && !dataLoading && !loading && referralStats && (
                  <div className="space-y-6">
                    <div className="glass-card p-6">
                      <h2 className="text-2xl font-bold text-text-primary mb-6 font-audiowide">👥 Referral Program</h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary mb-4 font-audiowide">Your Referral Code</h3>
                          <div className="bg-bg-card border border-border rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-accent-primary text-lg">{referralStats.referralCode}</span>
                              <button
                                onClick={copyReferralCode}
                                className="text-accent-secondary hover:text-accent-primary transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-text-muted font-inter">
                            Share: {window.location.origin}?ref={referralStats.referralCode}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-text-primary mb-4 font-audiowide">How It Works</h3>
                          <div className="space-y-3 text-sm text-text-secondary font-inter">
                            <div className="flex items-start space-x-2">
                              <span className="text-accent-primary">1.</span>
                              <span>Share your referral link with friends</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-accent-primary">2.</span>
                              <span>They sign up and start playing games</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-accent-primary">3.</span>
                              <span>You earn 1% of all platform fees they generate</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-accent-primary">4.</span>
                              <span>Rakeback is paid automatically in SOL</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-bg-card border border-border rounded-lg p-4">
                          <div className="text-text-secondary text-sm font-inter mb-1">Total Referred</div>
                          <div className="text-2xl font-bold text-text-primary font-audiowide">{referralStats.totalReferred}</div>
                        </div>
                        <div className="bg-bg-card border border-border rounded-lg p-4">
                          <div className="text-text-secondary text-sm font-inter mb-1">Lifetime Earnings</div>
                          <div className="text-2xl font-bold text-accent-primary font-audiowide">{formatSOL(referralStats.totalEarned)}</div>
                        </div>
                        <div className="bg-bg-card border border-border rounded-lg p-4">
                          <div className="text-text-secondary text-sm font-inter mb-1">Pending Rakeback</div>
                          <div className="text-2xl font-bold text-yellow-400 font-audiowide">{formatSOL(referralStats.pendingRewards)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && !dataLoading && !loading && (
                  <div className="space-y-6">
                    <div className="glass-card p-6">
                      <h2 className="text-2xl font-bold text-text-primary mb-6 font-audiowide">📜 Rakeback History</h2>
                      
                      {rewardHistory.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">📭</div>
                          <h3 className="text-xl font-bold text-text-primary mb-2 font-audiowide">No Rakeback Yet</h3>
                          <p className="text-text-secondary font-inter">Start referring friends to earn your first rakeback!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rewardHistory.map((reward, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                              <div>
                                <div className="font-audiowide text-text-primary">{reward.type}</div>
                                <div className="text-sm text-text-secondary font-inter">{reward.date}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-audiowide text-accent-primary">+{formatSOL(reward.amount)}</div>
                                <div className={`text-xs font-inter ${
                                  reward.status === 'claimed' ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {reward.status.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Future Token Integration */}
            <div className="glass-card p-8 mt-8 text-center">
              <div className="text-4xl mb-4">🪙</div>
              <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">$PV3 Token Coming Soon</h2>
              <p className="text-text-secondary font-inter mb-4">
                The future $PV3 token will unlock enhanced rewards, DAO voting rights, tournament sponsorships, and exclusive benefits for active community members.
              </p>
              <div className="text-sm text-text-muted font-inter">
                Token launch planned for post-MVP phase with 1,000,000,000 total supply
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}