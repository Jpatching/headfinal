import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (wallet) {
      // Get specific user by wallet
      const user = await prisma.user.findUnique({
        where: { wallet },
        include: {
          matches1: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              player2: {
                select: { wallet: true, username: true }
              }
            }
          },
          matches2: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              player1: {
                select: { wallet: true, username: true }
              }
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    }

    // Get all users with stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        wallet: true,
        username: true,
        avatar: true,
        totalEarnings: true,
        totalMatches: true,
        wins: true,
        losses: true,
        winRate: true,
        reputation: true,
        createdAt: true,
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: limit,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, username, avatar } = body;

    const user = await prisma.user.upsert({
      where: { wallet },
      update: {
        username: username || undefined,
        avatar: avatar || undefined,
      },
      create: {
        wallet,
        username,
        avatar,
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
} 