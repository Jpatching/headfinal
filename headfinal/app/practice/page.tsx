"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import GameComponent from "@/components/game-component"
import { motion } from "framer-motion"
import GameHeader from "@/components/game-header"
import GameText from "@/components/game-text"

export default function PracticePage() {
  // Add state to handle client-side initialization
  const [isClient, setIsClient] = useState(false)

  // Use useEffect to set isClient to true once the component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <GameText variant="subheading">Back to Home</GameText>
        </Link>

        {/* Game logo/header - using our new component */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <GameHeader title="PRACTICE MODE" />
        </motion.div>

        <div className="w-full">
          <div className="rounded-lg overflow-hidden">
            {/* Only render GameComponent on the client side */}
            {isClient && <GameComponent betAmount={0} teamA="PRACTICE" teamB="CPU" />}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 bg-gray-800 p-4 rounded-lg"
          >
            <GameText variant="heading" className="mb-2">
              Game Controls
            </GameText>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <GameText variant="subheading" className="text-base">
                  Movement
                </GameText>
                <p className="text-gray-400">Arrow keys</p>
              </div>
              <div>
                <GameText variant="subheading" className="text-base">
                  Jump
                </GameText>
                <p className="text-gray-400">Space bar</p>
              </div>
              <div>
                <GameText variant="subheading" className="text-base">
                  Pause
                </GameText>
                <p className="text-gray-400">Escape key</p>
              </div>
              <div>
                <GameText variant="subheading" className="text-base">
                  Win Condition
                </GameText>
                <p className="text-gray-400">First to 5 goals</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
