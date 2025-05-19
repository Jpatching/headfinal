"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import GameHeader from "@/components/game-header"
import GameText from "@/components/game-text"

// Define character types
interface Character {
  id: string
  name: string
  image: string
  description: string
  stats: {
    speed: number
    jump: number
    kick: number
  }
  unlocked: boolean
}

// Define ball types
interface Ball {
  id: string
  name: string
  image: string
  description: string
  unlocked: boolean
}

export default function CharactersPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<string>("cr7")
  const [selectedBall, setSelectedBall] = useState<string>("gold")
  const [activeTab, setActiveTab] = useState<string>("characters")
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: "cr7",
      name: "CR7",
      image: "/images/cr7-character.png",
      description: "The legendary striker with exceptional all-around abilities.",
      stats: {
        speed: 9,
        jump: 10,
        kick: 10,
      },
      unlocked: true,
    },
    {
      id: "pessi",
      name: "Pessi",
      image: "/images/pessi-character.png",
      description: "The magical playmaker with incredible dribbling and passing.",
      stats: {
        speed: 10,
        jump: 7,
        kick: 9,
      },
      unlocked: true,
    },
    {
      id: "mbappe",
      name: "Mbappe",
      image: "/images/mbappe-character.png",
      description: "The lightning-fast forward with explosive acceleration.",
      stats: {
        speed: 10,
        jump: 8,
        kick: 8,
      },
      unlocked: true,
    },
    {
      id: "neymar",
      name: "Neymar",
      image: "/images/neymar-character.png",
      description: "The skillful Brazilian with flair and creativity.",
      stats: {
        speed: 9,
        jump: 7,
        kick: 9,
      },
      unlocked: true,
    },
    {
      id: "trump",
      name: "Trump",
      image: "/images/trump-character.png",
      description: "The businessman with surprising athletic abilities.",
      stats: {
        speed: 6,
        jump: 6,
        kick: 10,
      },
      unlocked: true,
    },
    {
      id: "cz",
      name: "CZ",
      image: "/images/cz-character.png",
      description: "The crypto exchange founder with balanced skills and steady performance.",
      stats: {
        speed: 7,
        jump: 7,
        kick: 8,
      },
      unlocked: true,
    },
    {
      id: "sbf",
      name: "SBF",
      image: "/images/sbf-character.png",
      description: "The risky trader with unpredictable moves and high volatility.",
      stats: {
        speed: 8,
        jump: 5,
        kick: 9,
      },
      unlocked: true,
    },
  ])

  const [balls, setBalls] = useState<Ball[]>([
    // Removed the Classic ball
    {
      id: "gold",
      name: "Golden Ball",
      image: "/images/football-gold.png",
      description: "A luxurious gold football for champions.",
      unlocked: true,
    },
    {
      id: "blue",
      name: "Blue Strike",
      image: "/images/football-blue.png",
      description: "A cool blue football that's easy to track.",
      unlocked: true,
    },
    {
      id: "red",
      name: "Red Fury",
      image: "/images/football-red.png",
      description: "A fiery red football for aggressive players.",
      unlocked: true,
    },
    {
      id: "green",
      name: "Green Machine",
      image: "/images/football-green.png",
      description: "An eco-friendly green football.",
      unlocked: true,
    },
    {
      id: "purple",
      name: "Royal Purple",
      image: "/images/football-purple.png",
      description: "A majestic purple football fit for royalty.",
      unlocked: true,
    },
    {
      id: "rainbow",
      name: "Rainbow Wonder",
      image: "/images/football-rainbow.png",
      description: "A colorful rainbow football that brings joy to the game.",
      unlocked: true,
    },
  ])

  // Load selected character and ball from localStorage
  useEffect(() => {
    const savedCharacter = localStorage.getItem("selectedCharacter")
    if (savedCharacter && characters.some((c) => c.id === savedCharacter)) {
      setSelectedCharacter(savedCharacter)
    } else {
      // Default to CR7 if no valid character is saved
      setSelectedCharacter("cr7")
      localStorage.setItem("selectedCharacter", "cr7")
    }

    const savedBall = localStorage.getItem("selectedBall")
    if (savedBall && balls.some((b) => b.id === savedBall)) {
      setSelectedBall(savedBall)
    } else {
      // Default to gold ball if no valid ball is saved or if default was previously set to classic
      setSelectedBall("gold")
      localStorage.setItem("selectedBall", "gold")
    }
  }, [characters, balls])

  // Save selected character to localStorage
  const selectCharacter = (id: string) => {
    setSelectedCharacter(id)
    localStorage.setItem("selectedCharacter", id)
  }

  // Save selected ball to localStorage
  const selectBall = (id: string) => {
    setSelectedBall(id)
    localStorage.setItem("selectedBall", id)
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-2 px-4 pb-4 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
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
      <div className="w-full max-w-5xl relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-3">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <GameText variant="subheading" className="uppercase">
            Back to Home
          </GameText>
        </Link>

        {/* Game logo/header - using our new component */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-3 -mt-2"
        >
          <GameHeader title="CHARACTERS & BALLS" />
        </motion.div>

        <Tabs defaultValue="characters" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="characters" className="text-lg font-bold">
              <GameText variant="subheading">Characters</GameText>
            </TabsTrigger>
            <TabsTrigger value="balls" className="text-lg font-bold">
              <GameText variant="subheading">Footballs</GameText>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Character preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 rounded-lg p-6 flex flex-col items-center"
              >
                <GameText variant="heading" className="mb-4">
                  Selected Character
                </GameText>

                {characters.find((c) => c.id === selectedCharacter) && (
                  <>
                    <div className="relative w-40 h-40 mb-4 flex items-center justify-center overflow-hidden">
                      <Image
                        src={characters.find((c) => c.id === selectedCharacter)?.image || ""}
                        alt={characters.find((c) => c.id === selectedCharacter)?.name || ""}
                        width={160}
                        height={160}
                        className="object-contain"
                        style={{ imageRendering: "pixelated" }}
                        priority
                      />
                    </div>

                    <GameText variant="heading" className="mb-2">
                      {characters.find((c) => c.id === selectedCharacter)?.name}
                    </GameText>

                    <GameText variant="subheading" className="text-sm text-gray-400 text-center mb-4">
                      {characters.find((c) => c.id === selectedCharacter)?.description}
                    </GameText>

                    <div className="w-full space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <GameText variant="subheading" className="text-sm">
                            Speed
                          </GameText>
                          <GameText variant="subheading" className="text-sm">
                            {characters.find((c) => c.id === selectedCharacter)?.stats.speed}/10
                          </GameText>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(characters.find((c) => c.id === selectedCharacter)?.stats.speed || 0) * 10}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <GameText variant="subheading" className="text-sm">
                            Jump
                          </GameText>
                          <GameText variant="subheading" className="text-sm">
                            {characters.find((c) => c.id === selectedCharacter)?.stats.jump}/10
                          </GameText>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(characters.find((c) => c.id === selectedCharacter)?.stats.jump || 0) * 10}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <GameText variant="subheading" className="text-sm">
                            Kick Power
                          </GameText>
                          <GameText variant="subheading" className="text-sm">
                            {characters.find((c) => c.id === selectedCharacter)?.stats.kick}/10
                          </GameText>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${(characters.find((c) => c.id === selectedCharacter)?.stats.kick || 0) * 10}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Character selection */}
              <div className="space-y-4">
                <GameText variant="heading" className="mb-4">
                  Available Characters
                </GameText>

                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                  {characters.map((character) => (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: characters.indexOf(character) * 0.1 }}
                    >
                      <Card
                        className={`bg-gray-800 border-gray-700 p-4 flex items-center cursor-pointer transition-all ${
                          selectedCharacter === character.id ? "border-purple-500 border-2" : ""
                        } ${!character.unlocked ? "opacity-60" : ""}`}
                        onClick={() => character.unlocked && selectCharacter(character.id)}
                      >
                        <div className="relative w-16 h-16 mr-4 flex items-center justify-center overflow-hidden">
                          <Image
                            src={character.image || "/placeholder.svg"}
                            alt={character.name}
                            width={64}
                            height={64}
                            className="object-contain"
                            style={{ imageRendering: "pixelated" }}
                            priority
                          />
                        </div>

                        <div className="flex-1">
                          <GameText variant="subheading" className="flex items-center">
                            {character.name}
                            {!character.unlocked && (
                              <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Locked</span>
                            )}
                          </GameText>
                          <GameText variant="subheading" className="text-sm text-gray-400">
                            {character.description}
                          </GameText>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="balls" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ball preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 rounded-lg p-6 flex flex-col items-center"
              >
                <GameText variant="heading" className="mb-4">
                  Selected Football
                </GameText>

                {balls.find((b) => b.id === selectedBall) && (
                  <>
                    <div className="relative w-40 h-40 mb-4 flex items-center justify-center overflow-hidden bg-gray-900 rounded-full p-4">
                      <div className="relative w-full h-full">
                        <Image
                          src={balls.find((b) => b.id === selectedBall)?.image || ""}
                          alt={balls.find((b) => b.id === selectedBall)?.name || ""}
                          fill
                          className="object-contain"
                          style={{ imageRendering: "pixelated" }}
                          priority
                        />
                      </div>
                    </div>

                    <GameText variant="heading" className="mb-2">
                      {balls.find((b) => b.id === selectedBall)?.name}
                    </GameText>

                    <GameText variant="subheading" className="text-sm text-gray-400 text-center mb-4">
                      {balls.find((b) => b.id === selectedBall)?.description}
                    </GameText>

                    <div className="w-full mt-4 bg-gray-700 p-4 rounded-lg">
                      <GameText variant="subheading" className="text-sm text-center text-gray-300">
                        The ball is purely cosmetic and does not affect gameplay.
                      </GameText>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Ball selection */}
              <div className="space-y-4">
                <GameText variant="heading" className="mb-4">
                  Available Footballs
                </GameText>

                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                  {balls.map((ball) => (
                    <motion.div
                      key={ball.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: balls.indexOf(ball) * 0.1 }}
                    >
                      <Card
                        className={`bg-gray-800 border-gray-700 p-4 flex items-center cursor-pointer transition-all ${
                          selectedBall === ball.id ? "border-purple-500 border-2" : ""
                        } ${!ball.unlocked ? "opacity-60" : ""}`}
                        onClick={() => ball.unlocked && selectBall(ball.id)}
                      >
                        <div className="relative w-16 h-16 mr-4 flex items-center justify-center overflow-hidden bg-gray-900 rounded-full p-2">
                          <div className="relative w-full h-full">
                            <Image
                              src={ball.image || "/placeholder.svg"}
                              alt={ball.name}
                              fill
                              className="object-contain"
                              style={{ imageRendering: "pixelated" }}
                              priority
                            />
                          </div>
                        </div>

                        <div className="flex-1">
                          <GameText variant="subheading" className="flex items-center">
                            {ball.name}
                            {!ball.unlocked && (
                              <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Locked</span>
                            )}
                          </GameText>
                          <GameText variant="subheading" className="text-sm text-gray-400">
                            {ball.description}
                          </GameText>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex space-x-4">
          <Link href="/play" className="flex-1">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <GameText variant="subheading">Play with Selected</GameText>
            </Button>
          </Link>

          <Link href="/practice" className="flex-1">
            <Button variant="outline" className="w-full">
              <GameText variant="subheading">Practice</GameText>
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
