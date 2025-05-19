// This file would contain the actual Solana integration code
// For brevity, I'm providing a simplified version with the core functions

import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, Keypair, SendOptions, ConfirmOptions } from "@solana/web3.js"
import { decode } from "bs58"

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://mainnet.helius-rpc.com/?api-key=ea821ec4-384d-47b4-b870-80036548cd71"
const ESCROW_PRIVATE_KEY = process.env.ESCROW_PRIVATE_KEY || ""

// Constants for transaction handling
const TRANSACTION_FEE_BUFFER = 0.000005 // ~5000 lamports buffer for transaction fees
const CONFIRMATION_COMMITMENT: ConfirmOptions = {
  commitment: 'confirmed',
  preflightCommitment: 'processed',
  skipPreflight: false
}

// Get connection instance
export const getConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
}

// Convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

// Convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL
}

// Validate a Solana public key
export const isValidPublicKey = (publicKey: string): boolean => {
  try {
    new PublicKey(publicKey)
    return true
  } catch (error) {
    return false
  }
}

// Convert transaction to base64 string
export const serializeTransaction = (transaction: Transaction): string => {
  // If the transaction is already signed, use serialize()
  // Otherwise, use serializeMessage() to get just the message
  if (transaction.signatures.some(sig => sig.signature !== null)) {
    return Buffer.from(transaction.serialize()).toString("base64")
  } else {
    return Buffer.from(transaction.serializeMessage()).toString("base64")
  }
}

// Get escrow keypair (server-side only)
export const getEscrowKeypair = (): Keypair | null => {
  if (!ESCROW_PRIVATE_KEY || typeof ESCROW_PRIVATE_KEY !== 'string' || ESCROW_PRIVATE_KEY.length === 0) {
    console.error("Escrow private key not configured")
    return null
  }
  
  try {
    // Convert base58 private key to Uint8Array
    const privateKeyBytes = decode(ESCROW_PRIVATE_KEY)
    return Keypair.fromSecretKey(privateKeyBytes)
  } catch (error) {
    console.error("Error creating escrow keypair:", error)
    return null
  }
}

// Convert SOL to lamports with fee buffer
export const solToLamportsWithFee = (sol: number): number => {
  return Math.floor((sol - TRANSACTION_FEE_BUFFER) * LAMPORTS_PER_SOL)
}

// Create a transfer transaction from escrow to winner with improved confirmation
export const createTransferTransaction = async (
  winnerPublicKey: string,
  amount: number
): Promise<{ signature: string | null; error: string | null }> => {
  try {
    const connection = getConnection()
    const escrowKeypair = getEscrowKeypair()
    
    if (!escrowKeypair) {
      return { signature: null, error: "Escrow keypair not available" }
    }
    
    // Check if escrow has enough balance
    const escrowBalance = await connection.getBalance(escrowKeypair.publicKey)
    const transferAmount = solToLamportsWithFee(amount)
    
    if (escrowBalance < transferAmount) {
      return { signature: null, error: `Insufficient escrow balance: ${lamportsToSol(escrowBalance)} SOL` }
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: new PublicKey(winnerPublicKey),
        lamports: transferAmount
      })
    )

    // Get the latest blockhash with retry logic
    const getBlockhashWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await connection.getLatestBlockhash('confirmed')
        } catch (err) {
          if (i === retries - 1) throw err
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      throw new Error("Failed to get blockhash after retries")
    }
    
    const { blockhash, lastValidBlockHeight } = await getBlockhashWithRetry()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = escrowKeypair.publicKey

    // Sign the transaction with the escrow private key
    transaction.sign(escrowKeypair)

    // Send the transaction with improved options
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed'
    })

    // Wait for confirmation with timeout
    const confirmation = await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed')
    
    if (confirmation.value.err) {
      return { signature: null, error: `Transaction confirmed but failed: ${confirmation.value.err}` }
    }

    return { signature, error: null }
  } catch (error) {
    console.error("Error creating transfer transaction:", error)
    return { 
      signature: null, 
      error: error instanceof Error ? error.message : "Unknown error creating transfer transaction" 
    }
  }
}
