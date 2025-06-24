'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Settings, 
  User,
  Wallet,
  TrendingUp,
  Filter
} from 'lucide-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import { cn, buttonStyles } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

const tabItems: TabItem[] = [
  { id: 'lobby', label: 'Lobby', count: 42 },
  { id: 'originals', label: 'Originals', count: 8 },
  { id: 'featured', label: 'Featured', count: 12 },
  { id: 'trending', label: 'Trending', count: 34 },
  { id: 'live', label: 'Live', count: 156 },
];

export function Header() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-bg-card border-b border-border">
      <div className="px-6 py-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search games, players, tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-main border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary placeholder-text-secondary focus:border-border-hover focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                3
              </span>
            </button>

            {/* Settings */}
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Wallet */}
            <WalletButton />

            {/* Profile */}
            <button className="flex items-center gap-2 p-2 text-text-secondary hover:text-text-primary transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-text-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-bg-main" />
              </div>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "text-text-primary bg-bg-elevated" 
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-bg-elevated rounded-lg border border-border"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className="relative flex items-center gap-2">
                    {tab.label}
                    {tab.count && (
                      <span className="bg-bg-main text-text-secondary text-xs px-2 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Filter and sort */}
          <div className="flex items-center gap-2">
            <button className={cn(buttonStyles.ghost, "flex items-center gap-2")}>
              <Filter className="w-4 h-4" />
              Filter
            </button>
            
            <button className={cn(buttonStyles.ghost, "flex items-center gap-2")}>
              <TrendingUp className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="bg-bg-main border-t border-border px-6 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-live" />
              <span className="text-text-secondary">Online Players:</span>
              <span className="text-text-primary font-medium">2,847</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Active Matches:</span>
              <span className="text-text-primary font-medium">156</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Total Volume (24h):</span>
              <span className="text-text-primary font-medium">1,247.89 SOL</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Server:</span>
            <span className="text-green-500 font-medium">Operational</span>
          </div>
        </div>
      </div>
    </header>
  );
} 