import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface VideoUploadState {
  isUploading: boolean;
  isProcessing: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
  playbackId: string | null;
  assetId: string | null;
  uploadId: string | null;
}

export function useVideoUpload() {
  const [state, setState] = useState<VideoUploadState>({
    isUploading: false,
    isProcessing: false,
    isReady: false,
    progress: 0,
    error: null,
    playbackId: null,
    assetId: null,
    uploadId: null
  });

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      isProcessing: false,
      isReady: false,
      progress: 0,
      error: null,
      playbackId: null,
      assetId: null,
      uploadId: null
    });
  }, []);

  const uploadVideo = useCallback(async (
    file: File,
    userId: string
  ) => {
    resetState();

    try {
      setState(prev => ({ ...prev, isUploading: true, error: null }));

      // Step 1: Generate unique filename
      const timestamp = Date.now();
      const filename = `uploads/${userId}/${timestamp}-${file.name}`;
      const contentType = file.type || 'video/mp4';

      // Step 2: Upload file to B2 via Edge Function (server-side, no CORS issues)
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('filename', filename);
      uploadFormData.append('contentType', contentType);

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-to-b2',
        {
          body: uploadFormData
        }
      );

      if (uploadError || !uploadData?.publicUrl) {
        throw new Error(uploadError?.message || 'Failed to upload file to B2');
      }

      setState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: true,
        progress: 50
      }));

      // Step 4: Call process-new-video to trigger Mux encoding
      const { data: muxData, error: muxError } = await supabase.functions.invoke(
        'process-new-video',
        {
          body: { filename, userId }
        }
      );

      if (muxError || !muxData?.data?.id) {
        throw new Error(muxError?.message || 'Failed to process video with Mux');
      }

      const assetId = muxData.data.id;

      // Get the upload record ID that was just created
      const { data: uploadRecords, error: fetchError } = await supabase
        .from('video_uploads')
        .select('id')
        .eq('asset_id', assetId)
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Failed to fetch upload record:', fetchError);
      }

      const uploadId = uploadRecords && uploadRecords.length > 0 ? uploadRecords[0].id : null;

      setState(prev => ({
        ...prev,
        assetId,
        uploadId,
        progress: 75
      }));

      // Step 5: Poll for ready status
      await pollVideoStatus(assetId, userId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during upload';
      setState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        error: errorMessage
      }));
    }
  }, []);

  const pollVideoStatus = useCallback(async (assetId: string, userId: string) => {
    const maxAttempts = 120; // 10 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const { data: uploadRecords, error } = await supabase
          .from('video_uploads')
          .select('status, playback_id')
          .eq('asset_id', assetId)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        const data = uploadRecords && uploadRecords.length > 0 ? uploadRecords[0] : null;

        if (!data) {
          // Record might not exist yet due to database sync delay
          if (attempts > 2) {
            throw new Error('Upload record not found after multiple attempts');
          }
        } else if (data.status === 'ready' && data.playback_id) {
          setState(prev => ({
            ...prev,
            isProcessing: false,
            isReady: true,
            playbackId: data.playback_id,
            progress: 100
          }));
          return;
        } else if (data.status === 'failed') {
          throw new Error('Video processing failed');
        }

        // Wait 5 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Polling error';
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMessage
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      error: 'Video processing timeout'
    }));
  }, []);

  return {
    ...state,
    uploadVideo,
    resetState
  };
}
