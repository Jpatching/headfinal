import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const matches = await prisma.match.findMany({
      where: status ? { status } : undefined,
      include: {
        player1: {
          select: {
            id: true,
            wallet: true,
            username: true,
            avatar: true,
          }
        },
        player2: {
          select: {
            id: true,
            wallet: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameType, wager, player1Id } = body;

    const match = await prisma.match.create({
      data: {
        gameType,
        wager,
        player1Id,
        status: 'waiting',
      },
      include: {
        player1: {
          select: {
            id: true,
            wallet: true,
            username: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
} 