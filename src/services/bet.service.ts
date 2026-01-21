import { apiClient, ApiResponse } from './api.client';

export const betService = {
  async placeBet(userId: string, streamId: string, prediction: 'player1' | 'player2', amountSol: number): Promise<ApiResponse> {
    const response = await apiClient.post('/bets/place', {
      userId,
      streamId,
      prediction,
      amountSol,
      processWalletTransaction: true,
    });
    return response.data;
  },

  async getUserBets(filters?: { status?: string; limit?: number; skip?: number }): Promise<ApiResponse> {
    const params = new URLSearchParams(filters as any).toString();
    const response = await apiClient.get(`/bets/my-bets${params ? '?' + params : ''}`);
    return response.data;
  },

  async getStreamBets(streamId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/bets/stream/${streamId}`);
    return response.data;
  }
};

