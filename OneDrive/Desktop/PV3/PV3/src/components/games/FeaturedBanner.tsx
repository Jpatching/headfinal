'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Users, Clock, Star } from 'lucide-react';
import { cn, buttonStyles, formatSOL } from '@/lib/utils';

export function FeaturedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative p-8">
        <div className="flex items-center justify-between">
          {/* Left content */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400 uppercase tracking-wide">
                Featured Tournament
              </span>
            </div>

            <h1 className="text-heading-lg font-audiowide text-text-primary mb-4">
              🏆 PV3 Championship
            </h1>
            
            <p className="text-body-lg text-text-secondary mb-6 leading-relaxed">
              Join the ultimate Solana gaming championship! Compete in multiple games, 
              climb the leaderboard, and win your share of the massive prize pool.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-heading-sm text-text-primary font-bold">
                  {formatSOL(500)}
                </div>
                <div className="text-xs text-text-secondary uppercase tracking-wide">
                  Prize Pool
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-heading-sm text-text-primary font-bold">
                  2,847
                </div>
                <div className="text-xs text-text-secondary uppercase tracking-wide">
                  Players
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-heading-sm text-text-primary font-bold">
                  2d 14h
                </div>
                <div className="text-xs text-text-secondary uppercase tracking-wide">
                  Time Left
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4">
              <motion.button
                className={cn(
                  buttonStyles.primary,
                  "flex items-center gap-2 px-8 py-3 text-base font-bold button-glow"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5" />
                JOIN TOURNAMENT
              </motion.button>
              
              <motion.button
                className={cn(buttonStyles.secondary, "px-6 py-3")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Details
              </motion.button>
            </div>
          </div>

          {/* Right visual */}
          <div className="hidden lg:block relative">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-32 h-32 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full flex items-center justify-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center">
                <div className="text-4xl">🏆</div>
              </div>
            </motion.div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-yellow-400" />
            </motion.div>
            
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center"
            >
              <TrendingUp className="w-3 h-3 text-green-400" />
            </motion.div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full pulse-live" />
                <span className="text-text-secondary">Live Now:</span>
                <span className="text-text-primary font-medium">156 matches</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-text-secondary" />
                <span className="text-text-secondary">Online:</span>
                <span className="text-text-primary font-medium">2,847 players</span>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-text-secondary" />
                <span className="text-text-secondary">24h Volume:</span>
                <span className="text-text-primary font-medium">{formatSOL(1247.89)}</span>
              </div>
            </div>
            
            <div className="text-text-secondary">
              Next tournament starts in 4h 23m
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 