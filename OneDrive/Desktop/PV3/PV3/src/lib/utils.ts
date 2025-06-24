import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for game card hover effects
export const gameCardStyles = {
  base: "group relative bg-bg-card rounded-lg overflow-hidden border border-border hover:border-border-hover transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl cursor-pointer",
  image: "w-full aspect-game-card object-cover",
  overlay: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
  content: "absolute bottom-0 left-0 right-0 p-4",
  title: "text-text-primary font-semibold text-sm mb-1",
  subtitle: "text-text-secondary text-xs",
};

// Utility for button styles
export const buttonStyles = {
  primary: "bg-button-fill text-text-primary border border-border hover:bg-button-hover hover:text-button-fill transition-all duration-200 px-4 py-2 rounded-lg font-button uppercase",
  secondary: "bg-transparent text-text-primary border border-border hover:border-border-hover transition-all duration-200 px-4 py-2 rounded-lg font-button uppercase",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary transition-all duration-200 px-4 py-2 rounded-lg font-button uppercase",
};

// Utility for navigation styles
export const navStyles = {
  item: "flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer",
  itemActive: "flex items-center gap-3 px-4 py-3 text-text-primary border-l-2 border-text-primary bg-bg-elevated/50",
  icon: "w-5 h-5",
  label: "font-medium text-sm",
};

// Format SOL amounts
export function formatSOL(amount: number): string {
  if (amount < 0.001) return "< 0.001 SOL";
  if (amount < 1) return `${amount.toFixed(3)} SOL`;
  if (amount < 1000) return `${amount.toFixed(2)} SOL`;
  return `${(amount / 1000).toFixed(1)}K SOL`;
}

// Format wallet address
export function formatWallet(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Format time ago
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Generate random game thumbnails (for demo)
export function getGameThumbnail(gameId: string): string {
  const thumbnails = {
    'rps': '/games/rock-paper-scissors.jpg',
    'coinflip': '/games/coinflip.jpg',
    'ttt': '/games/tic-tac-toe.jpg',
    'default': '/games/default.jpg',
  };
  return thumbnails[gameId as keyof typeof thumbnails] || thumbnails.default;
} 