'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePV3, UserProfile } from '@/hooks/usePV3';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import WalletStatus from '@/components/WalletStatus';

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { balance, formatSOL, loadUserProfile, loading } = usePV3();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Load user profile data
  const loadProfileData = useCallback(async () => {
    setDataLoading(true);
    try {
      const profile = await loadUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [loadUserProfile]);

  // Load profile data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadProfileData();
    } else {
      setUserProfile(null);
    }
  }, [connected, publicKey, loadProfileData]);

  // Calculate derived stats from real user data
  const userStats = userProfile ? {
    totalGamesPlayed: userProfile.totalMatches,
    gamesWon: userProfile.wins,
    gamesLost: userProfile.losses,
    winRate: userProfile.winRate,
    totalEarnings: userProfile.totalEarnings,
    totalLosses: userProfile.totalMatches > 0 ? (userProfile.totalMatches - userProfile.wins) * 0.1 : 0, // Estimate
    netProfit: userProfile.totalEarnings,
    currentStreak: 0, // Not available from backend yet
    level: Math.floor(userProfile.reputation / 100),
    xp: userProfile.reputation,
    xpToNext: (Math.floor(userProfile.reputation / 100) + 1) * 100 - userProfile.reputation,
  } : {
    // Fallback values when profile is loading or not available
    totalGamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    totalEarnings: 0,
    totalLosses: 0,
    netProfit: 0,
    currentStreak: 0,
    level: 1,
    xp: 1000,
    xpToNext: 100,
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-main text-text-primary">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:ml-64 min-h-screen">
          <PageHeader onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="p-6">
            <div className="max-w-4xl mx-auto text-center py-20">
              <div className="text-8xl mb-8">🔒</div>
              <h1 className="text-4xl font-bold text-text-primary mb-4 font-audiowide uppercase">Connect Wallet</h1>
              <p className="text-lg text-text-secondary mb-8 font-inter">
                Connect your wallet to view your gaming profile and statistics
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64 min-h-screen">
        <PageHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Loading State */}
            {(dataLoading || loading) && !userProfile && (
              <div className="text-center glass-card p-12 mb-8">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">Loading Profile...</h2>
                <p className="text-text-secondary font-inter">Fetching your gaming data from the blockchain</p>
              </div>
            )}

            {/* Profile Header */}
            <div className="mb-8">
              <div className="glass-card p-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-black font-audiowide">
                      {publicKey?.toString().slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-text-primary font-audiowide mb-2">
                      {userProfile?.username || `${publicKey?.toString().slice(0, 8)}...${publicKey?.toString().slice(-4)}`}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span className="font-inter">Level {userStats?.level} • {(userProfile?.reputation ?? 1000) >= 1500 ? 'Gold' : (userProfile?.reputation ?? 1000) >= 1000 ? 'Silver' : 'Bronze'} Rank</span>
                      <span className="font-inter">
                        {userProfile?.createdAt ? 
                          `Joined ${new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 
                          'New Player'
                        }
                      </span>
                      {(dataLoading || loading) && <span className="font-inter text-accent-primary">Loading...</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent-success font-audiowide">
                      +{formatSOL(userStats?.netProfit)} SOL
                    </div>
                    <div className="text-sm text-text-secondary font-inter">Net Profit</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Status */}
            <WalletStatus 
              connected={connected}
              balance={balance}
              formatSOL={formatSOL}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-text-primary font-audiowide">{userStats?.totalGamesPlayed}</div>
                <div className="text-sm text-text-secondary font-inter">Games Played</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-accent-success font-audiowide">{userStats?.gamesWon}</div>
                <div className="text-sm text-text-secondary font-inter">Games Won</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-accent-primary font-audiowide">{userStats?.winRate}%</div>
                <div className="text-sm text-text-secondary font-inter">Win Rate</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-accent-warning font-audiowide">{userStats?.currentStreak}</div>
                <div className="text-sm text-text-secondary font-inter">Win Streak</div>
              </div>
            </div>

            {/* Earnings Summary */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-text-primary mb-4 font-audiowide">💰 Earnings Summary</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-success font-audiowide">+{formatSOL(userStats?.totalEarnings)}</div>
                  <div className="text-sm text-text-secondary font-inter">Total Winnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-danger font-audiowide">-{formatSOL(userStats?.totalLosses)}</div>
                  <div className="text-sm text-text-secondary font-inter">Total Losses</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold font-audiowide ${userStats?.netProfit >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {userStats?.netProfit >= 0 ? '+' : ''}{formatSOL(userStats?.netProfit)}
                  </div>
                  <div className="text-sm text-text-secondary font-inter">Net Profit/Loss</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-text-primary mb-6 font-audiowide">�� Recent Games</h3>
              
              {!userProfile || userProfile.totalMatches === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎯</div>
                  <h4 className="text-xl font-bold text-text-primary mb-2 font-audiowide">No Games Played Yet</h4>
                  <p className="text-text-secondary font-inter">Start playing games to see your match history here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">🔄</div>
                    <p className="text-text-secondary font-inter">Game history integration coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 