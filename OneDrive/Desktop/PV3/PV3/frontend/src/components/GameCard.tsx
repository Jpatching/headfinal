'use client';

interface GameCardProps {
  name: string;
  emoji: string;
  gradient: string;
  minWager?: string;
  onPlay: (gameName: string) => void;
  isConnected: boolean;
}

export default function GameCard({ 
  name, 
  emoji, 
  gradient, 
  minWager, 
  onPlay, 
  isConnected 
}: GameCardProps) {
  return (
    <div className="game-card group">
      <div className={`aspect-[3/4] bg-gradient-to-br ${gradient} rounded-lg overflow-hidden relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
        {/* Game Cover Background */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Game Icon/Symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl opacity-30 transform rotate-12">
            {emoji}
          </div>
        </div>
        
        {/* Game Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-audiowide font-bold text-lg leading-tight">
            {name}
          </h3>
          {minWager && (
            <p className="text-white/80 text-sm font-inter mt-1">{minWager} min</p>
          )}
        </div>
        
        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => onPlay(name)}
            className="bg-accent-primary hover:bg-accent-secondary text-black px-6 py-2 rounded-lg font-audiowide font-bold transform scale-90 group-hover:scale-100 transition-transform duration-300"
            disabled={!isConnected}
          >
            {isConnected ? 'PLAY' : 'CONNECT'}
          </button>
        </div>
      </div>
    </div>
  );
} 