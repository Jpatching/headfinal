"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import GameText from "@/components/game-text"
import GameComponent from "@/components/game-component"
import { motion } from "framer-motion"
import GameHeader from "@/components/game-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"

export default function DirectMatchPage() {
  const { matchId } = useParams() as { matchId: string }
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get wallet public key if connected
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null)
  
  useEffect(() => {
    // Check if wallet is connected
    const checkWallet = async () => {
      try {
        // In a production environment, this would check if the wallet is already connected
        const walletAdapter = await (await import("@/lib/solana-wallet")).getWalletAdapter();
        
        if (walletAdapter && walletAdapter.publicKey) {
          setWalletPublicKey(walletAdapter.publicKey.toString());
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      }
    };
    
    checkWallet();
  }, []);
  
  // Fetch match details
  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/game/${matchId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load match details");
        }
        
        const data = await response.json();
        setMatch(data);
      } catch (error) {
        console.error("Error fetching match:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);
  
  // Determine if current wallet is player1 or player2
  const isPlayer1 = walletPublicKey && match?.player1 === walletPublicKey;
  const isPlayer2 = walletPublicKey && match?.player2 === walletPublicKey;
  const isParticipant = isPlayer1 || isPlayer2;
  
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
        <Link href="/play" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <GameText variant="subheading">Back to Play</GameText>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Game header */}
          <motion.div className="w-full mb-6">
            <GameHeader title="DIRECT MATCH" />
          </motion.div>

          {loading ? (
            <div className="text-center py-10">
              <GameText variant="heading">Loading match...</GameText>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6 border-red-500 bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !match ? (
            <Alert variant="destructive" className="mb-6 border-red-500 bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Match Not Found</AlertTitle>
              <AlertDescription>The requested match could not be found</AlertDescription>
            </Alert>
          ) : (
            <>
              {!isParticipant && walletPublicKey && (
                <Alert className="mb-6 border-yellow-500 bg-yellow-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    You are not a participant in this match. You are viewing as a spectator.
                  </AlertDescription>
                </Alert>
              )}
              
              {!walletPublicKey && (
                <Alert className="mb-6 border-yellow-500 bg-yellow-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Wallet Connected</AlertTitle>
                  <AlertDescription>
                    Connect your wallet to participate in this match.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="bg-blue-900/50 backdrop-blur-sm p-4 rounded-lg border border-blue-800 mb-6 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <GameText variant="subheading" className="text-blue-300">Match ID</GameText>
                    <GameText variant="body">{match.id}</GameText>
                  </div>
                  <div>
                    <GameText variant="subheading" className="text-blue-300">Bet Amount</GameText>
                    <GameText variant="body">{match.betAmount} SOL</GameText>
                  </div>
                  <div>
                    <GameText variant="subheading" className="text-blue-300">Player 1</GameText>
                    <GameText variant="body">{`${match.player1.slice(0, 6)}...${match.player1.slice(-4)}`}</GameText>
                  </div>
                  <div>
                    <GameText variant="subheading" className="text-blue-300">Player 2</GameText>
                    <GameText variant="body">{`${match.player2.slice(0, 6)}...${match.player2.slice(-4)}`}</GameText>
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <GameComponent
                  betAmount={Number(match.betAmount)}
                  teamA={isPlayer1 ? "YOU" : `PLAYER 1`}
                  teamB={isPlayer2 ? "YOU" : `PLAYER 2`}
                  matchId={match.id}
                  playerPublicKey={walletPublicKey}
                />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  )
}
