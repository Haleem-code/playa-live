# Playa App - API Documentation for Frontend Integration

This document provides a comprehensive guide for **Next.js frontend developers** to integrate with the Playa backend API. It covers all endpoints, request/response formats, authentication, and usage examples.

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Stream Endpoints](#stream-endpoints)
4. [Betting Endpoints](#betting-endpoints)
5. [Wallet Endpoints](#wallet-endpoints)
6. [Moderator Endpoints](#moderator-endpoints)
7. [LiveKit (Real-time Streaming) Endpoints](#livekit-endpoints)
8. [Type Definitions](#type-definitions)
9. [Next.js Integration Example](#nextjs-integration-example)

---

## Base Configuration

```typescript
const API_BASE_URL = 'https://playa-backend.fly.dev';
```

### Standard Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

---

## Authentication

All authenticated endpoints require a **Bearer token** in the `Authorization` header:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### Auth Endpoints

#### POST `/auth/register`
Register a new user.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  }
}
```

---

#### POST `/auth/login`
Login an existing user.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  }
}
```

---

#### GET `/auth/profile`
Get the current user's profile. **Requires auth.**

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: User;
  }
}
```

---

#### GET `/auth/wallet/balance`
Get the current user's wallet balance. **Requires auth.**

**Response:**
```typescript
{
  success: boolean;
  data: {
    walletAddress: string;
    balance: number;
    balanceInSOL: number;
  }
}
```

---

#### PATCH `/auth/username`
Update the user's username. **Requires auth.**

**Request Body:**
```typescript
{
  username: string;
}
```

---

#### POST `/auth/transfer`
Transfer SOL to another wallet. **Requires auth.**

**Request Body:**
```typescript
{
  recipientAddress: string;
  amount: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    signature: string;
    from: string;
    to: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
    transactionDetails: {
      from: string;
      to: string;
      amount: number;
      amountInLamports: number;
      blockTime: number;
      slot: number;
    };
    explorerUrl: string;
  }
}
```

---

#### GET `/auth/users`
Get all users. **Admin/Moderator only.**

---

## Stream Endpoints

### How Streams Work

The Playa app is a **dual-streaming betting platform** where:
- Two players (streamers) compete against each other
- Viewers can place bets on either player (Player 1 or Player 2)
- Streams have statuses: `scheduled` → `live` → `ended`
- When a stream ends, a winner is declared and bets are settled

---

### GET `/streams`
Get all streams with optional filters.

**Query Parameters:**
```typescript
{
  limit?: number;      // Pagination limit
  skip?: number;       // Pagination offset
  status?: 'scheduled' | 'live' | 'ended';
  gameCategory?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    streams: Stream[];
    total: number;
  }
}
```

**Example (Next.js):**
```typescript
// app/api/streams/route.ts or pages/api/streams.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  const response = await fetch(
    `${API_BASE_URL}/streams?status=${status}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return Response.json(await response.json());
}
```

---

### GET `/streams/live`
Get all currently live streams.

**Response:**
```typescript
{
  success: boolean;
  data: {
    streams: Stream[];
    count: number;
  }
}
```

---

### GET `/streams/ended`
Get all ended streams.

**Response:**
```typescript
{
  success: boolean;
  data: {
    streams: Stream[];
    count: number;
  }
}
```

---

### GET `/streams/:streamId`
Get a specific stream by ID.

**Response:**
```typescript
{
  success: boolean;
  data: {
    stream: Stream;
  }
}
```

---

### POST `/streams/create`
Create a new stream. **Requires auth (Moderator/Admin).**

> [!IMPORTANT]
> Streams should be created with `status: 'scheduled'` first. Going live happens via the status update endpoint.

**Request Body:**
```typescript
{
  streamId: string;              // Unique identifier (you can generate with uuid)
  title: string;
  description: string;
  player1Name: string;
  player2Name: string;
  player1WalletAddress: string;  // Solana wallet address
  player2WalletAddress: string;  // Solana wallet address
  bettingDeadline: string;       // ISO date string
  startTime: string;             // ISO date string
  coverImage?: string | null;    // Base64 encoded image
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    stream: Stream;
    transaction: string;  // Blockchain transaction signature
  }
}
```

**Example (Next.js):**
```typescript
// CreateStreamForm.tsx
async function createStream(formData: FormData) {
  const streamId = crypto.randomUUID();
  
  const payload = {
    streamId,
    title: formData.get('title'),
    description: formData.get('description'),
    player1Name: formData.get('player1Name'),
    player2Name: formData.get('player2Name'),
    player1WalletAddress: formData.get('player1Wallet'),
    player2WalletAddress: formData.get('player2Wallet'),
    bettingDeadline: new Date(formData.get('deadline') as string).toISOString(),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    coverImage: base64Image || null,
  };

  const response = await fetch('/api/streams/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
```

---

### PATCH `/streams/:streamId/status`
Update stream status. **Requires auth (Moderator/Admin).**

**Request Body:**
```typescript
{
  status: 'scheduled' | 'live' | 'ended';
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    stream: Stream;
  }
}
```

---

### GET `/streams/:streamId/join`
Join a stream (get LiveKit token and stream info). **Requires auth.**

This is the main endpoint used when a user wants to watch or participate in a stream.

**Response:**
```typescript
{
  success: boolean;
  data: {
    stream: Stream;
    role: 'streamer' | 'viewer';
    streamerPosition: 'player1' | 'player2' | null;  // Only for streamers
    streamerPositionNumber?: 1 | 2 | null;           // Numeric version
    livekit: {
      url: string;       // LiveKit server URL
      token: string;     // JWT token for LiveKit
      roomName: string;  // Room to connect to
    };
  }
}
```

**Example (Next.js):**
```typescript
// StreamPage.tsx
'use client';
import { useEffect, useState } from 'react';

export default function StreamPage({ streamId }: { streamId: string }) {
  const [streamData, setStreamData] = useState(null);

  useEffect(() => {
    async function joinStream() {
      const res = await fetch(`/api/streams/${streamId}/join`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setStreamData(data.data);
        // Connect to LiveKit with data.data.livekit.token
      }
    }
    joinStream();
  }, [streamId]);

  return (/* Stream UI */);
}
```

---

## Betting Endpoints

### POST `/bets/place`
Place a bet on a stream. **Requires auth.**

**Request Body:**
```typescript
{
  streamId: string;
  prediction: 1 | 2;   // 1 = Player 1 wins, 2 = Player 2 wins
  amount: number;      // Amount in SOL
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    bet: Bet;
    transaction: string;  // Blockchain transaction signature
  }
}
```

**Example (Next.js):**
```typescript
async function placeBet(streamId: string, prediction: 1 | 2, amount: number) {
  const response = await fetch('/api/bets/place', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ streamId, prediction, amount }),
  });
  return response.json();
}
```

---

### GET `/bets/my-bets`
Get the current user's betting history. **Requires auth.**

**Query Parameters:**
```typescript
{
  status?: 'pending' | 'won' | 'lost' | 'refunded';
  limit?: number;
  skip?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    bets: Bet[];
    total: number;
  }
}
```

---

### GET `/bets/stream/:streamId`
Get all bets for a specific stream.

**Query Parameters:**
```typescript
{
  limit?: number;
  skip?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    bets: Bet[];
    total: number;
    stats: {
      player1: { totalAmount: number; count: number };
      player2: { totalAmount: number; count: number };
    };
  }
}
```

---

## Wallet Endpoints

### GET `/wallet/balance/:userId`
Get wallet balance for a specific user.

---

### POST `/wallet/transaction`
Process a wallet transaction.

---

### GET `/wallet/transactions/:userId`
Get transaction history for a user.

---

### GET `/wallet/info/:userId`
Get detailed wallet info.

---

### POST `/wallet/airdrop`
Request a SOL airdrop (devnet only).

**Request Body:**
```typescript
{
  userId: string;
  amount: number;
}
```

---

## Moderator Endpoints

These endpoints require **Moderator** or **Admin** role.

### GET `/moderator/dashboard/stats`
Get dashboard statistics.

**Response:**
```typescript
{
  success: boolean;
  data: {
    streams: { total: number; live: number; scheduled: number; ended: number };
    bets: { total: number; pending: number; won: number; lost: number };
    users: { total: number; moderators: number };
    financials: { totalPool: number; totalBetAmount: number };
  }
}
```

---

### GET `/moderator/streams`
Get all streams (moderator view).

---

### POST `/moderator/winner/declare/player1`
Declare Player 1 as the winner.

**Request Body:**
```typescript
{
  streamId: string;
}
```

---

### POST `/moderator/winner/declare/player2`
Declare Player 2 as the winner.

**Request Body:**
```typescript
{
  streamId: string;
}
```

---

### POST `/moderator/winner/claim`
Claim winnings for a bet.

**Request Body:**
```typescript
{
  betId: string;
}
```

---

## LiveKit Endpoints

These endpoints handle real-time streaming via LiveKit.

> [!NOTE]
> The base path for LiveKit endpoints is `/api/livekit` (not just `/livekit`).

### POST `/api/livekit/token/streamer`
Get a token for a streamer (can publish video/audio).

**Request Body:**
```typescript
{
  roomName: string;
  participantName: string;
  role: 'streamer';
  streamerPosition: 1 | 2;  // 1 = left position, 2 = right position
}
```

**Response:**
```typescript
{
  token: string;
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
}
```

---

### POST `/api/livekit/token/viewer`
Get a token for a viewer (can only subscribe).

**Request Body:**
```typescript
{
  roomName: string;
  participantName: string;
  role: 'viewer';
}
```

---

### POST `/api/livekit/room/create`
Create a new LiveKit room for dual streaming.

**Request Body:**
```typescript
{
  streamId: string;
  roomName: string;
  gameName?: string;
  maxStreamers: 2;
}
```

---

### POST `/api/livekit/room/join-streamer`
Join a room as a streamer.

**Request Body:**
```typescript
{
  roomName: string;
  userId: string;
  username: string;
  position: 1 | 2;
}
```

---

### GET `/api/livekit/room/:roomName`
Get room info including active streamers and viewer count.

---

### GET `/api/livekit/room/:roomName/slots`
Check available streamer slots.

**Response:**
```typescript
{
  available: boolean;
  position1Taken: boolean;
  position2Taken: boolean;
  streamers: Array<{ position: number; username: string }>;
}
```

---

### POST `/api/livekit/room/:roomName/end`
End a streaming room.

---

### GET `/api/livekit/room/:roomName/chat`
Get chat history for a room.

---

### POST `/api/livekit/chat/save`
Save a chat message.

---

## Type Definitions

### User

```typescript
interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  walletAddress: string;
  role: 'user' | 'moderator' | 'admin';
  totalBets: number;
  totalWinnings: number;
  totalLosses: number;
  createdAt: string;
  walletBalance?: number;  // Populated from wallet balance endpoint
}
```

### Stream

```typescript
interface Stream {
  _id: string;
  streamId: string;
  title: string;
  description: string;
  player1Name: string;
  player1WalletAddress?: string;
  player2Name: string;
  player2WalletAddress?: string;
  status: 'scheduled' | 'live' | 'ended';
  bettingPoolAddress?: string;
  bettingDeadline: string;
  startTime: string;
  creatorAddress: string;
  totalBets: number;
  totalPool: number;
  player1Bets: number;
  player2Bets: number;
  winnerDeclared: boolean;
  winningOutcome?: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Bet

```typescript
interface Bet {
  _id: string;
  betAddress: string;
  userAddress: string;
  userId: string;
  streamId: string;
  bettingPoolAddress: string;
  amount: number;
  prediction: 1 | 2;
  isPaidOut: boolean;
  payoutAmount: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  isWinner?: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Next.js Integration Example

### 1. API Client Setup

Create a reusable API client:

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://playa-backend.fly.dev';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Streams
  async getLiveStreams() {
    return this.request<{ success: boolean; data: { streams: Stream[] } }>('/streams/live');
  }

  async getStreamById(streamId: string) {
    return this.request<{ success: boolean; data: { stream: Stream } }>(`/streams/${streamId}`);
  }

  async joinStream(streamId: string) {
    return this.request<{
      success: boolean;
      data: {
        stream: Stream;
        role: 'streamer' | 'viewer';
        livekit: { url: string; token: string; roomName: string };
      };
    }>(`/streams/${streamId}/join`);
  }

  async createStream(data: CreateStreamPayload) {
    return this.request<{ success: boolean; data: { stream: Stream } }>(
      '/streams/create',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Bets
  async placeBet(streamId: string, prediction: 1 | 2, amount: number) {
    return this.request<{ success: boolean; data: { bet: Bet } }>(
      '/bets/place',
      {
        method: 'POST',
        body: JSON.stringify({ streamId, prediction, amount }),
      }
    );
  }

  async getMyBets(params?: { status?: string; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: { bets: Bet[] } }>(
      `/bets/my-bets${query ? `?${query}` : ''}`
    );
  }
}

export const apiClient = new ApiClient();
```

### 2. React Hook for Streams

```typescript
// hooks/useStreams.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Stream } from '@/types';

export function useStreams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getLiveStreams();
      if (response.success && response.data) {
        setStreams(response.data.streams);
      }
    } catch (err) {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streams, loading, error, refresh: fetchStreams };
}
```

### 3. Stream Page Component

```typescript
// app/stream/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function StreamPage({ params }: { params: { id: string } }) {
  const [stream, setStream] = useState(null);
  const [livekitData, setLivekitData] = useState(null);

  useEffect(() => {
    async function loadStream() {
      const token = localStorage.getItem('authToken');
      if (token) apiClient.setToken(token);

      const response = await apiClient.joinStream(params.id);
      if (response.success) {
        setStream(response.data.stream);
        setLivekitData(response.data.livekit);
      }
    }
    loadStream();
  }, [params.id]);

  if (!stream) return <div>Loading...</div>;

  return (
    <div>
      <h1>{stream.title}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>Player 1: {stream.player1Name}</div>
        <div>Player 2: {stream.player2Name}</div>
      </div>
      {/* Use livekitData.token to connect to LiveKit */}
    </div>
  );
}
```

---

## Error Handling

All errors follow this format:

```typescript
{
  success: false;
  error: string;      // Error code or message
  message?: string;   // Human-readable message
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

---

## Summary

| Category | Main Endpoints |
|----------|---------------|
| **Auth** | `/auth/login`, `/auth/register`, `/auth/profile` |
| **Streams** | `/streams`, `/streams/live`, `/streams/:id`, `/streams/create`, `/streams/:id/join` |
| **Bets** | `/bets/place`, `/bets/my-bets`, `/bets/stream/:streamId` |
| **Wallet** | `/auth/wallet/balance`, `/auth/transfer` |
| **Moderator** | `/moderator/dashboard/stats`, `/moderator/winner/declare/player1` |
| **LiveKit** | `/api/livekit/token/*`, `/api/livekit/room/*` |

For questions or issues, refer to the backend codebase or contact the backend team.
