import GameText from "./game-text"

interface GameHeaderProps {
  title: string
  className?: string
}

export default function GameHeader({ title, className = "" }: GameHeaderProps) {
  return (
    <div className={`w-full max-w-md mx-auto mb-8 ${className}`}>
      <div className="relative w-full h-20">
        <div className="absolute inset-0 bg-yellow-400 rounded-lg transform rotate-1"></div>
        <div className="absolute inset-0 bg-blue-900 rounded-lg transform -rotate-1 flex items-center justify-center">
          <div className="text-center">
            <GameText variant="title" color="white">
              {title}
            </GameText>
          </div>
        </div>
      </div>
    </div>
  )
}
