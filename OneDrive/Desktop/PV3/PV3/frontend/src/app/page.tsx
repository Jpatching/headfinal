'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameGrid } from '@/components/games/GameGrid';
import { LiveMatches } from '@/components/games/LiveMatches';
import { FeaturedBanner } from '@/components/games/FeaturedBanner';
import { StatsOverview } from '@/components/dashboard/StatsOverview';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-8">
      {/* Featured Banner */}
      <FeaturedBanner />

      {/* Stats Overview */}
      <StatsOverview />

      {/* Live Matches Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md text-text-primary">
            🔴 Live Matches
          </h2>
          <span className="text-text-secondary text-sm">
            156 active matches
          </span>
        </div>
        <LiveMatches />
      </section>

      {/* Games Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md text-text-primary">
            🎮 Available Games
          </h2>
          <div className="flex items-center gap-2">
            {['all', 'popular', 'new', 'high-stakes'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-bg-elevated text-text-primary border border-border'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <GameGrid category={selectedCategory} />
      </section>
    </div>
  );
} 