import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSOL(amount: number): string {
  return `${amount.toFixed(2)} SOL`
}

export const gameCardStyles = {
  base: "relative bg-bg-secondary rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg",
  image: "w-full h-48 relative",
  overlay: "absolute inset-0 bg-gradient-to-t from-bg-secondary/80 to-transparent",
  title: "text-lg font-semibold text-text-primary",
  subtitle: "text-sm text-text-secondary"
}

export const buttonStyles = {
  primary: "bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors",
  secondary: "bg-bg-elevated hover:bg-bg-tertiary text-text-primary font-medium px-4 py-2 rounded-lg transition-colors border border-border",
  ghost: "hover:bg-bg-elevated text-text-secondary hover:text-text-primary font-medium px-4 py-2 rounded-lg transition-colors"
}

export function formatWallet(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function formatTimeAgo(date: Date | string | number): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

export const navStyles = {
  link: "flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200",
  activeLink: "flex items-center gap-3 px-3 py-2 rounded-lg text-text-primary bg-bg-elevated",
  icon: "w-5 h-5",
  label: "font-medium",
  item: "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
  itemActive: "text-text-primary bg-bg-elevated"
}