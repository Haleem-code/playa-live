import { apiClient, ApiResponse, fixImageUrl } from './api.client';

export const authService = {
  async signup(email: string, password: string, username: string, fullName: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      username,
      fullName,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async getUserProfile(): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/profile');
    
    // Transform image URLs to use correct backend domain
    if (response.data?.data?.user) {
      const user = response.data.data.user;
      user.profileImage = fixImageUrl(user.profileImage);
      user.gravatarUrl = fixImageUrl(user.gravatarUrl);
    }
    
    return response.data;
  },

  async updateUsername(username: string): Promise<ApiResponse> {
    const response = await apiClient.patch('/auth/username', {
      username,
    });
    return response.data;
  },

  async uploadProfileImage(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/auth/profile/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Transform image URL to use correct backend domain
    if (response.data?.data?.imageUrl) {
      response.data.data.imageUrl = fixImageUrl(response.data.data.imageUrl);
    }
    
    return response.data;
  },

  async removeProfileImage(): Promise<ApiResponse> {
    const response = await apiClient.delete('/auth/profile/image');
    return response.data;
  },
};
