import { apiClient, ApiResponse } from './api.client';

export const rewardService = {
  async getRewardSummary(streamId: string, userId?: string): Promise<ApiResponse> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await apiClient.get(`/rewards/summary/${streamId}${params}`);
    return response.data;
  },

  async claimRewards(streamId: string, userId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/rewards/claim`, { streamId, userId });
    return response.data;
  }
};
