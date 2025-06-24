'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, Eye } from 'lucide-react';
import { cn, formatSOL, formatWallet, formatTimeAgo } from '@/lib/utils';

interface LiveMatch {
  id: string;
  game: string;
  player1: string;
  player2: string;
  wager: number;
  timeRemaining: string;
  viewers: number;
  status: 'playing' | 'waiting';
}

const mockLiveMatches: LiveMatch[] = [
  {
    id: '1',
    game: 'Rock Paper Scissors',
    player1: '7xKw...9mLp',
    player2: '3fVn...8kRt',
    wager: 2.5,
    timeRemaining: '0:45',
    viewers: 23,
    status: 'playing'
  },
  {
    id: '2',
    game: 'Coin Flip',
    player1: '9aHj...2cWq',
    player2: 'Waiting...',
    wager: 5.0,
    timeRemaining: '2:30',
    viewers: 8,
    status: 'waiting'
  },
  {
    id: '3',
    game: 'Tic Tac Toe',
    player1: '4mBx...7nPz',
    player2: '8rGt...1vKs',
    wager: 1.2,
    timeRemaining: '1:15',
    viewers: 45,
    status: 'playing'
  },
  {
    id: '4',
    game: 'Speed Chess',
    player1: '6dYp...4hNm',
    player2: '2sQw...9jFg',
    wager: 25.0,
    timeRemaining: '8:20',
    viewers: 156,
    status: 'playing'
  }
];

export function LiveMatches() {
  return (
    <div className="space-y-3">
      {mockLiveMatches.map((match, index) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            {/* Game info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  match.status === 'playing' ? 'bg-red-500 pulse-live' : 'bg-yellow-500'
                )} />
                <span className="font-medium text-text-primary">{match.game}</span>
              </div>
              
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-sm">
                  {formatWallet(match.player1)} vs {
                    match.status === 'waiting' ? match.player2 : formatWallet(match.player2)
                  }
                </span>
              </div>
            </div>

            {/* Match details */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-primary font-semibold">
                    {formatSOL(match.wager)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">{match.timeRemaining}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">{match.viewers}</span>
                </div>
              </div>

              {/* Action button */}
              <motion.button
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  match.status === 'playing'
                    ? "bg-bg-elevated text-text-primary hover:bg-bg-elevated/80"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {match.status === 'playing' ? 'Watch' : 'Join'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
      
      {/* View all button */}
      <motion.button
        className="w-full p-3 bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        View All Live Matches ({mockLiveMatches.length + 152} total)
      </motion.button>
    </div>
  );
} 