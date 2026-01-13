import React, { useEffect, useState, useRef } from 'react';

interface VideoFrameSelectorProps {
  videoFile: File;
  onFrameSelect: (frameDataUrl: string, timestamp: number) => void;
  selectedTimestamp?: number;
}

export default function VideoFrameSelector({
  videoFile,
  onFrameSelect,
  selectedTimestamp,
}: VideoFrameSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(selectedTimestamp ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create hidden video and canvas elements for processing
  useEffect(() => {
    if (videoRef.current && drawCanvasRef.current) return;

    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.preload = 'metadata';
    v.style.display = 'none';
    document.body.appendChild(v);

    const c = document.createElement('canvas');
    c.style.display = 'none';
    document.body.appendChild(c);

    videoRef.current = v;
    drawCanvasRef.current = c;

    return () => {
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
      if (drawCanvasRef.current && document.body.contains(drawCanvasRef.current)) {
        document.body.removeChild(drawCanvasRef.current);
      }
    };
  }, []);

  // Initialize video when file changes
  useEffect(() => {
    if (!videoFile || !videoRef.current || !drawCanvasRef.current || !displayCanvasRef.current) return;

    setLoading(true);
    setError(null);
    let isMounted = true;
    let allTimeoutsCleared = false;

    try {
      const videoUrl = URL.createObjectURL(videoFile);
      const video = videoRef.current;
      video.src = videoUrl;

      const handleLoadedMetadata = () => {
        if (!isMounted) return;

        console.log('Video loaded:', video.duration, 'seconds');

        if (isMounted) {
          setDuration(video.duration);

          const initialTime = selectedTimestamp ?? 0;
          setCurrentTime(initialTime);
          video.currentTime = initialTime;
        }
      };

      const handleSeeked = () => {
        if (!isMounted) return;

        captureFrame(initialTime, video, drawCanvasRef.current!, displayCanvasRef.current!);
        if (isMounted) {
          setLoading(false);
        }
      };

      const handleError = (e: Event) => {
        if (!isMounted) return;
        console.error('Video error:', e);
        setError('Failed to load video. Please try a different file.');
        setLoading(false);
      };

      const initialTime = selectedTimestamp ?? 0;
      let seekTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      video.addEventListener('seeked', handleSeeked, { once: true });
      video.addEventListener('error', handleError, { once: true });

      // Timeout for seeking after metadata is loaded
      seekTimeoutId = setTimeout(() => {
        if (isMounted && video.readyState >= 2) {
          captureFrame(initialTime, video, drawCanvasRef.current!, displayCanvasRef.current!);
          setLoading(false);
        }
      }, 1000);

      // Timeout for metadata to load (30 seconds for large files)
      loadTimeoutId = setTimeout(() => {
        if (isMounted && video.readyState < 1) {
          setError('Video took too long to load. Please try uploading again.');
          setLoading(false);
        }
      }, 30000);

      return () => {
        isMounted = false;
        allTimeoutsCleared = true;
        if (seekTimeoutId) clearTimeout(seekTimeoutId);
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
        URL.revokeObjectURL(videoUrl);
      };
    } catch (err) {
      if (isMounted) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Video initialization error:', msg);
        setError(msg);
        setLoading(false);
      }
    }
  }, [videoFile, selectedTimestamp]);

  const captureFrame = (time: number, v: HTMLVideoElement, drawCanvas: HTMLCanvasElement, displayCanvas: HTMLCanvasElement) => {
    try {
      // Draw to the hidden canvas for JPEG export
      const drawCtx = drawCanvas.getContext('2d');
      if (!drawCtx) {
        console.error('Failed to get draw canvas context');
        return;
      }

      drawCanvas.width = v.videoWidth;
      drawCanvas.height = v.videoHeight;
      drawCtx.drawImage(v, 0, 0);
      const dataUrl = drawCanvas.toDataURL('image/jpeg', 0.9);

      // Also draw to the display canvas for preview
      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        displayCanvas.width = v.videoWidth;
        displayCanvas.height = v.videoHeight;
        displayCtx.drawImage(v, 0, 0);
      }

      onFrameSelect(dataUrl, time);
    } catch (err) {
      console.error('Error capturing frame:', err);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);

    if (!videoRef.current || !drawCanvasRef.current || !displayCanvasRef.current) return;

    const video = videoRef.current;
    const drawCanvas = drawCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    video.currentTime = time;

    // Capture frame after seeking completes
    const handleSeeked = () => {
      captureFrame(time, video, drawCanvas, displayCanvas);
      video.removeEventListener('seeked', handleSeeked);
    };

    video.addEventListener('seeked', handleSeeked, { once: true });

    // Timeout fallback if seeking doesn't complete
    setTimeout(() => {
      video.removeEventListener('seeked', handleSeeked);
      captureFrame(time, video, drawCanvas, displayCanvas);
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700 font-medium">Error loading video</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Thumbnail Frame
        </label>
        <p className="text-xs text-slate-500 mb-4">
          Drag the slider to choose which moment from your video will be the thumbnail
        </p>
      </div>

      {/* Canvas Preview - Renders captured frames */}
      <div className="relative bg-black rounded-lg overflow-hidden border border-slate-200">
        <canvas
          ref={displayCanvasRef}
          className="w-full h-auto block"
          style={{ aspectRatio: '16/9', display: 'block', maxWidth: '100%' }}
        />
        {loading && (
          <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-slate-400 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="text-sm text-slate-300">Loading preview...</span>
          </div>
        )}
      </div>

      {/* Slider and Time Display */}
      {duration > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Current time</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            disabled={loading}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${
                (currentTime / duration) * 100
              }%, rgb(226, 232, 240) ${(currentTime / duration) * 100}%, rgb(226, 232, 240) 100%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
