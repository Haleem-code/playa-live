import { apiClient, ApiResponse, fixImageUrl } from './api.client';
import { Stream, CreateStreamData } from '@/types';

// Helper function to normalize stream data from various API formats
function normalizeStream(stream: any): Stream {
  return {
    id: stream.id || stream.streamId || stream.stream_id || stream._id,
    stream_id: stream.stream_id || stream.streamId || stream.id || stream._id,
    title: stream.title || '',
    creator_id: stream.creator_id || stream.creatorId || stream.creator || '',
    player1_name: stream.player1_name || stream.player1Name || 'Player 1',
    player2_name: stream.player2_name || stream.player2Name || 'Player 2',
    game_category: stream.game_category || stream.gameCategory || 'Other',
    thumbnail_url: fixImageUrl(stream.thumbnail_url || stream.thumbnailUrl || stream.coverImage),
    stream_url: stream.stream_url || stream.streamUrl || undefined,
    duration_minutes: stream.duration_minutes || stream.durationMinutes || 60,
    betting_deadline: stream.betting_deadline || stream.bettingDeadline || '',
    start_time: stream.start_time || stream.startTime || undefined,
    live_started_at: stream.live_started_at || stream.liveStartedAt || undefined,
    status: stream.status || (stream.is_live || stream.isLive ? 'live' : 'scheduled'),
    is_live: stream.is_live ?? stream.isLive ?? false,
    stats: {
      current_viewers: stream.stats?.current_viewers || stream.stats?.currentViewers || 0,
      total_pool_sol: stream.stats?.total_pool_sol || stream.stats?.totalPoolSol || 0,
      player1_bets_sol: stream.stats?.player1_bets_sol || stream.stats?.player1BetsSol || 0,
      player2_bets_sol: stream.stats?.player2_bets_sol || stream.stats?.player2BetsSol || 0,
      player1_bet_count: stream.stats?.player1_bet_count || stream.stats?.player1BetCount || 0,
      player2_bet_count: stream.stats?.player2_bet_count || stream.stats?.player2BetCount || 0,
    },
    livekitRoomName: stream.livekitRoomName || stream.livekit_room_name || undefined,
    player1_walletAddress: stream.player1_walletAddress || stream.player1WalletAddress || stream.player1_wallet_address,
    player2_walletAddress: stream.player2_walletAddress || stream.player2WalletAddress || stream.player2_wallet_address,
  };
}

class StreamService {
  async getLiveStreams(): Promise<Stream[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ streams: Stream[]; count: number }>>('/streams/live');
      const body = response.data;
      
      console.log('getLiveStreams response:', body); // Debug log
      
      // Handle various response formats
      let rawStreams: any[] = [];
      if (body.success && body.data?.streams) {
        rawStreams = body.data.streams;
      } else if (body.streams) {
        rawStreams = body.streams;
      } else if (Array.isArray(body.data)) {
        rawStreams = body.data;
      } else if (Array.isArray(body)) {
        rawStreams = body;
      }
      
