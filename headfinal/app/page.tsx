"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, GamepadIcon as GameController, Trophy, User, Volume2, VolumeX } from "lucide-react"
import { motion } from "framer-motion"
import GameText from "@/components/game-text"
import { useToast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"

// Fallback component if Leaderboard fails to load
const LeaderboardFallback = () => (
  <div className="p-6 bg-blue-900 border-4 border-yellow-400 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold text-white mb-4">Loading Leaderboard...</h3>
    <p className="text-gray-300">Please wait while we fetch the latest player rankings.</p>
  </div>
)

// Use dynamic import with fallback for Leaderboard component
const Leaderboard = dynamic(() => import("@/components/leaderboard"), {
  ssr: false,
  loading: LeaderboardFallback,
})

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState("cr7")
  const [opponentCharacter, setOpponentCharacter] = useState("pessi")
  const [muted, setMuted] = useState(false)
  const { toast } = useToast()
  // Add state to handle client-side initialization
  const [isClient, setIsClient] = useState(false)

  // Check if Phantom wallet is installed
  useEffect(() => {
    // Set isClient to true once the component mounts
    setIsClient(true)

    const checkWallet = async () => {
      try {
        // @ts-ignore - Phantom wallet types
        const isPhantomInstalled = window.phantom?.solana?.isPhantom
        if (!isPhantomInstalled) {
          console.log("Phantom wallet is not installed")
        }
      } catch (error) {
        console.error("Failed to check wallet:", error)
      }
    }

    if (typeof window !== "undefined") {
      checkWallet()
    }

    // Only access localStorage on the client side
    if (typeof window !== "undefined") {
      // Load selected character
      const savedCharacter = localStorage.getItem("selectedCharacter")
      if (savedCharacter) {
        setSelectedCharacter(savedCharacter)
      }

      // Make sure we have a default ball selected
      const savedBall = localStorage.getItem("selectedBall")
      if (!savedBall) {
        localStorage.setItem("selectedBall", "gold")
      }
    }

    // Set random opponent
    const characters = ["cr7", "pessi", "mbappe", "neymar", "trump", "cz", "sbf"]
    const filteredCharacters = characters.filter((char) => char !== selectedCharacter)
    const randomOpponent = filteredCharacters[Math.floor(Math.random() * filteredCharacters.length)]
    setOpponentCharacter(randomOpponent)
  }, [selectedCharacter])

  const connectWallet = async () => {
    try {
      // Import and use the common wallet connection function instead of direct access
      const { connectWallet: connect } = await import("@/lib/solana-wallet");
      const { publicKey, error } = await connect();

      if (error) {
        toast({
          title: "Error connecting wallet",
          description: error,
          variant: "destructive",
        })
        return
      }

      if (publicKey) {
        setWalletConnected(true)

        toast({
          title: "Wallet connected",
          description: `Connected to ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`,
        })
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Error connecting wallet",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

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
      <div className="relative w-full h-full">
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
            style={{ objectFit: "contain", imageRendering: "pixelated" }}
            priority
          />
        </div>
      </div>
    )
  }

  // Ball rendering - update to handle the new default
  const getBallImage = () => {
    // Only access localStorage on the client side
    if (typeof window !== "undefined") {
      const savedBall = localStorage.getItem("selectedBall")
      // If no ball is selected or if it was the classic ball, use gold as default
      if (!savedBall || savedBall === "default") {
        localStorage.setItem("selectedBall", "gold")
        return "/images/football-gold.png"
      }
      return `/images/football-${savedBall}.png`
    }
    // Default for server-side rendering
    return "/images/football-gold.png"
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-0 overflow-hidden relative">
      {/* Full-height background container */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Image
          src="/images/solana-stadium-background.png"
          alt="Stadium Field Background"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
        <div className="absolute inset-0 bg-black/10" /> {/* Very light overlay for better text contrast */}
      </div>

      {/* Sound toggle */}
      <button onClick={toggleMute} className="absolute top-4 right-4 z-10 bg-gray-800 p-2 rounded-full">
        {muted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
      </button>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center pt-8 pb-16 min-h-screen">
        {/* Game logo/header - using the same style as the loading screen */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mb-8"
        >
          <div className="relative w-full h-32 md:h-40">
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
        </motion.div>

        {/* Game field with characters */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full max-w-3xl h-64 mb-8 rounded-lg overflow-hidden backdrop-blur-sm"
        >
          {/* Field background */}
          <div className="absolute inset-0">
            <Image
              src="/images/solana-stadium-background.png"
              alt="Stadium Field Background"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
            />
          </div>

          {/* Left goal */}
          <div className="absolute left-0 bottom-0 w-[12%] h-[75%] z-10">
            <Image
              src="/images/left-goal.png"
              alt="Left Goal"
              fill
              style={{ objectFit: "fill", objectPosition: "left bottom" }}
              priority
            />
          </div>

          {/* Right goal */}
          <div className="absolute right-0 bottom-0 w-[12%] h-[75%] z-10">
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
          <div className="absolute left-1/4 bottom-8 w-24 h-24">
            <div className="relative w-full h-full">
              {/* Body */}
              <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-blue-600 transform -translate-x-1/2 rounded-md"></div>

              {/* Head */}
              <div className="absolute bottom-[15%] left-1/2 w-full h-full transform -translate-x-1/2">
                {renderCharacter(selectedCharacter)}
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="absolute right-1/4 bottom-8 w-24 h-24">
            <div className="relative w-full h-full">
              {/* Body */}
              <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-red-600 transform -translate-x-1/2 rounded-md"></div>

              {/* Head */}
              <div className="absolute bottom-[15%] left-1/2 w-full h-full transform -translate-x-1/2">
                {renderCharacter(opponentCharacter, true)}
              </div>
            </div>
          </div>

          {/* Ball - Using the selected ball image */}
          <div className="absolute left-1/2 top-1/2 w-10 h-10 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-full h-full relative">
              {isClient && (
                <Image
                  src={getBallImage() || "/placeholder.svg"}
                  alt="Football"
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Menu buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg">
              <div className="p-4 text-center">
                <GameController className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <GameText variant="heading" className="mb-4">
                  Practice Mode
                </GameText>
                <Link href="/practice" className="w-full">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold">
                    <GameText variant="subheading" color="blue">
                      Play Now
                    </GameText>
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg">
              <div className="p-4 text-center">
                <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <GameText variant="heading" className="mb-4">
                  Bet & Play
                </GameText>
                {!walletConnected ? (
                  <Button
                    onClick={connectWallet}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold"
                  >
                    <GameText variant="subheading" color="blue">
                      Connect Wallet
                    </GameText>
                  </Button>
                ) : (
                  <Link href="/play" className="w-full">
                    <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold">
                      <GameText variant="subheading" color="blue">
                        Play & Bet
                      </GameText>
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg">
              <div className="p-4 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <GameText variant="heading" className="mb-4">
                  Characters
                </GameText>
                <Link href="/characters" className="w-full">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold">
                    <GameText variant="subheading" color="blue">
                      Select Player
                    </GameText>
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Trophy section - updated to use Leaderboard component */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 w-full max-w-3xl"
        >
          <Leaderboard limit={5} />
        </motion.div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center text-white text-sm">
          <p>© 2025 Solana Sports Heads | Play. Bet. Win SOL.</p>
        </div>
      </div>
    </main>
  )
}
