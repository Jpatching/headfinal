'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentPage?: string;
}

export default function Sidebar({ isOpen = true, onClose, currentPage }: SidebarProps) {
  const pathname = usePathname();
  
  // Determine current page from pathname if not provided
  const getCurrentPage = () => {
    if (currentPage) return currentPage;
    if (pathname === '/') return 'home';
    if (pathname === '/classics') return 'classics';
    if (pathname.startsWith('/games/chess')) return 'chess';
    if (pathname === '/high-stakes') return 'high-stakes';
    if (pathname === '/tournaments') return 'tournaments';
    if (pathname === '/rewards') return 'rewards';
    if (pathname === '/profile') return 'profile';
    return 'home';
  };

  const currentPageKey = getCurrentPage();
  
  const navigationItems = [
    { name: '🏠 Home', href: '/', key: 'home' },
    { name: '🎮 Classics', href: '/classics', key: 'classics' },
    { name: '♟️ Chess Blitz', href: '/games/chess', key: 'chess' },
    { name: '💎 High Stakes', href: '/high-stakes', key: 'high-stakes' },
    { name: '🏆 Tournaments', href: '/tournaments', key: 'tournaments' },
    { name: '🎁 Rewards', href: '/rewards', key: 'rewards' },
    { name: '👤 My Profile', href: '/profile', key: 'profile' },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-bg-elevated border-r border-border
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={sidebarClasses}>
        <div className="p-4 lg:p-6">
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
              <span className="text-black font-audiowide font-bold text-lg">P</span>
            </div>
            <span className="text-heading-md text-text-primary font-audiowide">PV3.FUN</span>
          </Link>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose} // Close mobile menu on navigation
                className={`w-full text-left p-3 rounded-lg transition-all font-audiowide text-sm lg:text-base block ${
                  currentPageKey === item.key
                    ? 'bg-bg-hover text-text-primary border-l-4 border-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Security Note */}
          <div className="mt-8 p-4 bg-bg-card border border-border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-accent-success" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.1V11.1C15.4,11.4 16,12 16,12.8V16.8C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16.8V12.8C8,12 8.4,11.4 9.2,11.1V10.1C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10.1V11.1H13.5V10.1C13.5,8.7 12.8,8.2 12,8.2Z"/>
              </svg>
              <span className="text-text-primary font-audiowide font-medium text-sm">Non-Custodial</span>
            </div>
            <p className="text-xs text-text-secondary font-inter">Your funds in personal PDAs</p>
          </div>
        </div>
      </aside>
    </>
  );
} 