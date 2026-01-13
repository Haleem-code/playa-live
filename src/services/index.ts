import { authService } from './auth.service';
import { streamService } from './stream.service';    
import { walletService } from './wallet.service';
import { betService } from './bet.service';
import { rewardService } from './reward.service';
import { userService } from './user.service';
import { livekitService } from './livekit.service';
import { notificationService } from './notification.service';

export { 
  authService, 
  streamService, 
  walletService, 
  betService, 
  rewardService,
  userService,
  livekitService,
  notificationService
};

// Backend-compatible flat API object for backward compatibility with existing components
export const api = {
  ...authService,
  ...walletService,
  ...betService,
  ...rewardService,
};

export type { ApiResponse } from './api.client';