      return rawStreams.map(normalizeStream);
    } catch (error) {
      console.error('Error fetching live streams:', error);
      return [];
    }
  }

  async getStreamById(streamId: string): Promise<Stream | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ stream: Stream }>>(`/streams/${streamId}`);
      const body = response.data;
      
      // Handle various response formats
      let rawStream: any = null;
      if (body.success && body.data?.stream) {
        rawStream = body.data.stream;
      } else if (body.stream) {
        rawStream = body.stream;
      } else if (body.data && !body.data.stream) {
        rawStream = body.data;
      }
      
      if (rawStream) {
        return normalizeStream(rawStream);
      }
      
      return null;
    } catch (error: any) {
      // 404 is expected when stream doesn't exist (e.g., deleted streams)
      if (error.response?.status !== 404) {
        console.error('Error fetching stream:', error);
      }
      return null;
    }
  }

  async createStream(streamData: CreateStreamData): Promise<Stream | null> {
    try {
      // Transform frontend data to backend format - only send fields backend expects
      console.log('=== STREAM SERVICE DEBUG ===');
      console.log('streamData.isLive received:', streamData.isLive);
      
      
      // Filter out base64 data URLs - only send actual URLs
      // Backend can't handle large base64 strings and mobile app sends URLs
      const isValidUrl = streamData.thumbnailUrl && 
        (streamData.thumbnailUrl.startsWith('http://') || streamData.thumbnailUrl.startsWith('https://'));
      
      // Validate wallet addresses - both are REQUIRED for betting pool initialization
      if (!streamData.player1WalletAddress || !streamData.player2WalletAddress) {
        console.error('Both wallet addresses are required for stream creation');
        throw new Error('Both player wallet addresses are required to create a stream');
      }

      const backendData = {
        streamId: streamData.streamId,
        title: streamData.title,
        description: streamData.title, // Use title as description
        player1Name: streamData.player1Name,
        player2Name: streamData.player2Name,
        player1WalletAddress: streamData.player1WalletAddress, // Required - no null fallback
        player2WalletAddress: streamData.player2WalletAddress, // Required - no null fallback
        bettingDeadline: streamData.bettingDeadline,
        startTime: streamData.startTime || new Date().toISOString(),
        coverImage: isValidUrl ? streamData.thumbnailUrl : null,
      };

      console.log('=== Stream creation payload ===');
      console.log('isGoingLive (frontend only):', streamData.isLive);
      console.log('Full backend payload:', JSON.stringify(backendData, null, 2));

      const response = await apiClient.post<ApiResponse<{ stream: Stream; transaction: string }>>('/streams/create', backendData);
      const body = response.data;

      console.log('Create stream response:', body); // Debug log

      // Handle response structure
      let streamResult = null;
      
      if (body.success && body.data?.stream) {
        streamResult = body.data.stream;
      } else {
        console.error('Unexpected response structure:', body);
        return null;
      }

      // Transform streamId to id if needed
      const resultAny = streamResult as any;
      if (resultAny.streamId && !resultAny.id) {
        resultAny.id = resultAny.streamId;
      }
      // Also check stream_id
      if (resultAny.stream_id && !resultAny.id) {
        resultAny.id = resultAny.stream_id;
      }

      // If user wanted to go live immediately, update status since backend ignores the status field on create
      if (streamData.isLive && resultAny.id) {
        console.log('Stream created, now updating status to live...');
        try {
          const statusResponse = await apiClient.patch<ApiResponse<{ stream: Stream }>>(
            `/streams/${resultAny.id}/status`,
            { status: 'live' }
          );
          console.log('Status update response:', statusResponse.data);
          
          if (statusResponse.data?.success && statusResponse.data?.data?.stream) {
            // Return the updated stream with live status
            const updatedStream = statusResponse.data.data.stream as any;
            if (updatedStream.streamId && !updatedStream.id) {
              updatedStream.id = updatedStream.streamId;
            }
            console.log('Stream is now LIVE:', updatedStream);
            return updatedStream as unknown as Stream;
          }
        } catch (statusError) {
          console.error('Failed to update stream status to live:', statusError);
          // Continue with original stream result even if status update fails
        }
      }

      console.log('Parsed stream result:', streamResult); // Debug log
      return streamResult as unknown as Stream;
    } catch (error: any) {
      console.error('Error creating stream:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      throw error;
    }
  }

  async getAllStreams(filters?: { status?: string; gameCategory?: string }): Promise<Stream[]> {
    try {
      const queryParams: any = {};
      if (filters?.status) queryParams.status = filters.status;
      if (filters?.gameCategory) queryParams.gameCategory = filters.gameCategory;
      
      console.log('Making request to /streams...'); // Debug
      
      const response = await apiClient.get<ApiResponse<{ streams: Stream[]; total: number }>>('/streams', { 
        params: queryParams,
        timeout: 30000, // Explicit timeout
      });
      const body = response.data;
      
      console.log('getAllStreams response:', body); // Debug log
      
      // Handle various response formats
      let rawStreams: any[] = [];
      if (body.success && body.data?.streams) {
        rawStreams = body.data.streams;
      } else if (body.streams) {
        rawStreams = body.streams;
      } else if (Array.isArray(body.data)) {
        rawStreams = body.data;
      } else if (Array.isArray(body)) {
        rawStreams = body;
      }
      
      console.log('Parsed streams count:', rawStreams.length); // Debug
      return rawStreams.map(normalizeStream);
    } catch (error: any) {
      console.error('Error fetching streams:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });
      return [];
    }
  }
}

export const streamService = new StreamService();
