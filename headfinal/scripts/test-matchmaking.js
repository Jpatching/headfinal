/**
 * Test script for matchmaking functionality
 * Simulates two players searching for matches
 * 
 * Run with: node scripts/test-matchmaking.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');

// Constants - ensure these match your application's constants
const MATCH_REQUEST_PREFIX = 'matchRequest:';
const MATCH_PREFIX = 'match:';
const PENDING_MATCHES_PREFIX = 'pendingMatches:amount:';

let redis;

async function initializeRedis() {
  try {
    // Try REST API connection first
    const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
    
    if (restUrl && restToken) {
      redis = new Redis({
        url: restUrl,
        token: restToken,
      });
      console.log('Connected to Redis using REST API');
    } else {
      // Fallback to TLS URL
      const redisUrl = process.env.UPSTASH_REDIS_KV_URL || process.env.REDIS_URL;
      redis = new Redis(redisUrl);
      console.log('Connected to Redis using TLS URL');
    }
    
    const ping = await redis.ping();
    if (ping !== 'PONG') {
      throw new Error(`Unexpected ping response: ${ping}`);
    }
    
    console.log('Redis connection verified with PING');
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
}

// Create a match request for a player
async function createMatchRequest(playerPublicKey, betAmount) {
  const matchRequestId = `${MATCH_REQUEST_PREFIX}${uuidv4()}`;
  
  const matchRequest = {
    id: matchRequestId,
    playerPublicKey,
    betAmount,
    timestamp: Date.now(),
    status: "pending",
  };
  
  await redis.set(matchRequestId, JSON.stringify(matchRequest));
  
  // Add to sorted set of pending matches by bet amount
  const betAmountKey = `${PENDING_MATCHES_PREFIX}${betAmount}`;
  await redis.zadd(betAmountKey, { score: Date.now(), member: matchRequestId });
  
  console.log(`Created match request ${matchRequestId} for player ${playerPublicKey}`);
  return matchRequestId;
}

// Find a match for a match request
async function findMatch(matchRequestId) {
  const matchRequestData = await redis.get(matchRequestId);
  
  if (!matchRequestData) {
    console.log(`Match request not found: ${matchRequestId}`);
    return null;
  }
  
  const matchRequest = JSON.parse(matchRequestData);
  console.log(`Processing match request for player ${matchRequest.playerPublicKey}`);
  
  // If already matched, return the match
  if (matchRequest.status === "matched" && matchRequest.matchId) {
    const matchData = await redis.get(matchRequest.matchId);
    if (matchData) {
      return JSON.parse(matchData);
    }
  }
  
  // Only proceed if still pending
  if (matchRequest.status !== "pending") {
    console.log(`Match request is ${matchRequest.status}, not pending`);
    return null;
  }
  
  // Find other pending match requests with the same bet amount
  const betAmountKey = `${PENDING_MATCHES_PREFIX}${matchRequest.betAmount}`;
  const pendingMatches = await redis.zrange(betAmountKey, 0, -1);
  
  console.log(`Found ${pendingMatches.length} pending matches for amount ${matchRequest.betAmount}`);
  
  // Find a suitable opponent
  for (const pendingMatchId of pendingMatches) {
    if (pendingMatchId === matchRequestId) continue;
    
    const pendingMatchData = await redis.get(pendingMatchId);
    if (!pendingMatchData) continue;
    
    const pendingMatch = JSON.parse(pendingMatchData);
    
    // Check if expired
    const isExpired = Date.now() - pendingMatch.timestamp > 10 * 60 * 1000;
    if (isExpired) {
      console.log(`Match request ${pendingMatchId} is expired`);
      pendingMatch.status = "expired";
      await redis.set(pendingMatchId, JSON.stringify(pendingMatch));
      await redis.zrem(betAmountKey, pendingMatchId);
      continue;
    }
    
    // Check if still pending and not from same player
    if (pendingMatch.status !== "pending") continue;
    if (pendingMatch.playerPublicKey === matchRequest.playerPublicKey) continue;
    
    // Create a match
    const matchId = `${MATCH_PREFIX}${uuidv4()}`;
    const match = {
      id: matchId,
      player1PublicKey: matchRequest.playerPublicKey,
      player2PublicKey: pendingMatch.playerPublicKey,
      betAmount: matchRequest.betAmount,
      timestamp: Date.now(),
      status: "active"
    };
    
    // Save match
    await redis.set(matchId, JSON.stringify(match));
    
    // Update both match requests
    matchRequest.status = "matched";
    matchRequest.matchId = matchId;
    pendingMatch.status = "matched";
    pendingMatch.matchId = matchId;
    
    await redis.set(matchRequestId, JSON.stringify(matchRequest));
    await redis.set(pendingMatchId, JSON.stringify(pendingMatch));
    
    // Remove from pending matches
    await redis.zrem(betAmountKey, matchRequestId);
    await redis.zrem(betAmountKey, pendingMatchId);
    
    console.log(`Created match ${matchId} between ${match.player1PublicKey} and ${match.player2PublicKey}`);
    return match;
  }
  
  console.log('No suitable opponent found');
  return null;
}

// Complete a match
async function completeMatch(matchId, winnerId) {
  const matchData = await redis.get(matchId);
  
  if (!matchData) {
    console.log(`Match not found: ${matchId}`);
    return false;
  }
  
  const match = JSON.parse(matchData);
  
  if (match.status !== "active") {
    console.log(`Match is ${match.status}, not active`);
    return false;
  }
  
  match.status = "completed";
  match.winnerId = winnerId;
  
  await redis.set(matchId, JSON.stringify(match));
  
  console.log(`Completed match ${matchId}, winner: ${winnerId}`);
  
  // Update leaderboard
  const LEADERBOARD_KEY = 'leaderboard:byWinnings';
  await redis.zadd(LEADERBOARD_KEY, { [winnerId]: match.betAmount * 2 });
  
  return true;
}

// Main test function
async function testMatchmaking() {
  console.log('Matchmaking System Test');
  console.log('=====================');
  
  await initializeRedis();
  
  const player1 = `player1_${Date.now()}`;
  const player2 = `player2_${Date.now()}`;
  const betAmount = 0.1;
  
  console.log(`\nSimulating matchmaking with players ${player1} and ${player2}`);
  console.log(`Bet amount: ${betAmount} SOL`);
  
  // Step 1: Create match requests for both players
  console.log('\nStep 1: Creating match requests');
  const request1Id = await createMatchRequest(player1, betAmount);
  
  // Wait 1 second before creating second request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const request2Id = await createMatchRequest(player2, betAmount);
  
  // Step 2: Find match for player 1
  console.log('\nStep 2: Finding match for player 1');
  const match = await findMatch(request1Id);
  
  if (!match) {
    console.error('❌ Failed to find a match!');
    process.exit(1);
  }
  
  console.log(`✅ Found match: ${match.id}`);
  console.log(match);
  
  // Step 3: Complete the match
  console.log('\nStep 3: Completing the match');
  const success = await completeMatch(match.id, player1);
  
  if (!success) {
    console.error('❌ Failed to complete match!');
    process.exit(1);
  }
  
  console.log('✅ Match completed successfully');
  
  // Step 4: Verify leaderboard
  console.log('\nStep 4: Checking leaderboard');
  const leaderboard = await redis.zrange('leaderboard:byWinnings', 0, -1, { withScores: true, rev: true });
  
  console.log('Leaderboard entries:');
  leaderboard.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.member}: ${entry.score}`);
  });
  
  if (leaderboard.some(entry => entry.member === player1)) {
    console.log('✅ Winner correctly added to leaderboard');
  } else {
    console.error('❌ Winner not found in leaderboard!');
  }
  
  console.log('\n✅ Matchmaking test completed successfully!');
}

testMatchmaking().catch(console.error);
