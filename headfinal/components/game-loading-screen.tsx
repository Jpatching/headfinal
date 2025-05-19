"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Coins, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import GameText from "./game-text"

interface GameLoadingScreenProps {
  onLoadComplete: () => void
  betAmount?: number
}

export default function GameLoadingScreen({ onLoadComplete, betAmount = 0 }: GameLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Initializing game...")
  const [selectedCharacter, setSelectedCharacter] = useState("cr7")
  const [opponentCharacter, setOpponentCharacter] = useState("cz")
  const [muted, setMuted] = useState(false)
  const loadingTexts = [
    "Initializing game...",
    "Loading assets...",
    "Preparing physics engine...",
    "Connecting to Solana...",
    "Setting up the field...",
    "Get ready to play!",
  ]
  const ballRef = useRef<HTMLDivElement>(null)
  const player1Ref = useRef<HTMLDivElement>(null)
  const player2Ref = useRef<HTMLDivElement>(null)

  // Load selected character
  useEffect(() => {
    // Only access localStorage on the client
    const savedCharacter = localStorage.getItem("selectedCharacter")
    if (savedCharacter) {
      setSelectedCharacter(savedCharacter)
    } else {
      // Default to CR7 if no valid character is saved
      setSelectedCharacter("cr7")
    }
  }, [])

  // Initialize opponent character randomly
  useEffect(() => {
    // Available characters for opponent
    const availableCharacters = ["cr7", "pessi", "mbappe", "neymar", "trump", "cz", "sbf"]
    // Remove the player's selected character from available opponents
    const filteredCharacters = availableCharacters.filter((char) => char !== selectedCharacter)
    // Select a random character for the opponent
    const randomCharacter = filteredCharacters[Math.floor(Math.random() * filteredCharacters.length)]
    setOpponentCharacter(randomCharacter)
  }, [selectedCharacter])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let textInterval: NodeJS.Timeout

    // Simulate loading progress
    interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 200)

    // Change loading text periodically
    textInterval = setInterval(() => {
      setLoadingText((prev) => {
        const currentIndex = loadingTexts.indexOf(prev)
        const nextIndex = (currentIndex + 1) % loadingTexts.length
        return loadingTexts[nextIndex]
      })
    }, 1500)

    // Animate the ball and players
    const animateElements = () => {
      if (ballRef.current) {
        const randomX = Math.random() * 80 - 40
        const randomY = Math.random() * 80 - 40
        ballRef.current.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 360}deg)`
      }

      if (player1Ref.current) {
        const randomX = Math.random() * 20 - 10
        player1Ref.current.style.transform = `translateX(${randomX}px)`
      }

      if (player2Ref.current) {
        const randomX = Math.random() * 20 - 10
        player2Ref.current.style.transform = `translateX(${randomX}px)`
      }

      requestAnimationFrame(animateElements)
    }

    const animation = requestAnimationFrame(animateElements)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
      cancelAnimationFrame(animation)
    }
  }, [loadingTexts])

  // Complete loading when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onLoadComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [progress, onLoadComplete])

  const toggleMute = () => {
    setMuted((prev) => !prev)
  }

  // Render the appropriate character based on selection
  const renderCharacter = (character: string, isFlipped = false) => {
    const characterImages: Record<string, string> = {
      cr7: "/images/cr7-character.png",
      pessi: "/images/pessi-character.png",
      mbappe: "/images/mbappe-character.png",
      neymar: "/images/neymar-character.png",
      trump: "/images/trump-character.png",
      cz: "/images/cz-character.png",
      sbf: "/images/sbf-character.png",
    }

    return (
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(1.2) ${isFlipped ? "scaleX(-1)" : ""}`,
        }}
      >
        <Image
          src={characterImages[character] || "/images/cr7-character.png"}
          alt={`${character} Character`}
          fill
          priority
          style={{ objectFit: "contain", imageRendering: "pixelated" }}
        />
      </div>
    )
  }

  // Ball rendering - update to handle the new default
  const getBallImage = () => {
    const savedBall = localStorage.getItem("selectedBall")
    // If no ball is selected or if it was the classic ball, use gold as default
    if (!savedBall || savedBall === "default") {
      localStorage.setItem("selectedBall", "gold")
      return "/images/football-gold.png"
    }
    return `/images/football-${savedBall}.png`
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Stadium background */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/solana-stadium-background.png"
          alt="Stadium Field Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/50" /> {/* Darker overlay for loading screen */}
      </div>

      {/* Sound toggle */}
      <button onClick={toggleMute} className="absolute top-4 right-4 z-10 bg-gray-800 p-2 rounded-full">
        {muted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
      </button>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Game logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="relative w-full h-24 mb-4">
            <div className="absolute inset-0 bg-yellow-400 rounded-lg transform rotate-1"></div>
            <div className="absolute inset-0 bg-blue-900 rounded-lg transform -rotate-1 flex items-center justify-center">
              <div className="text-center">
                <GameText variant="title" color="white">
                  SOLANA
                </GameText>
                <GameText variant="subtitle" color="yellow">
                  SPORTS HEADS
                </GameText>
              </div>
            </div>
          </div>

          {betAmount > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Coins className="h-5 w-5 text-yellow-400" />
              <GameText variant="subheading" color="yellow" className="font-medium">
                {betAmount * 2} SOL Pot
              </GameText>
            </div>
          )}
        </motion.div>

        {/* Sports Heads style animation - with stadium field */}
        <div className="relative h-48 mb-8 rounded-lg overflow-hidden">
          {/* Stadium background */}
          <div className="absolute inset-0">
            <Image
              src="/images/solana-stadium-background.png"
              alt="Stadium Background"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Left Goal */}
          <div className="absolute bottom-0 left-0 w-[12%] h-[75%] z-10">
            <Image
              src="/images/left-goal.png"
              alt="Left Goal"
              fill
              style={{ objectFit: "fill", objectPosition: "left bottom" }}
              priority
            />
          </div>

          {/* Right Goal */}
          <div className="absolute bottom-0 right-0 w-[12%] h-[75%] z-10">
            <Image
              src="/images/right-goal.png"
              alt="Right Goal"
              fill
              style={{ objectFit: "fill", objectPosition: "right bottom" }}
              priority
            />
          </div>

          {/* Field markings */}
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-1/2"></div>
            <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Player 1 */}
          <div
            ref={player1Ref}
            className="absolute bottom-8 left-[25%] w-16 h-16 transition-transform duration-300 ease-out"
          >
            <div className="relative w-full h-full">
              {/* Body */}
              <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-blue-600 transform -translate-x-1/2 rounded-md"></div>

              {/* Head */}
              <div className="absolute bottom-[15%] left-1/2 w-full h-full transform -translate-x-1/2 overflow-hidden">
                {renderCharacter(selectedCharacter)}
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div
            ref={player2Ref}
            className="absolute bottom-8 right-[25%] w-16 h-16 transition-transform duration-300 ease-out"
          >
            <div className="relative w-full h-full">
              {/* Body */}
              <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-red-600 transform -translate-x-1/2 rounded-md"></div>

              {/* Head */}
              <div className="absolute bottom-[15%] left-1/2 w-full h-full transform -translate-x-1/2 overflow-hidden">
                {renderCharacter(opponentCharacter, true)}
              </div>
            </div>
          </div>

          {/* Ball - Using the selected ball image */}
          <div ref={ballRef} className="absolute top-1/2 left-1/2 w-8 h-8 transition-transform duration-300 ease-out">
            <div className="w-full h-full relative">
              <Image
                src={getBallImage() || "/placeholder.svg"}
                alt="Football"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* VS text */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-4 py-1 rounded-full border-2 border-yellow-400">
            <GameText variant="subheading" className="text-sm">
              VS
            </GameText>
          </div>
        </div>

        {/* Loading progress */}
        <div className="w-full mb-4">
          <div className="h-4 w-full bg-blue-900 rounded-full overflow-hidden border-2 border-yellow-400">
            <motion.div
              className="h-full bg-yellow-400"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            ></motion.div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-white">
            <GameText variant="subheading" className="text-sm">
              {Math.round(progress)}%
            </GameText>
            <AnimatePresence mode="wait">
              <motion.div
                key={loadingText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GameText variant="subheading" className="text-sm">
                  {loadingText}
                </GameText>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tips */}
        <AnimatePresence mode="wait">
          <motion.div
            key={Math.floor(progress / 20)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-sm text-yellow-400 mt-4 bg-blue-900 p-2 rounded-lg border-2 border-yellow-400"
          >
            {progress < 20 && "Tip: Use left/right arrows to move your player"}
            {progress >= 20 &&
              progress < 40 &&
              "Tip: Press up arrow to jump and space to kick the ball. Headers are more powerful!"}
            {progress >= 40 && progress < 60 && "Tip: First to 5 goals or highest score after 2 minutes wins"}
            {progress >= 60 && progress < 80 && "Tip: Winner takes the entire pot of SOL"}
            {progress >= 80 && "Tip: Press ESC to pause the game"}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
