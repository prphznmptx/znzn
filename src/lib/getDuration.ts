export const extractDuration = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const mediaElement = document.createElement(
      file.type.startsWith('video/') ? 'video' : 'audio'
    );
    mediaElement.crossOrigin = 'anonymous';

    const handleLoadedMetadata = () => {
      if (isFinite(mediaElement.duration) && mediaElement.duration > 0) {
        const hours = Math.floor(mediaElement.duration / 3600);
        const minutes = Math.floor((mediaElement.duration % 3600) / 60);
        const seconds = Math.floor(mediaElement.duration % 60);

        let formattedDuration: string;
        if (hours > 0) {
          formattedDuration = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
          formattedDuration = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }

        cleanup();
        resolve(formattedDuration);
      }
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Failed to load media duration'));
    };

    const cleanup = () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('error', handleError);
      mediaElement.src = '';
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Media duration detection timeout'));
    }, 10000);

    mediaElement.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      handleLoadedMetadata();
    });
    mediaElement.addEventListener('error', () => {
      clearTimeout(timeout);
      handleError();
    });

    mediaElement.src = URL.createObjectURL(file);
  });
};
