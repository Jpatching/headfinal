'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Play,
  Star,
  Zap
} from 'lucide-react';
import { cn, gameCardStyles, buttonStyles, formatSOL } from '@/lib/utils';

interface Game {
  id: string;
  name: string;
  description: string;
  minWager: number;
  maxWager: number;
  activeMatches: number;
  totalPlayers: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedDuration: string;
  thumbnail: string;
}

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-text-secondary';
    }
  };

  const handlePlayGame = () => {
    // TODO: Navigate to game lobby or create match
    console.log(`Starting game: ${game.id}`);
  };

  return (
    <motion.div
      className={gameCardStyles.base}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      onClick={handlePlayGame}
    >
      {/* Game thumbnail */}
      <div className="relative overflow-hidden">
        <div className={cn(gameCardStyles.image, "bg-bg-elevated")}>
          {/* Placeholder for game thumbnail */}
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {game.id === 'rps' && '✂️'}
            {game.id === 'coinflip' && '🪙'}
            {game.id === 'ttt' && '⭕'}
            {game.id === 'chess' && '♟️'}
            {game.id === 'blackjack' && '🃏'}
            {game.id === 'poker' && '🎰'}
          </div>
        </div>
        
        {/* Overlay */}
        <div className={gameCardStyles.overlay} />
        
        {/* Play button overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className={cn(
              buttonStyles.primary,
              "flex items-center gap-2 px-6 py-3 text-lg font-bold"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayGame();
            }}
          >
            <Play className="w-5 h-5" />
            PLAY NOW
          </motion.button>
        </motion.div>
      </div>

      {/* Game info */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className={gameCardStyles.title}>{game.name}</h3>
            <p className={gameCardStyles.subtitle}>{game.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-text-secondary">4.8</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-text-secondary" />
            <span className="text-xs text-text-secondary">
              {game.totalPlayers} players
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-text-secondary" />
            <span className="text-xs text-text-secondary">
              ~{game.estimatedDuration}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-text-secondary" />
            <span className="text-xs text-text-secondary">
              {game.activeMatches} live
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-text-secondary" />
            <span className={cn("text-xs font-medium", getDifficultyColor(game.difficulty))}>
              {game.difficulty}
            </span>
          </div>
        </div>

        {/* Wager range */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-xs text-text-secondary">Min/Max Wager</span>
            <div className="text-sm font-semibold text-text-primary">
              {formatSOL(game.minWager)} - {formatSOL(game.maxWager)}
            </div>
          </div>
          
          <motion.button
            className={cn(buttonStyles.secondary, "text-xs px-3 py-1")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayGame();
            }}
          >
            Quick Play
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 