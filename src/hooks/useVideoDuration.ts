import { useEffect, useState } from 'react';

export const useVideoDuration = (videoUrl: string) => {
  const [duration, setDuration] = useState<string>('0:00');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';

    const handleLoadedMetadata = () => {
      if (isFinite(video.duration) && video.duration > 0) {
        const hours = Math.floor(video.duration / 3600);
        const minutes = Math.floor((video.duration % 3600) / 60);
        const seconds = Math.floor(video.duration % 60);

        if (hours > 0) {
          setDuration(
            `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        } else {
          setDuration(`${minutes}:${String(seconds).padStart(2, '0')}`);
        }
      }
      setIsLoading(false);
    };

    const handleError = (err: Event) => {
      setError('Failed to load video duration');
      setIsLoading(false);
      console.error('Video load error:', err);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // Set timeout for loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        setError('Video loading timeout');
        setIsLoading(false);
      }
    }, 10000);

    video.src = videoUrl;

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.src = '';
    };
  }, [videoUrl]);

  return { duration, isLoading, error };
};
