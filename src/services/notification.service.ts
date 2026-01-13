import { apiClient, ApiResponse } from './api.client';
import type { Notification } from '@/types';

export const notificationService = {
  /**
   * Get user's notifications with pagination
   */
  async getNotifications(params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<{ notifications: Notification[]; total: number; unreadCount: number }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

      const response = await apiClient.get<ApiResponse<{ 
        notifications: Notification[]; 
        total: number; 
        unreadCount: number 
      }>>(`/notifications?${queryParams.toString()}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch notifications',
        data: { notifications: [], total: 0, unreadCount: 0 }
      };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
        '/notifications/unread-count'
      );
      return response.data;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch unread count',
        data: { unreadCount: 0 }
      };
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<{ notification: Notification }>> {
    try {
      const response = await apiClient.patch<ApiResponse<{ notification: Notification }>>(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error: any) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark notification as read',
        data: null as any
      };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ count: number }>>(
        '/notifications/mark-all-read'
      );
      return response.data;
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark all as read',
        data: { count: 0 }
      };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/notifications/${notificationId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete notification',
        data: null
      };
    }
  }
};
