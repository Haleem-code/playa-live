'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Upload, Trash2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  gravatarUrl?: string;
  onImageUpdated: (imageUrl: string) => void;
}

export function ProfileImageUploadModal({
  isOpen,
  onClose,
  currentImage,
  gravatarUrl,
  onImageUpdated,
}: ProfileImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large! Maximum size is 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error('Please select a file');
      return;
    }

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      const response = await authService.uploadProfileImage(file);

      if (response.success && response.data?.imageUrl) {
        toast.success('Profile image updated successfully!');
        onImageUpdated(response.data.imageUrl);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onClose();
      } else {
        toast.error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Remove your profile image?')) return;

    setUploading(true);

    try {
      const response = await authService.removeProfileImage();

      if (response.success) {
        toast.success('Profile image removed. Using Gravatar.');
        onImageUpdated(gravatarUrl || '');
        setPreview(null);
        onClose();
      } else {
        toast.error(response.message || 'Failed to remove image');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#18181b] border border-white/10 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Profile Image</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 p-1 rounded-md hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preview */}
          {preview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg shadow-blue-500/20">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-zinc-400 text-center">Preview of your new profile image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 shadow-lg bg-zinc-900">
                {currentImage ? (
                  <img src={currentImage} alt="Current" className="w-full h-full object-cover" />
                ) : gravatarUrl ? (
                  <img src={gravatarUrl} alt="Gravatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                    No Image
                  </div>
                )}
              </div>
              <p className="text-sm text-zinc-400 text-center">Current profile image</p>
            </div>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="profileImageInput"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || preview !== null}
            className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
          >
            <Upload className="w-4 h-4" />
            Choose Image
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={uploading || preview === null}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:opacity-50 text-white font-medium rounded-lg transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || preview === null}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Upload'
              )}
            </button>
          </div>

          {/* Remove Button */}
          {currentImage && (
            <button
              onClick={handleRemoveImage}
              disabled={uploading}
              className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              Remove Image
            </button>
          )}

          {/* File Info */}
          <div className="text-xs text-zinc-500 text-center pt-2 border-t border-white/5">
            <p>Max size: 5MB • Formats: JPEG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
