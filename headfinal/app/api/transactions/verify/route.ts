import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://mainnet.helius-rpc.com/?api-key=ea821ec4-384d-47b4-b870-80036548cd71"

// Get connection instance
const getConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { txHash, receiver, amount: amountStr } = data;
    
    if (!txHash) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction hash is required' },
        { status: 400 }
      );
    }
    
    const connection = getConnection()
    
    // Get transaction details
    try {
      const txInfo = await connection.getTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })
      
      if (!txInfo) {
        return NextResponse.json({
          verified: false,
          status: "processing",
          error: "Transaction not found yet, it may still be processing"
        })
      }
      
      if (txInfo.meta?.err) {
        return NextResponse.json({
          verified: false,
          error: `Transaction failed: ${JSON.stringify(txInfo.meta.err)}`
        })
      }
      
      // Verify the transaction was a transfer to the expected receiver
      const receiverPubkey = new PublicKey(receiver)
      let transferFound = false
      
      if (txInfo.meta?.postTokenBalances && txInfo.meta?.preTokenBalances) {
        // For token transfers
        // Implementation would go here for token transfers
      } else if (txInfo.meta?.postBalances && txInfo.meta?.preBalances) {
        // For SOL transfers
        const accountKeys = txInfo.transaction.message.getAccountKeys().staticAccountKeys
        
        for (let i = 0; i < accountKeys.length; i++) {
          if (accountKeys[i].equals(receiverPubkey)) {
            const preBalance = txInfo.meta.preBalances[i]
            const postBalance = txInfo.meta.postBalances[i]
            const difference = postBalance - preBalance
            
            // If an amount was specified, verify the amount
            if (amountStr) {
              const expectedAmount = parseFloat(amountStr) * LAMPORTS_PER_SOL
              // Allow a small margin of error for calculation differences
              const margin = 100 // lamports
              if (Math.abs(difference - expectedAmount) <= margin) {
                transferFound = true
                break
              }
            } else if (difference > 0) {
              // If no amount specified, just verify the receiver got something
              transferFound = true
              break
            }
          }
        }
      }
      
      if (transferFound) {
        return NextResponse.json({ verified: true })
      } else {
        return NextResponse.json({
          verified: false,
          error: "Transfer to the specified recipient not found in transaction"
        })
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      return NextResponse.json({
        verified: false,
        error: error instanceof Error ? error.message : "Error verifying transaction"
      })
    }
  } catch (error) {
    console.error("Error in transaction verification endpoint:", error)
    return NextResponse.json(
      { verified: false, error: error instanceof Error ? error.message : "Unknown error verifying transaction" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Extract parameters from URL query
  const searchParams = req.nextUrl.searchParams;
  const signature = searchParams.get('signature');
  const receiver = searchParams.get('receiver');
  const amountStr = searchParams.get('amount');
  
  if (!signature) {
    return NextResponse.json(
      { verified: false, error: 'Transaction signature is required' },
      { status: 400 }
    );
  }
  
  if (!receiver) {
    return NextResponse.json(
      { verified: false, error: 'Receiver public key is required' },
      { status: 400 }
    );
  }
  
  try {
    const connection = getConnection();
    
    // Get transaction details
    const txInfo = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!txInfo) {
      return NextResponse.json({
        verified: false,
        status: "processing",
        error: "Transaction not found yet, it may still be processing"
      });
    }
    
    if (txInfo.meta?.err) {
      return NextResponse.json({
        verified: false,
        error: `Transaction failed: ${JSON.stringify(txInfo.meta.err)}`
      });
    }
    
    // Verify the transaction was a transfer to the expected receiver
    const receiverPubkey = new PublicKey(receiver);
    let transferFound = false;
    
    if (txInfo.meta?.postBalances && txInfo.meta?.preBalances) {
      const accountKeys = txInfo.transaction.message.getAccountKeys().staticAccountKeys;
      
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys[i].equals(receiverPubkey)) {
          const preBalance = txInfo.meta.preBalances[i];
          const postBalance = txInfo.meta.postBalances[i];
          const difference = postBalance - preBalance;
          
          // If an amount was specified, verify the amount
          if (amountStr) {
            const expectedAmount = parseFloat(amountStr) * LAMPORTS_PER_SOL;
            // Allow a small margin of error for calculation differences
            const margin = 100; // lamports
            if (Math.abs(difference - expectedAmount) <= margin) {
              transferFound = true;
              break;
            }
          } else if (difference > 0) {
            // If no amount specified, just verify the receiver got something
            transferFound = true;
            break;
          }
        }
      }
    }
    
    if (transferFound) {
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({
        verified: false,
        error: "Transfer to the specified recipient not found in transaction"
      });
    }
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return NextResponse.json({
      verified: false,
      error: error instanceof Error ? error.message : "Error verifying transaction"
    });
  }
}
