export interface User {
  id: string;
  email: string;
  username?: string;
  walletAddress: string;
  role: "user" | "moderator" | "admin";
  balance?: number;
  profileImage?: string;
  gravatarUrl?: string;
  totalBets?: number;
  totalWinnings?: number;
  totalLosses?: number;
}

export interface StreamStats {
  current_viewers: number;
  total_pool_sol: number;
  player1_bets_sol: number;
  player2_bets_sol: number;
  player1_bet_count: number;
  player2_bet_count: number;
}

export interface Stream {
  id: string;
  stream_id: string;
  title: string;
  creator_id: string;
  player1_name: string;
  player2_name: string;
  game_category: string;
  thumbnail_url?: string;
  stream_url?: string;
  duration_minutes: number;
  betting_deadline: string;
  start_time?: string;
  live_started_at?: string;
  status: string;
  is_live: boolean;
  stats: StreamStats;
  livekitRoomName?: string;
  player1_walletAddress?: string;
  player2_walletAddress?: string;
  coverImage?: string;
}

export interface CreateStreamData {
  streamId: string;
  title: string;
  creatorId: string;
  player1Name: string;
  player1WalletAddress?: string;
  player2Name: string;
  player2WalletAddress?: string;
  gameCategory: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  durationMinutes: number;
  bettingDeadline: string;
  isLive: boolean;
  startTime?: string;
}

export interface Bet {
  _id: string;
  streamId: string;
  userId: string;
  amount: number;
  prediction: "player1" | "player2";
  status: "pending" | "won" | "lost";
  payout?: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "stream_created"
    | "stream_started"
    | "stream_ended"
    | "bet_won"
    | "bet_lost";
  title: string;
  message: string;
  data?: {
    streamId?: string;
    streamTitle?: string;
    creatorUsername?: string;
    player1Name?: string;
    player2Name?: string;
    startTime?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LiveKitToken {
  token: string;
  url: string;
  role?: "streamer" | "viewer";
}
