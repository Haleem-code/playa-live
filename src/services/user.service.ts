import { apiClient, ApiResponse } from './api.client';
import type { User, Bet, Stream } from '@/types';
import { betService } from './bet.service';
import { streamService } from './stream.service';

export const userService = {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<ApiResponse<{ users: User[] }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ users: User[] }>>('/auth/users');
      return response.data;
    } catch (error: any) {
      console.error('Get all users error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch users',
        data: { users: [] }
      };
    }
  },

  /**
   * Get recently played with users based on bet history
   */
  async getRecentlyPlayedWith(): Promise<User[]> {
    try {
      // 1. Get user's bet history
      const betsResponse = await betService.getUserBets({ limit: 50, skip: 0 });
      
      if (!betsResponse.success || !betsResponse.data?.bets?.length) {
        return [];
      }

      // 2. Get unique stream IDs
      const streamIds = [...new Set(betsResponse.data.bets.map((bet: Bet) => bet.streamId))] as string[];

      // 3. Fetch stream details to get player wallet addresses
      const streamResults = await Promise.all(
        streamIds.slice(0, 10).map((id: string) => streamService.getStreamById(id))
      );

      // Filter out null results (deleted/missing streams)
      const streams = streamResults.filter((stream): stream is Stream => stream !== null);

      // 4. Extract player wallet addresses
      const playerWallets = new Set<string>();
      streams.forEach((stream: Stream) => {
        if (stream?.player1_name) playerWallets.add(stream.player1_name);
        if (stream?.player2_name) playerWallets.add(stream.player2_name);
      });

      // 5. Get all users and filter by recently played
      const usersResponse = await this.getAllUsers();
      if (!usersResponse.success || !usersResponse.data?.users) {
        return [];
      }

      // Filter users who match player names (username or email)
      const recentUsers = usersResponse.data.users.filter(user => {
        const matchesUsername = user.username && playerWallets.has(user.username);
        const matchesEmail = playerWallets.has(user.email);
        return matchesUsername || matchesEmail;
      });

      // Return unique users, limit to 5 most recent
      return recentUsers.slice(0, 5);
    } catch (error) {
      console.error('Get recently played with error:', error);
      return [];
    }
  },

  /**
   * Search users by query (client-side filtering)
   */
  searchUsers(users: User[], query: string): User[] {
    if (!query.trim()) return users;
    
    const lowerQuery = query.toLowerCase();
    return users.filter(user => 
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.walletAddress.toLowerCase().includes(lowerQuery)
    );
  }
};
