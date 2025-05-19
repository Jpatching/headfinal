import { Connection, PublicKey, type Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { toast } from "@/components/ui/use-toast"

// Constants
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"

// Types
export type WalletAdapter = {
  publicKey: PublicKey | null
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  on: (event: string, callback: (args: any) => void) => void
  off: (event: string, callback: (args: any) => void) => void
}

// Connection instance
export const getConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
}

// Check if wallet is installed
export const isWalletInstalled = (): boolean => {
  if (typeof window === "undefined") return false

  // Check for Phantom
  const isPhantomInstalled = window?.phantom?.solana?.isPhantom || false

  // Check for Solflare
  const isSolflareInstalled = window?.solflare?.isSolflare || false

  return isPhantomInstalled || isSolflareInstalled
}

// Get wallet adapter
export const getWalletAdapter = async (): Promise<WalletAdapter | null> => {
  if (typeof window === "undefined") return null

  // Try Phantom first
  if (window?.phantom?.solana) {
    try {
      // Check if wallet is properly installed and initialized
      return window.phantom.solana;
    } catch (error) {
      console.error("Error initializing Phantom:", error);
      return null;
    }
  }

  // Try Solflare next
  if (window?.solflare) {
    try {
      // Check if wallet is properly installed and initialized
      return window.solflare;
    } catch (error) {
      console.error("Error initializing Solflare:", error);
      return null;
    }
  }

  return null
}

// Connect wallet
export const connectWallet = async (): Promise<{ publicKey: string | null; error: string | null }> => {
  try {
    const walletAdapter = await getWalletAdapter()

    if (!walletAdapter) {
      return {
        publicKey: null,
        error: "No wallet adapter found. Please install Phantom or Solflare wallet.",
      }
    }

    await walletAdapter.connect()

    if (walletAdapter.publicKey) {
      // Ensure we're converting the PublicKey object to a string
      const publicKeyStr = walletAdapter.publicKey.toString();
      return {
        publicKey: publicKeyStr,
        error: null,
      }
    } else {
      return {
        publicKey: null,
        error: "Failed to connect wallet. Please try again.",
      }
    }
  } catch (error) {
    console.error("Error connecting wallet:", error)
    return {
      publicKey: null,
      error: error instanceof Error ? error.message : "Unknown error connecting wallet",
    }
  }
}

// Disconnect wallet
export const disconnectWallet = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    const walletAdapter = await getWalletAdapter()

    if (!walletAdapter) {
      return { success: false, error: "No wallet adapter found" }
    }

    await walletAdapter.disconnect()
    return { success: true, error: null }
  } catch (error) {
    console.error("Error disconnecting wallet:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error disconnecting wallet",
    }
  }
}

// Get wallet balance
export const getWalletBalance = async (publicKey: string): Promise<{ balance: number; error: string | null }> => {
  try {
    const connection = getConnection()
    const pubKey = new PublicKey(publicKey)
    const balance = await connection.getBalance(pubKey)

    return {
      balance: balance / LAMPORTS_PER_SOL,
      error: null,
    }
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return {
      balance: 0,
      error: error instanceof Error ? error.message : "Unknown error getting wallet balance",
    }
  }
}

// Send a transaction
export const sendTransaction = async (
  transaction: Transaction,
  options?: { skipPreflight?: boolean }
): Promise<{ signature: string | null; error: string | null }> => {
  try {
    const walletAdapter = await getWalletAdapter()

    if (!walletAdapter) {
      return { signature: null, error: "No wallet adapter found" }
    }

    if (!walletAdapter.publicKey) {
      return { signature: null, error: "Wallet not connected" }
    }

    // The transaction is already signed, just send it
    const connection = getConnection()
    const signature = await connection.sendRawTransaction(
      transaction.serialize(), 
      {
        skipPreflight: options?.skipPreflight || false,
        preflightCommitment: 'processed'
      }
    )

    // Confirm the transaction
    await connection.confirmTransaction(signature, "confirmed")

    return { signature, error: null }
  } catch (error) {
    console.error("Error sending transaction:", error)
    return {
      signature: null,
      error: error instanceof Error ? error.message : "Unknown error sending transaction",
    }
  }
}

// Process payout to winner
export const processPayout = async (
  winnerPublicKey: string,
  amount: number,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Validate that winnerPublicKey is actually a string before using string methods
    if (typeof winnerPublicKey !== 'string') {
      return { 
        success: false, 
        error: "Invalid winner public key format" 
      }
    }
    
    // Import the createTransferTransaction function dynamically to prevent client-side loading
    // of server-only code
    const { createTransferTransaction } = await import("@/lib/solana-helpers")
    
    // Process the actual transfer
    const { signature, error } = await createTransferTransaction(winnerPublicKey, amount)
    
    if (error) {
      console.error("Error processing payout:", error)
      return { success: false, error }
    }
    
    if (!signature) {
      return { success: false, error: "Failed to process payout - no signature returned" }
    }
    
    toast({
      title: "Payout Processed",
      description: `${amount} SOL has been sent to ${winnerPublicKey.slice(0, 6)}...${winnerPublicKey.slice(-4)}`,
    })
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error processing payout:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error processing payout" 
    }
  }
}

// Declare global window type
declare global {
  interface Window {
    phantom?: {
      solana?: WalletAdapter
    }
    solflare?: WalletAdapter & {
      isSolflare: boolean
    }
  }
}
