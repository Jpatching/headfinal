"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Coins, Volume2, VolumeX } from "lucide-react"
import GameLoadingScreen from "./game-loading-screen"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import CR7Character from "./cr7-character"
import PessiCharacter from "./pessi-character"
import MbappeCharacter from "./mbappe-character"
import NeymarCharacter from "./neymar-character"
import TrumpCharacter from "./trump-character"
import CZCharacter from "./cz-character"
import SBFCharacter from "./sbf-character"
import GameText from "./game-text"
import { useToast } from "@/components/ui/use-toast"

interface GameComponentProps {
  betAmount: number
  teamA?: string
  teamB?: string
  matchId?: string | null
  playerPublicKey?: string | null
  opponentPublicKey?: string | null
}

export default function GameComponent({
  betAmount,
  teamA = "Player 1",
  teamB = "Player 2",
  matchId = null,
  playerPublicKey = null,
  opponentPublicKey = null,
}: GameComponentProps) {
  const gameCanvasRef = useRef<HTMLDivElement>(null)
  const [gameTime, setGameTime] = useState(120)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const [payoutComplete, setPayoutComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [muted, setMuted] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 30 })
  const [player1Position, setPlayer1Position] = useState({ x: 25, y: 70 })
  const [player2Position, setPlayer2Position] = useState({ x: 75, y: 70 })
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 })
  const [isPaused, setIsPaused] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState("cr7")
  const [opponentCharacter, setOpponentCharacter] = useState<string>("cz")
  const [showKickEffect, setShowKickEffect] = useState(false)
  const [kickEffectPosition, setKickEffectPosition] = useState({ x: 0, y: 0 })
  const { toast } = useToast()

  // Player physics state
  const [player1Velocity, setPlayer1Velocity] = useState({ x: 0, y: 0 })
  const [player2Velocity, setPlayer2Velocity] = useState({ x: 0, y: 0 })
  const [player1IsJumping, setPlayer1IsJumping] = useState(false)
  const [player2IsJumping, setPlayer2IsJumping] = useState(false)
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({})
  const [lastKick, setLastKick] = useState<number>(0)

  // Simple goal notification
  const [showGoalText, setShowGoalText] = useState(false)
  const [scoringTeam, setScoringTeam] = useState<string>("")

  // Add this with the other refs
  const ballRef = useRef<{ bounceCount: number }>({ bounceCount: 0 })

  // Constants for physics
  const GRAVITY = 0.5
  const JUMP_FORCE = -6 // Reduced jump force for lower jumps
  const MOVE_SPEED = 0.4 // Slightly increased for more responsive movement
  const MAX_MOVE_SPEED = 2.0 // Lower max speed
  const FRICTION = 0.8 // Increased friction to reduce acceleration feel
  const KICK_POWER = 4.0 // Reduced from 7.5 to make kicks less powerful
  const KICK_COOLDOWN = 300 // ms
  const FLOOR_Y = 80 // Adjusted to match the flat ground position
  const BALL_BOUNCE_FACTOR = 0.95 // Increased from 0.85 to maintain bounce height
  const BALL_AIR_RESISTANCE = 0.985 // Increased from 0.98 to slow down horizontal movement less
  const BALL_GRAVITY_FACTOR = 0.65 // Reduced from 0.8 to make the ball fall slower
  const BALL_RADIUS = 3.025 // Increased from 2.75 (10% increase)

  // Goal constants
  const GOAL_HEIGHT = 75 // Reduced from 85% to 75%
  const GOAL_TOP = FLOOR_Y - GOAL_HEIGHT * 0.8 // Top of the goal area for detection

  // Goal line positions (the first line of the net that the ball must fully cross)
  const LEFT_GOAL_LINE = 5 // The x-position of the left goal line
  const RIGHT_GOAL_LINE = 95 // The x-position of the right goal line

  // Goal post and crossbar positions
  const LEFT_GOAL_POSTS = {
    leftPost: { x: 0, y: FLOOR_Y, width: 2, height: GOAL_HEIGHT * 0.8 },
    rightPost: { x: LEFT_GOAL_LINE, y: FLOOR_Y, width: 2, height: GOAL_HEIGHT * 0.8 },
    crossbar: { x: 0, y: GOAL_TOP, width: LEFT_GOAL_LINE, height: 2 },
  }

  const RIGHT_GOAL_POSTS = {
    leftPost: { x: RIGHT_GOAL_LINE, y: FLOOR_Y, width: 2, height: GOAL_HEIGHT * 0.8 },
    rightPost: { x: 100, y: FLOOR_Y, width: 2, height: GOAL_HEIGHT * 0.8 },
    crossbar: { x: RIGHT_GOAL_LINE, y: GOAL_TOP, width: 100 - RIGHT_GOAL_LINE, height: 2 },
  }

  // Character stats
  const characterStats = {
    cr7: {
      jumpForce: JUMP_FORCE * 1.2,
      moveSpeed: MOVE_SPEED * 1.2,
      maxMoveSpeed: MAX_MOVE_SPEED * 1.2,
      kickPower: KICK_POWER * 1.2, // Reduced from 1.4
    },
    pessi: {
      jumpForce: JUMP_FORCE * 1.0,
      moveSpeed: MOVE_SPEED * 1.4, // Faster than CR7
      maxMoveSpeed: MAX_MOVE_SPEED * 1.4, // Higher top speed
      kickPower: KICK_POWER * 1.1, // Reduced from 1.2
    },
    mbappe: {
      jumpForce: JUMP_FORCE * 1.1,
      moveSpeed: MOVE_SPEED * 1.5, // Fastest player
      maxMoveSpeed: MAX_MOVE_SPEED * 1.5, // Highest top speed
      kickPower: KICK_POWER * 0.9, // Reduced from 1.0
    },
    neymar: {
      jumpForce: JUMP_FORCE * 1.0,
      moveSpeed: MOVE_SPEED * 1.3, // Very fast
      maxMoveSpeed: MAX_MOVE_SPEED * 1.3, // High top speed
      kickPower: KICK_POWER * 1.1, // Reduced from 1.2
    },
    trump: {
      jumpForce: JUMP_FORCE * 0.9, // Lower jump
      moveSpeed: MOVE_SPEED * 0.9, // Slower
      maxMoveSpeed: MAX_MOVE_SPEED * 0.9, // Lower top speed
      kickPower: KICK_POWER * 1.3, // Reduced from 1.5
    },
    cz: {
      jumpForce: JUMP_FORCE * 1.0, // Average jump
      moveSpeed: MOVE_SPEED * 1.0, // Average speed
      maxMoveSpeed: MAX_MOVE_SPEED * 1.0, // Average top speed
      kickPower: KICK_POWER * 1.0, // Reduced from 1.1
    },
    sbf: {
      jumpForce: JUMP_FORCE * 0.8, // Poor jump
      moveSpeed: MOVE_SPEED * 1.2, // Good speed
      maxMoveSpeed: MAX_MOVE_SPEED * 1.2, // Good top speed
      kickPower: KICK_POWER * 1.2, // Reduced from 1.3
    },
  }

  // Load selected character
  useEffect(() => {
    // Only access localStorage on the client side
    if (typeof window !== "undefined") {
      const savedCharacter = localStorage.getItem("selectedCharacter")
      if (savedCharacter && Object.keys(characterStats).includes(savedCharacter)) {
        setSelectedCharacter(savedCharacter)
      } else {
        // Default to CR7 if no valid character is saved
        setSelectedCharacter("cr7")
        localStorage.setItem("selectedCharacter", "cr7")
      }
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

  // Get current character stats
  const getCurrentCharacterStats = () => {
    const character = selectedCharacter as keyof typeof characterStats
    return characterStats[character] || characterStats.cr7
  }

  // Handle loading complete
  const handleLoadComplete = () => {
    setIsLoading(false)
    // Add a small delay before showing the game to ensure smooth transition
    setTimeout(() => {
      setGameActive(true)
    }, 300)
  }

  // Game timer
  useEffect(() => {
    if (gameTime > 0 && !gameEnded && gameActive && !isPaused) {
      const timer = setTimeout(() => {
        setGameTime((prev) => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (gameTime === 0 && !gameEnded && gameActive) {
      endGame()
    }
  }, [gameTime, gameEnded, gameActive, isPaused])

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.key]: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.key]: false }))

      // Handle pause toggle on key up to prevent multiple toggles
      // Only allow pausing in practice mode (betAmount === 0)
      if (e.key === "Escape" && betAmount === 0) {
        setIsPaused((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [betAmount])

  // Simplified collision detection between a circle and a rectangle
  const circleRectCollision = (
    circleX: number,
    circleY: number,
    circleRadius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number,
  ) => {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth))
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight))

    // Calculate distance from closest point to circle center
    const distanceX = circleX - closestX
    const distanceY = circleY - closestY
    const distanceSquared = distanceX * distanceX + distanceY * distanceY

    // Check if the distance is less than the circle's radius
    return distanceSquared < circleRadius * circleRadius
  }

  // Function to show kick effect
  const displayKickEffect = (x: number, y: number) => {
    setKickEffectPosition({ x, y })
    setShowKickEffect(true)
    setTimeout(() => {
      setShowKickEffect(false)
    }, 300)
  }

  // Simplified player-ball collision detection
  const checkPlayerBallCollision = (playerX: number, playerY: number, isPlayer1: boolean) => {
    // Ball properties
    const ballX = ballPosition.x
    const ballY = ballPosition.y

    // Player body hitbox (rectangular)
    const playerWidth = 8
    const playerHeight = 10
    const playerLeft = playerX - playerWidth / 2
    const playerTop = playerY - playerHeight / 2

    // Additional head hitbox (positioned above the body)
    const headWidth = 10
    const headHeight = 10
    const headLeft = playerX - headWidth / 2
    const headTop = playerY - playerHeight - headHeight / 2 // Position above the body

    // Check for head collision first (prioritize headers)
    const headCollision = circleRectCollision(ballX, ballY, BALL_RADIUS, headLeft, headTop, headWidth, headHeight)

    // Check for body collision
    const bodyCollision = circleRectCollision(
      ballX,
      ballY,
      BALL_RADIUS,
      playerLeft,
      playerTop,
      playerWidth,
      playerHeight,
    )

    // If either collision is detected
    if (headCollision || bodyCollision) {
      // Calculate direction from player to ball
      const dx = ballX - playerX
      const dy = ballY - playerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Normalize direction
      const dirX = distance > 0 ? dx / distance : 0
      const dirY = distance > 0 ? dy / distance : -1 // Default upward if directly on top

      // Get current time for kick cooldown
      const now = Date.now()

      // Determine kick power
      let kickPower = 3.0 // Base power

      // Check if it's a header (using the head collision detection)
      const isHeader = headCollision

      // Apply character's kick power if kicking
      if (isPlayer1 && keysPressed[" "] && now - lastKick > KICK_COOLDOWN) {
        const stats = getCurrentCharacterStats()
        kickPower = stats.kickPower
        setLastKick(now)

        // Show kick effect at ball position
        displayKickEffect(ballX, ballY)

        // Visual kick effect
        const kickEffectElement = document.createElement("div")
        kickEffectElement.className = "absolute z-10 rounded-full bg-white opacity-30"
        kickEffectElement.style.width = "30px" // Larger effect
        kickEffectElement.style.height = "30px"
        kickEffectElement.style.left = `${ballX}%`
        kickEffectElement.style.top = `${ballY}%`
        kickEffectElement.style.transform = "translate(-50%, -50%)"
        kickEffectElement.style.animation = "kickEffect 0.4s forwards" // Longer animation

        const gameElement = gameCanvasRef.current
        if (gameElement) {
          gameElement.appendChild(kickEffectElement)
          setTimeout(() => {
            if (gameElement.contains(kickEffectElement)) {
              gameElement.removeChild(kickEffectElement)
            }
          }, 400)
        }
      }

      // Apply header boost - give headers more power
      if (isHeader) {
        kickPower *= 1.5 // 50% more power for headers (increased from 40%)

        // Show header effect
        displayKickEffect(ballX, ballY - 2)
      }

      // Calculate new velocity
      const playerVel = isPlayer1 ? player1Velocity : player2Velocity

      // Apply kick in the direction from player to ball
      const newVelX = dirX * kickPower + playerVel.x * 0.2

      // Always give some upward velocity, more if kicking or heading
      const upwardBoost = isPlayer1 && keysPressed[" "] ? -1.8 : isHeader ? -2.0 : -1.2
      const newVelY = Math.min(dirY * kickPower, upwardBoost) + playerVel.y * 0.1

      // Set the new ball velocity
      setBallVelocity({
        x: newVelX * 0.85,
        y: newVelY * 0.85,
      })

      // Move ball slightly away from player to prevent sticking
      setBallPosition((prev) => ({
        x: prev.x + dirX * 0.5,
        y: prev.y + dirY * 0.5,
      }))

      return true
    }

    return false
  }

  // Simplified goal post collision detection
  const checkGoalPostCollision = (ballX: number, ballY: number, ballRadius: number) => {
    // Check all goal parts
    const allGoalParts = [
      LEFT_GOAL_POSTS.leftPost,
      LEFT_GOAL_POSTS.rightPost,
      LEFT_GOAL_POSTS.crossbar,
      RIGHT_GOAL_POSTS.leftPost,
      RIGHT_GOAL_POSTS.rightPost,
      RIGHT_GOAL_POSTS.crossbar,
    ]

    for (const part of allGoalParts) {
      if (circleRectCollision(ballX, ballY, ballRadius, part.x, part.y, part.width, part.height)) {
        // Find the closest point on the rectangle to the circle
        const closestX = Math.max(part.x, Math.min(ballX, part.x + part.width))
        const closestY = Math.max(part.y, Math.min(ballY, part.y + part.height))

        // Calculate direction from closest point to ball center
        const dirX = ballX - closestX
        const dirY = ballY - closestY
        const distance = Math.sqrt(dirX * dirX + dirY * dirY)

        // Normalize direction
        const normalX = distance > 0 ? dirX / distance : 0
        const normalY = distance > 0 ? dirY / distance : -1

        // Determine if it's a vertical or horizontal collision
        const isVertical = Math.abs(normalY) > Math.abs(normalX)

        // Bounce the ball
        if (isVertical) {
          // Vertical collision (top/bottom)
          setBallVelocity((prev) => ({
            x: prev.x * 0.9, // Slight horizontal dampening
            y: -prev.y * 0.8, // Reverse vertical with some energy loss
          }))
        } else {
          // Horizontal collision (left/right)
          setBallVelocity((prev) => ({
            x: -prev.x * 0.8, // Reverse horizontal with some energy loss
            y: prev.y * 0.9, // Slight vertical dampening
          }))
        }

        // Move ball slightly away from post to prevent sticking
        setBallPosition((prev) => ({
          x: prev.x + normalX * 0.5,
          y: prev.y + normalY * 0.5,
        }))

        return true
      }
    }

    return false
  }

  // Game physics
  useEffect(() => {
    if (!gameActive || gameEnded || isPaused) return

    // Get character stats
    const characterStats = getCurrentCharacterStats()

    // Initial ball drop at game start
    if (ballPosition.x === 50 && ballPosition.y === 30 && ballVelocity.x === 0 && ballVelocity.y === 0) {
      setBallVelocity({ x: 0, y: 0.85 }) // Start with a gentle drop
    }

    const gameLoop = setInterval(() => {
      // Player 1 movement based on keys pressed
      setPlayer1Velocity((prev) => {
        let newVelX = prev.x
        let newVelY = prev.y

        // Left/Right movement - more direct control, less acceleration
        if (keysPressed["ArrowLeft"]) {
          // More direct control with less acceleration
          newVelX = Math.max(-characterStats.maxMoveSpeed, newVelX - characterStats.moveSpeed)
        } else if (keysPressed["ArrowRight"]) {
          // More direct control with less acceleration
          newVelX = Math.min(characterStats.maxMoveSpeed, newVelX + characterStats.moveSpeed)
        } else {
          // Apply stronger friction when no keys pressed
          newVelX *= FRICTION
        }

        // Jump with up arrow
        if (keysPressed["ArrowUp"] && !player1IsJumping && player1Position.y >= FLOOR_Y) {
          newVelY = characterStats.jumpForce
          setPlayer1IsJumping(true)
        }

        // Apply gravity if in air
        if (player1Position.y < FLOOR_Y || newVelY < 0) {
          newVelY += GRAVITY
        }

        return { x: newVelX, y: newVelY }
      })

      // Update player 1 position
      setPlayer1Position((prev) => {
        let newX = prev.x + player1Velocity.x
        let newY = prev.y + player1Velocity.y

        // Boundary checks
        newX = Math.max(5, Math.min(newX, 95))

        // Floor collision
        if (newY > FLOOR_Y) {
          newY = FLOOR_Y
          setPlayer1Velocity((v) => ({ ...v, y: 0 }))
          setPlayer1IsJumping(false)
        }

        return { x: newX, y: newY }
      })

      // AI for player 2
      setPlayer2Velocity((prev) => {
        let newVelX = prev.x
        let newVelY = prev.y

        // Target ball with some intelligence
        const targetX = ballPosition.x > 50 ? Math.min(ballPosition.x - 5, 85) : Math.max(55, ballPosition.x + 15)

        // Move toward target - more direct control for AI too
        if (player2Position.x < targetX - 2) {
          newVelX = Math.min(MAX_MOVE_SPEED * 0.7, newVelX + MOVE_SPEED * 0.7)
        } else if (player2Position.x > targetX + 2) {
          newVelX = Math.max(-MAX_MOVE_SPEED * 0.7, newVelX - MOVE_SPEED * 0.7)
        } else {
          newVelX *= FRICTION
        }

        // Jump if ball is above
        if (
          ballPosition.y < player2Position.y - 10 &&
          Math.abs(ballPosition.x - player2Position.x) < 20 &&
          !player2IsJumping &&
          player2Position.y >= FLOOR_Y &&
          Math.random() < 0.05
        ) {
          newVelY = JUMP_FORCE
          setPlayer2IsJumping(true)
        }

        // Apply gravity if in air
        if (player2Position.y < FLOOR_Y || newVelY < 0) {
          newVelY += GRAVITY
        }

        return { x: newVelX, y: newVelY }
      })

      // Update player 2 position
      setPlayer2Position((prev) => {
        let newX = prev.x + player2Velocity.x
        let newY = prev.y + player2Velocity.y

        // Boundary checks
        newX = Math.max(5, Math.min(newX, 95))

        // Floor collision
        if (newY > FLOOR_Y) {
          newY = FLOOR_Y
          setPlayer2Velocity((v) => ({ ...v, y: 0 }))
          setPlayer2IsJumping(false)
        }

        return { x: newX, y: newY }
      })

      // Ball physics - apply gravity and air resistance
      setBallVelocity((prev) => {
        return {
          x: prev.x * BALL_AIR_RESISTANCE,
          y: prev.y + GRAVITY * BALL_GRAVITY_FACTOR,
        }
      })

      // Update ball position with simplified collision handling
      setBallPosition((prev) => {
        // Calculate new position based on velocity
        let newX = prev.x + ballVelocity.x
        let newY = prev.y + ballVelocity.y

        // Check for goal post collisions first
        const hitPost = checkGoalPostCollision(newX, newY, BALL_RADIUS)

        // Check for player-ball collisions before finalizing position
        // This helps catch collisions that might be missed in the main collision check
        const hitPlayer1 = checkPlayerBallCollision(player1Position.x, player1Position.y, true)
        const hitPlayer2 = checkPlayerBallCollision(player2Position.x, player2Position.y, false)

        // If a collision occurred, return the updated position from those functions
        if (hitPlayer1 || hitPlayer2) {
          return { x: newX, y: newY }
        }

        if (!hitPost) {
          // Check for goals - UPDATED GOAL DETECTION LOGIC
          let isGoal = false
          let team = ""

          // Left goal detection - ball must fully cross the goal line
          // The ball's leftmost edge (center - radius) must be less than or equal to the goal line
          if (newX - BALL_RADIUS <= LEFT_GOAL_LINE && newY > GOAL_TOP && newY < FLOOR_Y) {
            // Check if the ball was coming from the right side of the goal line
            if (prev.x - BALL_RADIUS > LEFT_GOAL_LINE) {
              isGoal = true
              team = teamB
              setPlayer2Score((s) => s + 1)
            }
          }
          // Right goal detection - ball must fully cross the goal line
          // The ball's rightmost edge (center + radius) must be greater than or equal to the goal line
          else if (newX + BALL_RADIUS >= RIGHT_GOAL_LINE && newY > GOAL_TOP && newY < FLOOR_Y) {
            // Check if the ball was coming from the left side of the goal line
            if (prev.x + BALL_RADIUS < RIGHT_GOAL_LINE) {
              isGoal = true
              team = teamA
              setPlayer1Score((s) => s + 1)
            }
          }

          // Handle goal
          if (isGoal) {
            // Show goal text
            setScoringTeam(team)
            setShowGoalText(true)

            // Hide goal text after 3 seconds
            setTimeout(() => {
              setShowGoalText(false)
            }, 3000)

            // Reset ball position immediately
            newX = 50
            newY = 30
            setBallVelocity({ x: 0, y: 0.5 })

            // Reset bounce count
            if (ballRef.current) {
              ballRef.current.bounceCount = 0
            }
          } else {
            // Wall collisions
            if (newX - BALL_RADIUS < 0) {
              // Left wall
              newX = BALL_RADIUS
              setBallVelocity((v) => ({ x: Math.abs(v.x) * 0.8, y: v.y }))
            } else if (newX + BALL_RADIUS > 100) {
              // Right wall
              newX = 100 - BALL_RADIUS
              setBallVelocity((v) => ({ x: -Math.abs(v.x) * 0.8, y: v.y }))
            }

            // Ceiling collision
            if (newY - BALL_RADIUS < 0) {
              newY = BALL_RADIUS
              setBallVelocity((v) => ({ x: v.x, y: Math.abs(v.y) * 0.8 }))
            }

            // Floor collision
            if (newY + BALL_RADIUS > FLOOR_Y) {
              newY = FLOOR_Y - BALL_RADIUS

              // Track bounce count for the ball
              const currentBounceCount = ballRef.current?.bounceCount || 0

              // Check if this is a low-energy bounce
              if (Math.abs(ballVelocity.y) < 0.5) {
                setBallVelocity((v) => ({ x: v.x * 0.95, y: 0 })) // Stop bouncing
              } else {
                // First two bounces maintain full height, then start reducing
                const bounceFactor = currentBounceCount < 2 ? 0.99 : BALL_BOUNCE_FACTOR
                setBallVelocity((v) => ({ x: v.x * 0.95, y: -Math.abs(v.y) * bounceFactor }))

                // Increment bounce count
                if (ballRef.current) {
                  ballRef.current.bounceCount = currentBounceCount + 1
                }
              }
            }
          }
        }

        return { x: newX, y: newY }
      })

      // Check for player-ball collisions
      checkPlayerBallCollision(player1Position.x, player1Position.y, true)
      checkPlayerBallCollision(player2Position.x, player2Position.y, false)

      // Check for win condition
      if (player1Score >= 5 || player2Score >= 5) {
        endGame()
      }
    }, 16) // ~60fps for smooth animation

    return () => {
      clearInterval(gameLoop)
    }
  }, [
    gameActive,
    ballPosition,
    ballVelocity,
    player1Position,
    player2Position,
    player1Velocity,
    player2Velocity,
    player1IsJumping,
    player2IsJumping,
    keysPressed,
    lastKick,
    gameEnded,
    isPaused,
    selectedCharacter,
    teamA,
    teamB,
  ])

  // Add this function to the component to check match status
  useEffect(() => {
    if (matchId && playerPublicKey) {
      const checkMatchStatus = async () => {
        try {
          // Import the function to get match details
          const { getMatchDetails } = await import("@/lib/matchmaking-service");

          const { match, error } = await getMatchDetails(matchId);
          if (error) {
            console.error("Error checking match status:", error);
            return;
          }

          if (match) {
            // Determine if we're player 1 or player 2
            const isPlayer1 = match.player1PublicKey === playerPublicKey;

            // Set the opponent
            const opponentKey = isPlayer1 ? match.player2PublicKey : match.player1PublicKey;

            // If the opponent has a real public key (not the simulated one)
            if (opponentKey && !opponentKey.startsWith('opponent_')) {
              console.log(`Playing against ${opponentKey.slice(0, 6)}...`);

              // Here we might implement real-time game synchronization
              // For the current scope, we just make sure the display is correct

              // Update the team names if needed
              if (teamB === 'OPPONENT') {
                setTeamB(opponentKey.slice(0, 6) + '...');
              }
            }
          }
        } catch (error) {
          console.error("Error in match status check:", error);
        }
      };

      // Check immediately and then every 5 seconds
      checkMatchStatus();
      const interval = setInterval(checkMatchStatus, 5000);

      return () => clearInterval(interval);
    }
  }, [matchId, playerPublicKey, teamB]);

  const endGame = () => {
    setGameEnded(true)

    let winnerPublicKey: string | null = null

    if (player1Score > player2Score) {
      setWinner("You")
      winnerPublicKey = playerPublicKey || null
    } else if (player2Score > player1Score) {
      setWinner("Opponent")
      winnerPublicKey = null // In a real implementation, this would be the opponent's public key
    } else {
      setWinner("Draw")
      // In a draw, both players get their bets back
      winnerPublicKey = playerPublicKey || null
    }

    // If this is a real match (not practice mode) and there's a winner
    if (matchId && winnerPublicKey && betAmount > 0) {
      // Update the match result in the matchmaking service
      const updateMatchResult = async () => {
        try {
          const { completeMatch } = await import("@/lib/matchmaking-service");
          const { success, error } = await completeMatch(matchId, winnerPublicKey!);

          if (error) {
            console.error("Error completing match:", error);
            toast({
              title: "Error updating match result",
              description: error,
              variant: "destructive",
            });
            return;
          }

          if (success) {
            console.log("Match result updated successfully");

            // Now process the payout
            await processPayout();
          }
        } catch (error) {
          console.error("Error updating match result:", error);
        }
      };

      updateMatchResult();
    }
  }

  const processPayout = async () => {
    setIsProcessingPayout(true)

    try {
      if (!playerPublicKey || !matchId) {
        throw new Error("Missing player public key or match ID")
      }

      // In a real implementation, this would call the backend to process the payout
      const processPayout = async (playerPublicKey: string, amount: number) => {
        // Simulate a successful payout
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, error: null })
          }, 1000)
        })
      }
      const { success, error } = await processPayout(playerPublicKey, betAmount * 2)

      if (error) {
        throw new Error(error)
      }

      setPayoutComplete(true)
    } catch (error) {
      console.error("Error processing payout:", error)
      toast({
        title: "Error processing payout",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayout(false)
    }
  }

  const toggleMute = () => {
    setMuted((prev) => !prev)
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  // Render the appropriate character based on selection
  const renderPlayer1Character = () => {
    switch (selectedCharacter) {
      case "pessi":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <PessiCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "mbappe":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <MbappeCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "neymar":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <NeymarCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "trump":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <TrumpCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "cz":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <CZCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "sbf":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <SBFCharacter
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "cr7":
      default:
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <CR7Character
              isKicking={keysPressed[" "]}
              direction={keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"] ? "left" : "right"}
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
    }
  }

  // Render the appropriate character for the opponent
  const renderPlayer2Character = () => {
    switch (opponentCharacter) {
      case "pessi":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <PessiCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "mbappe":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <MbappeCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "neymar":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <NeymarCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "trump":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <TrumpCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "cz":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <CZCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "sbf":
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <SBFCharacter
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
      case "cr7":
      default:
        return (
          <div className="absolute bottom-[15%] left-1/2 w-[130%] h-[130%] transform -translate-x-1/2">
            <CR7Character
              isKicking={false}
              direction="left"
              priority
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.5))",
              }}
            />
          </div>
        )
    }
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
    <>
      {isLoading && <GameLoadingScreen onLoadComplete={handleLoadComplete} betAmount={betAmount} />}

      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-lg overflow-hidden"
          >
            {/* Game UI - Sports Heads Style with flat ground */}
            <div ref={gameCanvasRef} className="relative w-full aspect-video bg-[#87CEEB]">
              {/* Game background - using the new stadium image */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Stadium background image */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/solana-stadium-background.png"
                    alt="Stadium Background"
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>

                {/* Left Goal - ensure it's on top of the background */}
                <div className="absolute bottom-0 left-0 w-[12%] h-[75%] z-10">
                  <Image
                    src="/images/left-goal.png"
                    alt="Left Goal"
                    fill
                    style={{ objectFit: "fill", objectPosition: "left bottom" }}
                    priority
                  />
                </div>

                {/* Right Goal - ensure it's on top of the background */}
                <div className="absolute bottom-0 right-0 w-[12%] h-[75%] z-10">
                  <Image
                    src="/images/right-goal.png"
                    alt="Right Goal"
                    fill
                    style={{ objectFit: "fill", objectPosition: "right bottom" }}
                    priority
                  />
                </div>
              </div>

              {/* Score and timer overlay */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center bg-black text-white p-2">
                <div className="flex flex-col items-center">
                  <GameText variant="subheading" color="white" className="text-red-500">
                    {teamA}
                  </GameText>
                  <GameText variant="heading" className="text-3xl">
                    {player1Score}
                  </GameText>
                </div>

                <div className="bg-black px-4 py-1 rounded-b-lg">
                  <GameText variant="heading" className="text-xl">
                    {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, "0")}
                  </GameText>
                </div>

                <div className="flex flex-col items-center">
                  <GameText variant="subheading" color="white" className="text-red-500">
                    {teamB}
                  </GameText>
                  <GameText variant="heading" className="text-3xl">
                    {player2Score}
                  </GameText>
                </div>
              </div>

              {/* Goal notification */}
              <AnimatePresence>
                {showGoalText && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-16 left-0 right-0 z-20 flex justify-center"
                  >
                    <div className="bg-yellow-500 text-white font-bold text-3xl px-8 py-2 rounded-md shadow-lg">
                      <GameText variant="heading">GOAL! {scoringTeam} SCORES!</GameText>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game elements */}
              {!gameEnded && (
                <>
                  {/* Player 1 */}
                  <div
                    className="absolute w-[8%] aspect-square"
                    style={{
                      left: `${player1Position.x}%`,
                      top: `${player1Position.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative w-full h-full">
                      {/* Body */}
                      <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-blue-600 transform -translate-x-1/2 rounded-md"></div>

                      {/* Head - render based on selected character */}
                      {renderPlayer1Character()}
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div
                    className="absolute w-[8%] aspect-square"
                    style={{
                      left: `${player2Position.x}%`,
                      top: `${player2Position.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative w-full h-full">
                      {/* Body */}
                      <div className="absolute bottom-0 left-1/2 w-[40%] h-[20%] bg-red-600 transform -translate-x-1/2 rounded-md"></div>

                      {/* Head */}
                      {renderPlayer2Character()}
                    </div>
                  </div>

                  {/* Ball - Using the selected ball image */}
                  <div
                    className="absolute w-[6.05%] aspect-square"
                    style={{
                      left: `${ballPosition.x}%`,
                      top: `${ballPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {/* Ball shadow */}
                    <div
                      className="absolute w-full h-[20%] bg-black rounded-full bottom-[-10%] left-0"
                      style={{
                        transform: `scale(${Math.max(0, 1 - (FLOOR_Y - ballPosition.y) / 100)}, 0.3)`,
                        filter: "blur(1px)",
                        opacity: 0.1,
                      }}
                    ></div>

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

                  {/* Kick effect */}
                  {showKickEffect && (
                    <div
                      className="absolute z-20"
                      style={{
                        left: `${kickEffectPosition.x}%`,
                        top: `${kickEffectPosition.y}%`,
                        width: "40px",
                        height: "40px",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full animate-ping"
                        style={{
                          background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)",
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Goal line indicators (for debugging) */}
                  <div
                    className="absolute bg-red-500 opacity-20 pointer-events-none"
                    style={{
                      left: `${LEFT_GOAL_LINE}%`,
                      top: `${GOAL_TOP}%`,
                      width: "1px",
                      height: `${FLOOR_Y - GOAL_TOP}%`,
                    }}
                  ></div>
                  <div
                    className="absolute bg-red-500 opacity-20 pointer-events-none"
                    style={{
                      left: `${RIGHT_GOAL_LINE}%`,
                      top: `${GOAL_TOP}%`,
                      width: "1px",
                      height: `${FLOOR_Y - GOAL_TOP}%`,
                    }}
                  ></div>
                </>
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2 flex justify-between items-center">
                {/* Sound toggle */}
                <button onClick={toggleMute} className="bg-gray-700 p-2 rounded-md">
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Bet amount display (if applicable) */}
                {betAmount > 0 && (
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 text-yellow-400 mr-1" />
                    <GameText variant="subheading" className="text-sm text-yellow-400">
                      {betAmount * 2} SOL
                    </GameText>
                  </div>
                )}

                {/* Pause button - only in practice mode */}
                {betAmount === 0 && (
                  <button
                    onClick={togglePause}
                    className="bg-green-700 px-3 py-1 rounded-md uppercase text-sm font-bold"
                  >
                    <GameText variant="subheading" className="text-sm">
                      {isPaused ? "Resume" : "Pause"}
                    </GameText>
                  </button>
                )}
              </div>

              {/* Pause overlay */}
              {isPaused && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="bg-gray-800 p-6 rounded-lg text-white text-center">
                    <GameText variant="heading" className="mb-4">
                      Game Paused
                    </GameText>
                    <Button onClick={togglePause} className="bg-green-700 hover:bg-green-800">
                      <GameText variant="subheading">Resume Game</GameText>
                    </Button>
                  </div>
                </div>
              )}

              {/* Game over overlay */}
              {gameEnded && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full text-center text-white">
                    <GameText variant="heading" className="mb-4">
                      {winner === "You" ? "🎉 You Won! 🎉" : winner === "Opponent" ? "😢 You Lost" : "🤝 It's a Draw"}
                    </GameText>

                    <GameText variant="heading" className="mb-6">
                      Final Score: {player1Score} - {player2Score}
                    </GameText>

                    {winner === "You" && betAmount > 0 && (
                      <div className="mb-6">
                        <div className="text-yellow-400 flex items-center justify-center gap-2 text-xl font-bold">
                          <Coins className="h-5 w-5" />
                          <GameText variant="heading" color="yellow">
                            {betAmount * 2} SOL
                          </GameText>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Your winnings</div>
                      </div>
                    )}

                    {winner === "You" && !payoutComplete && betAmount > 0 ? (
                      <Button
                        onClick={processPayout}
                        disabled={isProcessingPayout}
                        className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                      >
                        <GameText variant="subheading">
                          {isProcessingPayout ? "Processing Payout..." : "Claim Winnings"}
                        </GameText>
                      </Button>
                    ) : (
                      <div className="mb-4">
                        {winner === "You" && payoutComplete && betAmount > 0 ? (
                          <div className="text-green-400 mb-4">
                            <GameText variant="subheading" className="text-green-400">
                              Payout complete! Funds have been sent to your wallet.
                            </GameText>
                          </div>
                        ) : winner === "Opponent" && betAmount > 0 ? (
                          <div className="text-gray-400 mb-4">
                            <GameText variant="subheading" className="text-gray-400">
                              Better luck next time!
                            </GameText>
                          </div>
                        ) : betAmount > 0 ? (
                          <div className="text-gray-400 mb-4">
                            <GameText variant="subheading" className="text-gray-400">
                              Bet has been returned to your wallet.
                            </GameText>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <Button asChild variant="outline" className="w-full">
                      <Link href="/play">
                        <GameText variant="subheading">Play Again</GameText>
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
