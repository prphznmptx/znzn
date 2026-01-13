import React, { useEffect, useRef, useState } from 'react';

interface MuxPlayerProps {
  playbackId: string;
  thumbnailUrl?: string;
  title?: string;
  onDurationChange?: (duration: number) => void;
  onViewTracked?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': MuxPlayerElement;
    }
  }
}

interface MuxPlayerElement extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  'playback-id'?: string;
  'poster'?: string;
  'metadata-video-title'?: string;
  'stream-type'?: string;
  'controls'?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export default function MuxPlayer({
  playbackId,
  thumbnailUrl,
  title,
  onDurationChange,
  onViewTracked,
}: MuxPlayerProps) {
  const playerRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Player script is pre-loaded in App.tsx, just check if it's ready
    if (typeof (window as any).MuxPlayer === 'undefined') {
      // Script not yet loaded, wait a bit and try again
      const timer = setTimeout(() => {
        // Script should be loaded now
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!playerRef.current) return;

    const player = playerRef.current as any;

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasTrackedView && onViewTracked) {
        setHasTrackedView(true);
        onViewTracked();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleDurationChange = () => {
      if (onDurationChange && player.duration) {
        onDurationChange(player.duration);
      }
    };

    const handleLoadedmetadata = () => {
      if (onDurationChange && player.duration) {
        onDurationChange(player.duration);
      }
    };

    if (player.addEventListener) {
      player.addEventListener('play', handlePlay);
      player.addEventListener('pause', handlePause);
      player.addEventListener('durationchange', handleDurationChange);
      player.addEventListener('loadedmetadata', handleLoadedmetadata);
    }

    return () => {
      if (player.removeEventListener) {
        player.removeEventListener('play', handlePlay);
        player.removeEventListener('pause', handlePause);
        player.removeEventListener('durationchange', handleDurationChange);
        player.removeEventListener('loadedmetadata', handleLoadedmetadata);
      }
    };
  }, [onDurationChange, onViewTracked, hasTrackedView]);

  if (error) {
    return (
      <div className="w-full bg-black rounded-lg flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-2">Playback ID: {playbackId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <mux-player
        ref={playerRef}
        playback-id={playbackId}
        poster={thumbnailUrl}
        metadata-video-title={title || 'Video'}
        stream-type="on-demand"
        controls="true"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
