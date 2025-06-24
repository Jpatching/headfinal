'use client';

interface WalletStatusProps {
  connected: boolean;
  balance: number;
  formatSOL: (amount: number) => string;
}

export default function WalletStatus({ connected, balance, formatSOL }: WalletStatusProps) {
  if (!connected) {
    return (
      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-500 font-audiowide">Connect your wallet to start playing!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-500 font-audiowide">Ready to Play!</span>
        </div>
        <div className="text-text-primary font-inter">
          <span className="text-text-secondary">Balance: </span>
          <span className="font-bold">{formatSOL(balance)} SOL</span>
        </div>
      </div>
    </div>
  );
} 