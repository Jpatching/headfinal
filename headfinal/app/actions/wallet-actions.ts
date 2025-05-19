"use server"

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://mainnet.helius-rpc.com/?api-key=ea821ec4-384d-47b4-b870-80036548cd71"
const ESCROW_PUBLIC_KEY = process.env.ESCROW_PUBLIC_KEY

// Get connection instance
const getConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
}

// Create a bet transaction with fee handling
export async function createBetTransaction(
  playerPublicKey: string,
  betAmount: number,
): Promise<{ transaction: string | null; error: string | null }> {
  try {
    if (!ESCROW_PUBLIC_KEY) {
      return {
        transaction: null,
        error: "Escrow public key not configured. Please contact support.",
      }
    }

    const connection = getConnection()
    const fromPubkey = new PublicKey(playerPublicKey)
    const toPubkey = new PublicKey(ESCROW_PUBLIC_KEY)

    // Check if player has sufficient balance (including fee buffer)
    const playerBalance = await connection.getBalance(fromPubkey)
    const lamports = betAmount * LAMPORTS_PER_SOL
    const minimumRequired = lamports + 5000 // Add ~5000 lamports for transaction fee

    if (playerBalance < minimumRequired) {
      return {
        transaction: null,
        error: `Insufficient balance. You need at least ${(minimumRequired/LAMPORTS_PER_SOL).toFixed(6)} SOL (including transaction fees).`,
      }
    }

    // Create a transaction to transfer SOL from player to escrow
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      }),
    )

    // Get the latest blockhash with retry
    let blockhash;
    try {
      const blockHashResult = await connection.getLatestBlockhash('confirmed')
      blockhash = blockHashResult.blockhash
    } catch (error) {
      console.error("Error getting blockhash:", error)
      return {
        transaction: null,
        error: "Failed to get network blockhash. Please try again."
      }
    }

    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    // Serialize the transaction MESSAGE only (not the full transaction)
    // This allows the client to sign it without requiring signatures yet
    const serializedTransaction = Buffer.from(transaction.serializeMessage()).toString("base64")

    return { transaction: serializedTransaction, error: null }
  } catch (error) {
    console.error("Error creating bet transaction:", error)
    return {
      transaction: null,
      error: error instanceof Error ? error.message : "Unknown error creating bet transaction",
    }
  }
}
