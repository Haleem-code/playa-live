import { apiClient, ApiResponse } from './api.client';
import type { LiveKitToken, Stream } from '@/types';

export const livekitService = {
  /**
   * Join a stream and get LiveKit token
   */
  async joinStream(streamId: string): Promise<ApiResponse<LiveKitToken & { 
    stream: Stream; 
    role: 'streamer' | 'viewer';
    streamerPosition?: 'player1' | 'player2' | null;
  }>> {
    try {
      const response = await apiClient.get<ApiResponse<{
        stream: Stream;
        role: 'streamer' | 'viewer';
        streamerPosition: 'player1' | 'player2' | null;
        streamerPositionNumber?: number | null;
        livekit: {
          url: string;
          token: string;
          roomName: string;
        };
      }>>(`/streams/${streamId}/join`);
      
      const body = response.data;
      
      if (body.success && body.data?.livekit) {
        return {
          success: true,
          data: {
            token: body.data.livekit.token,
            url: body.data.livekit.url,
            role: body.data.role,
            stream: body.data.stream,
            streamerPosition: body.data.streamerPosition,
          }
        };
      }
      
      return {
        success: false,
        message: 'Failed to join stream',
        data: { 
          token: '', 
          url: '',
          role: 'viewer' as const,
          stream: {} as Stream,
          streamerPosition: null
        }
      };
    } catch (error: any) {
      console.error('Join stream error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to join stream',
        data: { 
          token: '', 
          url: '',
          role: 'viewer' as const,
          stream: {} as Stream,
          streamerPosition: null
        }
      };
    }
  },

  /**
   * Update stream status (scheduled -> live -> ended)
   */
  async updateStreamStatus(
    streamId: string, 
    status: 'scheduled' | 'live' | 'ended' | 'cancelled',
    endTime?: string
  ): Promise<ApiResponse<Stream>> {
    try {
      const response = await apiClient.patch<ApiResponse<{ stream: Stream }>>(
        `/streams/${streamId}/status`,
        { status, endTime }
      );
      
      const body = response.data;
      
      if (body.success && body.data?.stream) {
        return {
          success: true,
          data: body.data.stream
        };
      }
      
      return {
        success: false,
        message: 'Failed to update stream status',
        data: null as any
      };
    } catch (error: any) {
      console.error('Update stream status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update stream status',
        data: null as any
      };
    }
  },

  /**
   * Check if current user is a streamer (player 1 or player 2)
   */
  isStreamer(stream: Stream, currentUserWallet: string): boolean {
    // Check by wallet address or creator ID
    return stream.creator_id === currentUserWallet;
  }
};
