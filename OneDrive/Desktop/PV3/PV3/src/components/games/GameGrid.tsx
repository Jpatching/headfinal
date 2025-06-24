'use client';

import { motion } from 'framer-motion';
import { GameCard } from './GameCard';

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

const mockGames: Game[] = [
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    description: 'Classic hand game with instant results',
    minWager: 0.01,
    maxWager: 10,
    activeMatches: 23,
    totalPlayers: 156,
    category: 'popular',
    difficulty: 'Easy',
    estimatedDuration: '30s',
    thumbnail: '/games/rps.jpg',
  },
  {
    id: 'coinflip',
    name: 'Coin Flip',
    description: 'Pure luck - 50/50 chance to double your SOL',
    minWager: 0.01,
    maxWager: 50,
    activeMatches: 45,
    totalPlayers: 289,
    category: 'popular',
    difficulty: 'Easy',
    estimatedDuration: '10s',
    thumbnail: '/games/coinflip.jpg',
  },
  {
    id: 'ttt',
    name: 'Tic Tac Toe',
    description: 'Strategic grid game - outsmart your opponent',
    minWager: 0.05,
    maxWager: 25,
    activeMatches: 12,
    totalPlayers: 78,
    category: 'new',
    difficulty: 'Medium',
    estimatedDuration: '2m',
    thumbnail: '/games/ttt.jpg',
  },
  {
    id: 'chess',
    name: 'Speed Chess',
    description: 'Classic chess with 5-minute time limit',
    minWager: 0.1,
    maxWager: 100,
    activeMatches: 8,
    totalPlayers: 34,
    category: 'high-stakes',
    difficulty: 'Hard',
    estimatedDuration: '10m',
    thumbnail: '/games/chess.jpg',
  },
  {
    id: 'blackjack',
    name: 'Blackjack 21',
    description: 'Beat the dealer - get as close to 21 as possible',
    minWager: 0.02,
    maxWager: 20,
    activeMatches: 18,
    totalPlayers: 92,
    category: 'popular',
    difficulty: 'Medium',
    estimatedDuration: '3m',
    thumbnail: '/games/blackjack.jpg',
  },
  {
    id: 'poker',
    name: 'Texas Hold\'em',
    description: 'Head-to-head poker showdown',
    minWager: 0.5,
    maxWager: 200,
    activeMatches: 6,
    totalPlayers: 24,
    category: 'high-stakes',
    difficulty: 'Hard',
    estimatedDuration: '15m',
    thumbnail: '/games/poker.jpg',
  },
];

interface GameGridProps {
  category: string;
}

export function GameGrid({ category }: GameGridProps) {
  const filteredGames = category === 'all' 
    ? mockGames 
    : mockGames.filter(game => game.category === category);

  return (
    <div className="grid grid-cols-games-mobile md:grid-cols-games-tablet lg:grid-cols-games-desktop xl:grid-cols-games-xl gap-6">
      {filteredGames.map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: 'easeOut'
          }}
        >
          <GameCard game={game} />
        </motion.div>
      ))}
      
      {/* Empty state */}
      {filteredGames.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🎮</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No games found
          </h3>
          <p className="text-text-secondary">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
} 