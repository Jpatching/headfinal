import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    const tournaments = await prisma.tournament.findMany({
      where: status ? { status } : undefined,
      include: {
        participants: {
          include: {
            user: {
              select: {
                wallet: true,
                username: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      prizePool, 
      maxPlayers, 
      gameType, 
      entryFee, 
      startsAt 
    } = body;

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        prizePool,
        maxPlayers,
        gameType,
        entryFee,
        startsAt: new Date(startsAt),
        status: 'upcoming',
      }
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
} 