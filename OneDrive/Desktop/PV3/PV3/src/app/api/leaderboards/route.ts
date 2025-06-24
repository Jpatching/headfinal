import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'earnings';
    const period = searchParams.get('period') || 'alltime';

    // Try to get cached leaderboard first
    const cached = await prisma.leaderboard.findUnique({
      where: {
        type_period: {
          type,
          period
        }
      }
    });

    if (cached && isRecentlyUpdated(cached.updatedAt)) {
      return NextResponse.json(cached.data);
    }

    // Generate fresh leaderboard data
    let leaderboardData;
    
    switch (type) {
      case 'earnings':
        leaderboardData = await prisma.user.findMany({
          select: {
            wallet: true,
            username: true,
            avatar: true,
            totalEarnings: true,
          },
          orderBy: {
            totalEarnings: 'desc'
          },
          take: 100,
        });
        break;
        
      case 'wins':
        leaderboardData = await prisma.user.findMany({
          select: {
            wallet: true,
            username: true,
            avatar: true,
            wins: true,
          },
          orderBy: {
            wins: 'desc'
          },
          take: 100,
        });
        break;
        
      case 'winrate':
        leaderboardData = await prisma.user.findMany({
          select: {
            wallet: true,
            username: true,
            avatar: true,
            winRate: true,
            totalMatches: true,
          },
          where: {
            totalMatches: {
              gte: 10 // Minimum 10 matches for winrate leaderboard
            }
          },
          orderBy: {
            winRate: 'desc'
          },
          take: 100,
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid leaderboard type' },
          { status: 400 }
        );
    }

    // Cache the result
    await prisma.leaderboard.upsert({
      where: {
        type_period: {
          type,
          period
        }
      },
      update: {
        data: leaderboardData,
        updatedAt: new Date(),
      },
      create: {
        type,
        period,
        data: leaderboardData,
      }
    });

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

function isRecentlyUpdated(updatedAt: Date): boolean {
  const now = new Date();
  const diffInMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
  return diffInMinutes < 15; // Cache for 15 minutes
} 