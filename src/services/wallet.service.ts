import { apiClient, ApiResponse } from './api.client';

export const walletService = {
  async getWalletBalance(userId?: string): Promise<ApiResponse> {
    const endpoint = userId ? `/wallet/balance/${userId}` : '/auth/wallet/balance';
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  async processWalletTransaction(transactionData: any): Promise<ApiResponse> {
    const response = await apiClient.post('/wallet/transaction', transactionData);
    return response.data;
  },

  async getWalletTransactions(userId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/wallet/transactions/${userId}`);
    return response.data;
  },

  async getWalletInfo(userId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/wallet/info/${userId}`);
    return response.data;
  },

  async requestAirdrop(userId: string, amount: number): Promise<ApiResponse> {
    const response = await apiClient.post('/wallet/airdrop', { userId, amount });
    return response.data;
  },

  async transferSOL(recipientAddress: string, amount: number): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/transfer', {
      recipientAddress,
      amount,
    });
    return response.data;
  }
};
