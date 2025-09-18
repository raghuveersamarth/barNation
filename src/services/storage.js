import { supabase } from './supabase';

// Upload a file to Supabase Storage in a specified bucket
export const uploadFile = async (bucketName, filePath, file) => {
  // filePath example: 'user_videos/userid/video.mp4'
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
  if (error) throw error;
  return data;
};

// Get public URL for a stored file
export const getPublicUrl = (bucketName, filePath) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

// Delete a stored file
export const deleteFile = async (bucketName, filePath) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);
  if (error) throw error;
  return data;
};
