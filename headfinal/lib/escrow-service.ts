import { PublicKey, Transaction } from "@solana/web3.js";

// Escrow status types
export type EscrowStatus = "pending" | "active" | "completed" | "cancelled" | "refunded";

// Escrow account structure
export interface EscrowAccount {
  id: string;
  matchId: string;
  playerPublicKey: string;
  amount: number;
  status: EscrowStatus;
  createdAt: number;
  updatedAt: number;
}

// Create a new escrow for a match
export async function createEscrow(
  playerPublicKey: string,
  matchId: string,
  amount: number
): Promise<{ escrow: EscrowAccount | null; signature: string | null; error: string | null }> {
  try {
    const response = await fetch("/api/escrow/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerPublicKey,
        matchId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create escrow");
    }

    return {
      escrow: data.escrow,
      signature: data.signature,
      error: null,
    };
  } catch (error) {
    console.error("Error creating escrow:", error);
    return {
      escrow: null,
      signature: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Complete an escrow and transfer funds to the winner
export async function completeEscrow(
  matchId: string,
  winnerPublicKey: string
): Promise<{ success: boolean; signature: string | null; error: string | null }> {
  try {
    const response = await fetch("/api/escrow/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        winnerPublicKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to complete escrow");
    }

    return {
      success: true,
      signature: data.signature,
      error: null,
    };
  } catch (error) {
    console.error("Error completing escrow:", error);
    return {
      success: false,
      signature: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get escrow status
export async function getEscrowStatus(
  matchId: string
): Promise<{ escrow: EscrowAccount | null; error: string | null }> {
  try {
    const response = await fetch(`/api/escrow/status?matchId=${matchId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get escrow status");
    }

    return {
      escrow: data.escrow,
      error: null,
    };
  } catch (error) {
    console.error("Error getting escrow status:", error);
    return {
      escrow: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Refund an escrow (in case of a draw or cancellation)
export async function refundEscrow(
  matchId: string,
  playerPublicKey: string
): Promise<{ success: boolean; signature: string | null; error: string | null }> {
  try {
    const response = await fetch("/api/escrow/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        playerPublicKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to refund escrow");
    }

    return {
      success: true,
      signature: data.signature,
      error: null,
    };
  } catch (error) {
    console.error("Error refunding escrow:", error);
    return {
      success: false,
      signature: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get escrow transaction details
export async function getEscrowTransaction(
  matchId: string
): Promise<{ transaction: Transaction | null; escrowId: string | null; error: string | null }> {
  try {
    const response = await fetch(`/api/escrow/transaction?matchId=${matchId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get escrow transaction");
    }

    // Deserialize the transaction - handle both potential formats
    const serializedTransaction = data.serializedTransaction;
    let transaction;

    try {
      // First try to deserialize as a complete transaction
      transaction = Transaction.from(Buffer.from(serializedTransaction, "base64"));
    } catch (error) {
      // If that fails, try to deserialize as a transaction message
      const { Message } = await import("@solana/web3.js");
      const message = Message.from(Buffer.from(serializedTransaction, "base64"));
      transaction = Transaction.populate(message, []);
    }

    return {
      transaction,
      escrowId: data.escrowId,
      error: null,
    };
  } catch (error) {
    console.error("Error getting escrow transaction:", error);
    return {
      transaction: null,
      escrowId: null,
      error: error instanceof Error ? error.message : "Unknown error getting escrow transaction",
    };
  }
}

// Cancel escrow and refund player
export async function cancelEscrow(
  escrowId: string,
  playerPublicKey: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch("/api/escrow/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        escrowId,
        playerPublicKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to cancel escrow",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error cancelling escrow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error cancelling escrow",
    };
  }
}

// Max retry count for transaction verification
const MAX_VERIFICATION_RETRIES = 5;
const VERIFICATION_RETRY_DELAY = 2000; // 2 seconds

// Process escrow transaction with retry logic
export async function processEscrowTransaction(
  matchId: string,
  winnerPublicKey: string,
  amount: number
): Promise<{ success: boolean; signature: string | null; error: string | null }> {
  try {
    // Add retry logic for API calls
    let retries = 0;
    let lastError = null;

    while (retries < 3) {
      try {
        const response = await fetch("/api/escrow/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchId,
            winnerPublicKey,
            amount,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process escrow transaction");
        }

        // Verify the transaction was actually confirmed
        if (data.signature) {
          const verificationResult = await verifyTransactionWithRetry(
            data.signature,
            winnerPublicKey,
            amount
          );

          if (!verificationResult.verified) {
            throw new Error(verificationResult.error || "Transaction verification failed");
          }
        }

        return {
          success: true,
          signature: data.signature,
          error: null,
        };
      } catch (err) {
        lastError = err;
        retries++;
        if (retries < 3) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("Failed after multiple attempts");
  } catch (error) {
    console.error("Error processing escrow transaction:", error);
    return {
      success: false,
      signature: null,
      error: error instanceof Error ? error.message : "Unknown error processing escrow",
    };
  }
}

// Helper function to verify transaction with retries
async function verifyTransactionWithRetry(
  signature: string,
  receiverPublicKey: string,
  expectedAmount: number
): Promise<{ verified: boolean; error: string | null }> {
  let retries = 0;

  while (retries < MAX_VERIFICATION_RETRIES) {
    try {
      const response = await fetch(
        `/api/transactions/verify?signature=${signature}&receiver=${receiverPublicKey}&amount=${expectedAmount}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (data.verified) {
        return { verified: true, error: null };
      }

      // If not verified yet but still processing, retry
      if (data.status === "processing") {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, VERIFICATION_RETRY_DELAY));
        continue;
      }

      // If definitively failed
      return { verified: false, error: data.error || "Transaction could not be verified" };
    } catch (error) {
      retries++;
      if (retries >= MAX_VERIFICATION_RETRIES) {
        return {
          verified: false,
          error: error instanceof Error ? error.message : "Transaction verification failed after retries",
        };
      }
      await new Promise((resolve) => setTimeout(resolve, VERIFICATION_RETRY_DELAY));
    }
  }

  return { verified: false, error: "Transaction verification timed out" };
}
