'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import WalletStatus from '@/components/WalletStatus';
import { usePV3 } from '@/hooks/usePV3';

export default function ClassicsPage() {
  const { 
    connected, 
    balance,
    vaultBalance, 
    loading, 
    quickPlay, 
    gameTypes, 
    formatSOL 
  } = usePV3();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wagerAmount, setWagerAmount] = useState('0.1');

  // Game definitions
  const games = [
    {
      id: gameTypes.COIN_FLIP,
      title: 'Coin Flip',
      description: 'Classic heads or tails - 50/50 odds with instant payouts',
      icon: '🪙',
      minWager: 0.01,
      maxWager: 10,
    },
    {
      id: gameTypes.ROCK_PAPER_SCISSORS,
      title: 'Rock Paper Scissors',
      description: 'Beat your opponent in the timeless strategy game',
      icon: '✂️',
      minWager: 0.01,
      maxWager: 5,
    },
    {
      id: gameTypes.DICE_ROLL,
      title: 'Dice Roll',
      description: 'Roll higher than your opponent to win the pot',
      icon: '🎲',
      minWager: 0.05,
      maxWager: 15,
    },
    {
      id: gameTypes.NUMBER_GUESS,
      title: 'Number Guess',
      description: 'Guess the mystery number between 1-100',
      icon: '🔢',
      minWager: 0.01,
      maxWager: 8,
    },
  ];

  const handleQuickPlay = async (gameId: number) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(wagerAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid wager amount');
      return;
    }

    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (amount < game.minWager || amount > game.maxWager) {
      alert(`Wager must be between ${game.minWager} and ${game.maxWager} SOL`);
      return;
    }

    try {
      alert(`🎮 Starting ${game.title} with ${wagerAmount} SOL wager...`);
      await quickPlay(gameId, amount);
    } catch (error) {
      alert(`Failed to start game: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-main text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen">
        <PageHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-audiowide mb-2">🎯 Classic Games</h1>
              <p className="text-text-secondary font-inter">
                Pure skill meets pure chance - choose your battlefield
              </p>
            </div>

            <WalletStatus 
              connected={connected}
              balance={balance}
              formatSOL={formatSOL}
            />

            {connected && (
              <>
                {/* Wager Settings */}
                <div className="glass-card p-6 mb-8">
                  <h2 className="text-xl font-bold font-audiowide mb-4">⚙️ Game Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm font-inter mb-2">
                        Wager Amount (SOL)
                      </label>
                      <input
                        type="number"
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(e.target.value)}
                        placeholder="0.1"
                        step="0.01"
                        min="0.01"
                        className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary font-inter focus:outline-none focus:border-accent-primary"
                      />
                    </div>
                    <div className="glass-card p-4">
                      <div className="text-text-secondary text-sm font-inter mb-1">Vault Balance</div>
                      <div className="text-accent-primary font-bold font-audiowide">{formatSOL(vaultBalance)}</div>
                    </div>
                    <div className="glass-card p-4">
                      <div className="text-text-secondary text-sm font-inter mb-1">Platform Fee</div>
                      <div className="text-text-primary font-bold font-audiowide">6.5%</div>
                    </div>
                  </div>
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {games.map((game) => (
                    <div key={game.id} className="game-card group cursor-pointer">
                      <div className="aspect-[4/3] bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                          {game.icon}
                        </div>
                        <h3 className="text-lg font-bold font-audiowide text-text-primary mb-2">
                          {game.title}
                        </h3>
                        <p className="text-sm text-text-secondary font-inter mb-4 line-clamp-2">
                          {game.description}
                        </p>
                        <div className="text-xs text-text-muted font-inter mb-4">
                          Wager: {game.minWager} - {game.maxWager} SOL
                        </div>
                        <button
                          onClick={() => handleQuickPlay(game.id)}
                          disabled={loading}
                          className="primary-button font-audiowide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Playing...' : 'Quick Play'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Game Info */}
                <div className="mt-8 glass-card p-6">
                  <h2 className="text-xl font-bold font-audiowide mb-4">📋 How Games Work</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-inter">
                    <div>
                      <h3 className="font-bold mb-2 text-accent-primary">🎮 Quick Play</h3>
                      <ul className="text-text-secondary space-y-1">
                        <li>• Instantly matched with opponents</li>
                        <li>• Games resolve in 2-3 seconds</li>
                        <li>• Winners take 93.5% of the pot</li>
                        <li>• Funds deducted from your vault</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2 text-accent-primary">🏦 Vault System</h3>
                      <ul className="text-text-secondary space-y-1">
                        <li>• Non-custodial PDA vault per player</li>
                        <li>• Deposit SOL from wallet to vault</li>
                        <li>• Winnings added automatically</li>
                        <li>• Withdraw anytime (smart contract)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 