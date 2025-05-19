import { NextRequest, NextResponse } from "next/server"
import { createTransferTransaction } from "@/lib/solana-helpers"

export async function POST(req: NextRequest) {
  try {
    const { matchId, winnerPublicKey, amount } = await req.json()
    
    if (!matchId || !winnerPublicKey || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }
    
    // Process the payout
    const { signature, error } = await createTransferTransaction(winnerPublicKey, amount)
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      signature,
      matchId
    })
  } catch (error) {
    console.error("Error processing escrow:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error processing escrow" },
      { status: 500 }
    )
  }
}
