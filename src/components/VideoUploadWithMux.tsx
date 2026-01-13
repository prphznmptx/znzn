import { useState, useRef } from 'react';
import { useVideoUpload } from '../hooks/useVideoUpload';
import { supabase } from '../lib/supabase';
import { Upload, X, Film, Loader, Check, AlertCircle } from 'lucide-react';
import VideoFrameSelector from './VideoFrameSelector';

interface VideoUploadWithMuxProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export default function VideoUploadWithMux({ userId, userName, onSuccess }: VideoUploadWithMuxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [selectedFrameDataUrl, setSelectedFrameDataUrl] = useState<string | null>(null);
  const [selectedFrameTimestamp, setSelectedFrameTimestamp] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isUploading,
    isProcessing,
    isReady,
    progress,
    error: uploadError,
    playbackId,
    uploadId,
    uploadVideo,
    resetState,
  } = useVideoUpload();

  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  const isValidVideoFile = (file: File): boolean => {
    return ALLOWED_VIDEO_TYPES.includes(file.type) && file.size <= 500 * 1024 * 1024; // 500MB limit
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!isValidVideoFile(file)) {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        setLocalError('Video type not supported. Please upload MP4, WebM, MOV, or AVI.');
      } else {
        setLocalError('Video must be smaller than 500MB');
      }
      return;
    }

    setVideoFile(file);
    setLocalError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setLocalError('Title is required');
      return;
    }

    if (!videoFile) {
      setLocalError('Please select a video file');
      return;
    }

    setLocalError(null);
    await uploadVideo(videoFile, userId);
  };

  const uploadCustomThumbnail = async (frameDataUrl: string): Promise<string> => {
    try {
      // Convert data URL to blob
      const response = await fetch(frameDataUrl);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const filename = `thumbnails/${userId}/${timestamp}-thumbnail.jpg`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('media_page_content')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('media_page_content')
        .getPublicUrl(filename);

      return publicUrlData.publicUrl;
    } catch (err) {
      throw new Error(`Failed to upload thumbnail: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveContent = async () => {
    if (!title || !playbackId) {
      setLocalError('Missing required information');
      return;
    }

    setIsSavingContent(true);
    setLocalError(null);

    try {
      // Use selected frame thumbnail if available, otherwise use Mux default
      let thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

      if (selectedFrameDataUrl) {
        thumbnailUrl = await uploadCustomThumbnail(selectedFrameDataUrl);
      }

      const { error } = await supabase.from('media_page_content').insert([
        {
          user_id: userId,
          title: title.trim(),
          creator: userName,
          description: description.trim() || null,
          type: 'music-video',
          category: category || null,
          thumbnail_url: thumbnailUrl,
          content_url: `https://stream.mux.com/${playbackId}.m3u8`,
          status: 'published',
          publication_destination: 'media',
          published_to: ['media'],
          views_count: 0,
          like_count: 0,
          is_premium: false,
        },
      ]);

      if (error) throw error;

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setVideoFile(null);
      setSelectedFrameDataUrl(null);
      setSelectedFrameTimestamp(null);
      resetState();
      setIsOpen(false);
      onSuccess();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setVideoFile(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setLocalError(null);
    setSelectedFrameDataUrl(null);
    setSelectedFrameTimestamp(null);
    resetState();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition flex items-center gap-2 z-40"
        title="Upload Video"
      >
        <Film className="w-6 h-6" />
        <span className="hidden sm:inline font-medium">Upload Video</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-slate-800">Upload Video</h3>
          <button
            onClick={handleClose}
            disabled={isUploading || isProcessing || isSavingContent}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleStartUpload} className="p-6 space-y-5">
          {/* Video File Selection */}
          {!isReady && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Video File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleInputChange}
                  accept="video/*"
                  className="hidden"
                  disabled={isUploading || isProcessing}
                />
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition flex flex-col items-center justify-center gap-2 ${
                    isUploading || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-300 hover:border-purple-500 hover:bg-purple-50'
                  }`}
                  onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
                >
                  {isUploading || isProcessing ? (
                    <>
                      <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                      <span className="font-medium text-slate-600">
                        {isUploading ? 'Uploading...' : 'Processing video...'}
                      </span>
                      <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-6 h-6 text-slate-600" />
                      <span className="font-medium text-slate-600">
                        {dragActive ? 'Drop your video here' : 'Click to upload or drag video'}
                      </span>
                      <span className="text-sm text-slate-500">MP4, WebM, MOV (max 500MB)</span>
                    </>
                  )}
                </div>

                {videoFile && !isProcessing && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{videoFile.name}</p>
                      <p className="text-xs text-slate-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading || isProcessing}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="e.g., My Music Video"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading || isProcessing}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Tell us about this video..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isUploading || isProcessing}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select a category</option>
                  <option value="music-video">Music Video</option>
                  <option value="movie">Movie</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="comedy">Comedy</option>
                  <option value="vlog">Vlog</option>
                  <option value="music">Music</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {videoFile && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <VideoFrameSelector
                    videoFile={videoFile}
                    onFrameSelect={(frameDataUrl, timestamp) => {
                      setSelectedFrameDataUrl(frameDataUrl);
                      setSelectedFrameTimestamp(timestamp);
                    }}
                    selectedTimestamp={selectedFrameTimestamp ?? undefined}
                  />
                </div>
              )}
            </>
          )}

          {/* Ready State */}
          {isReady && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Video Processing Complete</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your video has been successfully processed. Click save to publish it to your media page.
                  </p>
                </div>
              </div>

              {selectedFrameDataUrl && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-3">Your Selected Thumbnail</p>
                  <img
                    src={selectedFrameDataUrl}
                    alt="Selected thumbnail"
                    className="w-full h-auto rounded-lg border border-slate-200 object-cover"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Video Details:</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Title:</dt>
                    <dd className="text-blue-900 font-medium">{title}</dd>
                  </div>
                  {description && (
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Description:</dt>
                      <dd className="text-blue-900 line-clamp-2">{description}</dd>
                    </div>
                  )}
                  {category && (
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Category:</dt>
                      <dd className="text-blue-900 font-medium capitalize">{category}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(localError || uploadError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{localError || uploadError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading || isProcessing || isSavingContent}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {!isReady ? (
              <button
                type="submit"
                disabled={isUploading || isProcessing || !videoFile || !title.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isUploading || isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Process
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveContent}
                disabled={isSavingContent}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isSavingContent ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save & Publish
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
