"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import GameText from "@/components/game-text"
import Leaderboard from "@/components/leaderboard"
import GameHeader from "@/components/game-header"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function LeaderboardPage() {
  const [limit, setLimit] = useState(25)
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      {/* Full-height background container */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Image
          src="/images/solana-stadium-background.png"
          alt="Stadium Field Background"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
        <div className="absolute inset-0 bg-black/70" /> {/* Dark overlay for better text contrast */}
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <GameText variant="subheading">Back to Home</GameText>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Game logo/header */}
          <motion.div className="w-full mb-6">
            <GameHeader title="LEADERBOARD" />
          </motion.div>

          {/* Leaderboard */}
          <Leaderboard limit={limit} />

          {/* Controls to view more/less players */}
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              variant="outline" 
              className="bg-blue-800 text-white hover:bg-blue-700 border-blue-700"
              onClick={() => setLimit(10)}
              disabled={limit === 10}
            >
              Top 10
            </Button>
            <Button 
              variant="outline"
              className="bg-blue-800 text-white hover:bg-blue-700 border-blue-700"
              onClick={() => setLimit(25)}
              disabled={limit === 25}
            >
              Top 25
            </Button>
            <Button 
              variant="outline"
              className="bg-blue-800 text-white hover:bg-blue-700 border-blue-700"
              onClick={() => setLimit(50)}
              disabled={limit === 50}
            >
              Top 50
            </Button>
          </div>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Play matches to climb the leaderboard and earn rewards!</p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
