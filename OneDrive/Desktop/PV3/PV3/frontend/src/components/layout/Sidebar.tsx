'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Clock, 
  Star, 
  TrendingUp,
  Zap,
  Target,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { cn, navStyles } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  isLive?: boolean;
}

const navItems: NavItem[] = [
  { id: 'lobby', label: 'Lobby', icon: Gamepad2, count: 42, isLive: true },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: 8 },
  { id: 'live-matches', label: 'Live Matches', icon: Users, count: 156, isLive: true },
  { id: 'starting-soon', label: 'Starting Soon', icon: Clock, count: 23 },
  { id: 'featured', label: 'Featured', icon: Star, count: 12 },
  { id: 'trending', label: 'Trending', icon: TrendingUp, count: 34 },
  { id: 'high-stakes', label: 'High Stakes', icon: Crown, count: 7 },
  { id: 'quick-play', label: 'Quick Play', icon: Zap, count: 89 },
  { id: 'skill-based', label: 'Skill Based', icon: Target, count: 45 },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('lobby');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-card border border-border rounded-lg"
      >
        {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 0 : 280,
          opacity: isCollapsed ? 0 : 1 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "bg-bg-card border-r border-border flex flex-col overflow-hidden",
          "lg:relative lg:translate-x-0",
          "fixed inset-y-0 left-0 z-40",
          isCollapsed && "lg:w-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-text-secondary rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-bg-main" />
            </div>
            <div>
              <h1 className="font-audiowide text-lg font-bold text-text-primary">
                PV3.FUN
              </h1>
              <p className="text-xs text-text-secondary">Solana Gaming</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    "w-full relative",
                    isActive ? navStyles.itemActive : navStyles.item
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-text-primary rounded-r"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Icon className={navStyles.icon} />
                      <span className={navStyles.label}>{item.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Live indicator */}
                      {item.isLive && (
                        <div className="w-2 h-2 bg-red-500 rounded-full pulse-live" />
                      )}
                      
                      {/* Count badge */}
                      {item.count && (
                        <span className="bg-bg-elevated text-text-secondary text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="bg-bg-elevated rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-text-secondary">System Status</span>
            </div>
            <div className="text-xs text-text-primary font-medium">
              All systems operational
            </div>
            <div className="text-xs text-text-secondary mt-1">
              99.9% uptime
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCollapsed(true)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
} 