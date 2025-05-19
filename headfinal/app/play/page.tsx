"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, CoinsIcon } from "lucide-react"
import Link from "next/link"
import GameComponent from "@/components/game-component"
import { motion } from "framer-motion"
import GameHeader from "@/components/game-header"
import GameText from "@/components/game-text"
import { toast } from "@/components/ui/use-toast"
import {
  connectWallet,
  disconnectWallet,
  getWalletBalance,
  sendTransaction,
  isWalletInstalled,
} from "@/lib/solana-wallet"
import { createMatchRequest, findMatch, cancelMatchRequest } from "@/lib/matchmaking-service"
import Image from "next/image"
import { createBetTransaction } from "@/app/actions/wallet-actions"
import { Transaction } from "@solana/web3.js"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

export default function PlayPage() {
  const [betAmount, setBetAmount] = useState("0.1")
  const [isLoading, setIsLoading] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState("0")
  const [opponent, setOpponent] = useState<string | null>(null)
  const [teamName, setTeamName] = useState("SOLANA")
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [isWalletAvailable, setIsWalletAvailable] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)
  const matchFindingInterval = useRef<NodeJS.Timeout | null>(null)

  // Check if wallet is installed
  useEffect(() => {
    setIsWalletAvailable(isWalletInstalled())
  }, [])

  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // In a production environment, this would check if the wallet is already connected
        // and retrieve the wallet's public key and balance
        const walletAdapter = await (await import("@/lib/solana-wallet")).getWalletAdapter();
        
        if (walletAdapter && walletAdapter.publicKey) {
          const publicKeyStr = walletAdapter.publicKey.toString();
          setWalletConnected(true);
          setWalletPublicKey(publicKeyStr);
          
          // Get wallet balance
          const { balance, error: balanceError } = await getWalletBalance(publicKeyStr);
          
          if (balanceError) {
            toast({
              title: "Error getting wallet balance",
              description: balanceError,
              variant: "destructive",
            });
            return;
          }
          
          setWalletBalance(balance.toFixed(2));
        } else {
          // Redirect to home page if wallet is not connected
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        // Redirect to home page if there's an error
        window.location.href = "/";
      }
    };

    checkWalletConnection();
  }, []);

  // Clean up match finding interval on unmount
  useEffect(() => {
    return () => {
      if (matchFindingInterval.current) {
        clearInterval(matchFindingInterval.current)
      }
    }
  }, [])

  // Disconnect wallet
  const handleDisconnectWallet = async () => {
    try {
      const { success, error } = await disconnectWallet()

      if (error) {
        toast({
          title: "Error disconnecting wallet",
          description: error,
          variant: "destructive",
        })
        return
      }

      if (success) {
        setWalletConnected(false)
        setWalletPublicKey(null)
        setWalletBalance("0")

        toast({
          title: "Wallet disconnected",
          description: "Your wallet has been disconnected",
        })
        
        // Redirect to home page after disconnecting
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      toast({
        title: "Error disconnecting wallet",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // Start game with bet
  const handleStartGame = async () => {
    if (!walletConnected || !walletPublicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place a bet",
        variant: "destructive",
      })
      // Redirect to home page if wallet is not connected
      window.location.href = "/";
      return
    }

    if (!betAmount || Number.parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      })
      return
    }

    const betAmountNum = Number.parseFloat(betAmount)

    if (betAmountNum > Number.parseFloat(walletBalance)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough SOL to place this bet",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Ensure we have a clean slate
      if (matchFindingInterval.current) {
        clearInterval(matchFindingInterval.current);
      }
      setMatchRequestId(null);
      
      console.log(`Creating match request for player ${walletPublicKey} with bet amount ${betAmountNum}`);
      
      // 1. Create a match request first (do NOT take funds yet)
      const { matchRequest, error: matchError } = await createMatchRequest(walletPublicKey, betAmountNum)

      if (matchError) {
        console.error(`Error creating match request: ${matchError}`);
        toast({
          title: "Error creating match request",
          description: matchError,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!matchRequest) {
        console.error("Failed to create match request - no request returned");
        toast({
          title: "Error creating match request",
          description: "Failed to create match request",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setMatchRequestId(matchRequest.id)
      setIsFindingMatch(true)
      console.log(`Created match request with ID: ${matchRequest.id}`);

      // 2. Start polling for a match with an increased frequency
      let searchTimeout: NodeJS.Timeout | null = null
      let attemptCount = 0;
      
      matchFindingInterval.current = setInterval(async () => {
        attemptCount++;
        console.log(`Polling for match (attempt ${attemptCount}): ${matchRequest.id}`);
        
        const { match, error: findError } = await findMatch(matchRequest.id)

        if (findError) {
          console.error(`Error finding match (attempt ${attemptCount}): ${findError}`);
          return
        }

        if (match) {
          console.log(`Match found with ID: ${match.id}`);
          
          if (searchTimeout) clearTimeout(searchTimeout);
          if (matchFindingInterval.current) clearInterval(matchFindingInterval.current);
          
          setMatchId(match.id);
          setOpponent(match.player1PublicKey === walletPublicKey ? match.player2PublicKey : match.player1PublicKey);
          setIsFindingMatch(false);
          
          // Here we set gameStarted to true, which will trigger the game component to render
          setGameStarted(true);

          console.log(`Starting game with match ID: ${match.id}`);
          console.log(`Player: ${walletPublicKey}, Opponent: ${match.player1PublicKey === walletPublicKey ? match.player2PublicKey : match.player1PublicKey}`);

          // 3. Only now, after a real match is found, take the user's funds
          try {
            console.log(`Creating bet transaction for ${betAmountNum} SOL`);
            const { transaction: serializedTransaction, error: txError } = await createBetTransaction(
              walletPublicKey,
              betAmountNum,
            )

            if (txError) {
              console.error(`Error creating bet transaction: ${txError}`);
              toast({
                title: "Error creating bet transaction",
                description: txError,
                variant: "destructive",
              })
              setIsLoading(false)
              return
            }

            if (!serializedTransaction) {
              console.error("No serialized transaction returned");
              toast({
                title: "Error creating bet transaction",
                description: "Failed to create transaction",
                variant: "destructive",
              })
              setIsLoading(false)
              return
            }

            // Get the wallet adapter
            const { getWalletAdapter } = await import("@/lib/solana-wallet")
            const walletAdapter = await getWalletAdapter()
            if (!walletAdapter || !walletAdapter.publicKey) {
              console.error("Wallet adapter not available or no public key");
              toast({
                title: "Wallet error",
                description: "Wallet not connected or no public key available",
                variant: "destructive",
              })
              setIsLoading(false)
              return
            }

            // Import the Transaction and Message classes
            const { Transaction, Message, PublicKey } = await import("@solana/web3.js")
            const messageBytes = Buffer.from(serializedTransaction, "base64")
            const message = Message.from(messageBytes)
            const transaction = Transaction.populate(message, [])
            
            console.log("Signing transaction with wallet");
            const signedTransaction = await walletAdapter.signTransaction(transaction)
            
            console.log("Sending signed transaction");
            const { signature, error: sendError } = await sendTransaction(signedTransaction)

            if (sendError) {
              console.error(`Error sending bet transaction: ${sendError}`);
              toast({
                title: "Error sending bet transaction",
                description: sendError,
                variant: "destructive",
              })
              setIsLoading(false)
              return
            }

            if (!signature) {
              console.error("No signature returned from sendTransaction");
              toast({
                title: "Error sending bet transaction",
                description: "Failed to send transaction",
                variant: "destructive",
              })
              setIsLoading(false)
              return
            }

            console.log(`Transaction successful with signature: ${signature}`);
            toast({
              title: "Bet placed successfully",
              description: `Transaction signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
            })
            
          } catch (txError) {
            console.error("Error processing transaction:", txError);
            toast({
              title: "Error processing transaction",
              description: txError instanceof Error ? txError.message : "Unknown error",
              variant: "destructive",
            })
          }
        }
      }, 1000) // Increased frequency to 1 second for faster matching

      // 3. If no match is found in 30 seconds, stop searching and prompt user to try again
      searchTimeout = setTimeout(() => {
        if (matchFindingInterval.current) {
          clearInterval(matchFindingInterval.current)
        }
        setIsFindingMatch(false)
        setMatchRequestId(null)
        console.log("No match found after 30 seconds");
        toast({
          title: "No opponent found",
          description: "No players were found in 30 seconds. Please try searching again.",
          variant: "destructive",
        })
      }, 30000)
    } catch (error) {
      console.error("Error starting game:", error)
      toast({
        title: "Error starting game",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel match finding
  const handleCancelMatchFinding = async () => {
    if (matchFindingInterval.current) {
      clearInterval(matchFindingInterval.current)
    }

    if (matchRequestId) {
      const { success, error } = await cancelMatchRequest(matchRequestId)

      if (error) {
        toast({
          title: "Error cancelling match request",
          description: error,
          variant: "destructive",
        })
      }

      if (success) {
        toast({
          title: "Match request cancelled",
          description: "Your match request has been cancelled",
        })
      }
    }

    setIsFindingMatch(false)
    setMatchRequestId(null)
  }

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

      <div className="w-full max-w-5xl relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <GameText variant="subheading">Back to Home</GameText>
        </Link>

        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Game logo/header - using our new component */}
            <motion.div className="w-full">
              <GameHeader title="BET & PLAY" />
            </motion.div>

            <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-xl p-8 max-w-md w-full shadow-2xl border border-blue-800">
              <div className="flex items-center justify-center mb-6">
                <CoinsIcon className="w-8 h-8 text-yellow-400 mr-3" />
                <GameText variant="heading" className="text-2xl text-yellow-400">
                  Place Your Bet
                </GameText>
              </div>

              <div className="space-y-5 mb-6">
                {/* Wallet Section */}
                <div className="bg-blue-800/50 backdrop-blur-sm rounded-lg p-4 border border-blue-700">
                  <Label htmlFor="wallet-balance" className="block mb-2">
                    <GameText variant="subheading" className="text-sm text-blue-200">
                      Your Wallet
                    </GameText>
                  </Label>
                  <div className="bg-blue-950/70 p-3 rounded-md flex justify-between items-center">
                    <GameText variant="subheading" className="text-base">
                      {walletPublicKey
                        ? `${walletPublicKey.slice(0, 6)}...${walletPublicKey.slice(-4)}`
                        : "Not connected"}
                    </GameText>
                    <Button variant="outline" size="sm" onClick={handleDisconnectWallet} 
                      className="text-xs bg-blue-800 text-white hover:bg-blue-700 border-blue-600">
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Balance Section */}
                <div className="bg-blue-800/50 backdrop-blur-sm rounded-lg p-4 border border-blue-700">
                  <Label htmlFor="wallet-balance" className="block mb-2">
                    <GameText variant="subheading" className="text-sm text-blue-200">
                      Balance
                    </GameText>
                  </Label>
                  <div className="bg-blue-950/70 p-3 rounded-md flex items-center">
                    <CoinsIcon className="w-5 h-5 text-yellow-400 mr-2" />
                    <GameText variant="subheading" className="text-base text-yellow-100">
                      {walletBalance} SOL
                    </GameText>
                  </div>
                </div>

                {/* Bet Amount Selection */}
                <div className="bg-blue-800/50 backdrop-blur-sm rounded-lg p-4 border border-blue-700">
                  <Label htmlFor="bet-amount" className="block mb-2">
                    <GameText variant="subheading" className="text-sm text-blue-200">
                      Bet Amount
                    </GameText>
                  </Label>
                  <Select value={betAmount} onValueChange={setBetAmount}>
                    <SelectTrigger className="bg-blue-950/70 border-blue-700 w-full text-yellow-100">
                      <SelectValue placeholder="Select bet amount" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700">
                      <SelectItem value="0.01">0.01 SOL</SelectItem>
                      <SelectItem value="0.1">0.1 SOL</SelectItem>
                      <SelectItem value="0.2">0.2 SOL</SelectItem>
                      <SelectItem value="0.5">0.5 SOL</SelectItem>
                      <SelectItem value="1">1 SOL</SelectItem>
                      <SelectItem value="2">2 SOL</SelectItem>
                      <SelectItem value="5">5 SOL</SelectItem>
                      <SelectItem value="10">10 SOL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Name */}
                <div className="bg-blue-800/50 backdrop-blur-sm rounded-lg p-4 border border-blue-700">
                  <Label htmlFor="team-name" className="block mb-2">
                    <GameText variant="subheading" className="text-sm text-blue-200">
                      Your Team Name
                    </GameText>
                  </Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-blue-950/70 border-blue-700 text-white placeholder:text-blue-300"
                    maxLength={10}
                    placeholder="Enter team name"
                  />
                </div>

                {/* Finding Match UI */}
                {isFindingMatch ? (
                  <div className="space-y-4">
                    <div className="bg-blue-800/80 p-6 rounded-lg text-center border border-blue-600 shadow-inner">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-25"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-yellow-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        <Loader2 className="h-full w-full animate-pulse text-yellow-400" />
                      </div>
                      <GameText variant="heading" className="mb-2 text-yellow-100">
                        Finding an opponent...
                      </GameText>
                      <p className="text-blue-200 text-sm">
                        Looking for a player betting {betAmount} SOL. This may take a few moments.
                      </p>
                    </div>
                    <Button onClick={handleCancelMatchFinding} variant="outline" 
                      className="w-full bg-blue-800 hover:bg-blue-700 text-white border-blue-700">
                      <GameText variant="subheading" className="text-base">
                        Cancel
                      </GameText>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartGame}
                    disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <GameText variant="subheading" className="text-base">
                          Processing Bet...
                        </GameText>
                      </>
                    ) : (
                      <>
                        <CoinsIcon className="mr-2 h-5 w-5" />
                        <GameText variant="subheading" className="text-base">
                          Place Bet & Find Opponent
                        </GameText>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Instructions Box */}
              <div className="mt-6 bg-blue-800/30 backdrop-blur-sm p-5 rounded-lg border border-blue-700">
                <GameText variant="subheading" className="mb-3 text-yellow-200">
                  How it works
                </GameText>
                <ul className="text-sm text-blue-200 space-y-2 list-disc pl-5">
                  <li>Your bet amount will be held in escrow during the game</li>
                  <li>You'll be matched with a player betting the same amount</li>
                  <li>The winner takes both bets (minus a small platform fee)</li>
                  <li>First to 5 goals or highest score after 2 minutes wins</li>
                  <li>Payouts are processed automatically after the match</li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full">
            <div ref={gameRef} className="rounded-lg overflow-hidden shadow-2xl">
              <GameComponent
                betAmount={Number.parseFloat(betAmount)}
                teamA={teamName}
                teamB="OPPONENT"
                matchId={matchId}
                playerPublicKey={walletPublicKey}
                opponentPublicKey={opponent}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
