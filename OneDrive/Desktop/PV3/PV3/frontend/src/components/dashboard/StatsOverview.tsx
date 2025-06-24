'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Gamepad2, Trophy, DollarSign, Clock, LucideIcon } from 'lucide-react';
import { formatSOL } from '@/lib/utils';

interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
}

const stats: StatCard[] = [
  {
    id: 'volume',
    title: '24h Volume',
    value: formatSOL(1247.89),
    change: '+23.5%',
    icon: DollarSign,
    color: 'text-green-400'
  },
  {
    id: 'players',
    title: 'Active Players',
    value: '2,847',
    change: '+12.3%',
    icon: Users,
    color: 'text-blue-400'
  },
  {
    id: 'matches',
    title: 'Matches Today',
    value: '8,432',
    change: '+18.7%',
    icon: Gamepad2,
    color: 'text-purple-400'
  },
  {
    id: 'tournaments',
    title: 'Live Tournaments',
    value: '8',
    change: '+2',
    icon: Trophy,
    color: 'text-yellow-400'
  }
];

export function StatsOverview() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-bg-elevated ${stat.color}`}>
                {React.createElement(Icon, { className: "w-4 h-4" })}
              </div>
              <span className={`text-xs font-medium ${stat.color}`}>
                {stat.change}
              </span>
            </div>
            
            <div>
              <h3 className="text-text-secondary text-xs font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-text-primary text-lg font-bold">
                {stat.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
} 