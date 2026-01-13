import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { uploadToB2 } from '../lib/b2Upload';
import { Upload, X, Image as ImageIcon, Link2, Music, Film, FileText } from 'lucide-react';

interface MediaUploadProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
  document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export default function MediaUpload({ userId, userName, onSuccess }: MediaUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMediaType = (file: File): string => {
    if (ALLOWED_TYPES.image.includes(file.type)) return 'image';
    if (ALLOWED_TYPES.video.includes(file.type)) return 'video';
    if (ALLOWED_TYPES.audio.includes(file.type)) return 'audio';
    if (ALLOWED_TYPES.document.includes(file.type)) return 'document';
    return 'unknown';
  };

  const isValidFile = (file: File): boolean => {
    const allAllowed = Object.values(ALLOWED_TYPES).flat();
    return allAllowed.includes(file.type);
  };

  const getFileIcon = (file: File) => {
    const type = getMediaType(file);
    switch (type) {
      case 'image':
        return <ImageIcon className="w-12 h-12 text-blue-500" />;
      case 'video':
        return <Film className="w-12 h-12 text-purple-500" />;
      case 'audio':
        return <Music className="w-12 h-12 text-green-500" />;
      case 'document':
        return <FileText className="w-12 h-12 text-orange-500" />;
      default:
        return <Upload className="w-12 h-12 text-slate-400" />;
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!isValidFile(file)) {
      setError('File type not supported. Please upload an image, video, audio, or document.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File must be smaller than 50MB');
      return;
    }

    setImageFile(file);
    setError(null);

    const type = getMediaType(file);
    
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('Title is required');
      return;
    }

    if (uploadMode === 'file' && !imageFile) {
      setError('Please select a file');
      return;
    }

    if (uploadMode === 'url' && !imageUrl) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = imageUrl;
      let mediaType = 'image';

      if (uploadMode === 'file' && imageFile) {
        mediaType = getMediaType(imageFile);

        // Upload to Backblaze B2 via Edge Function
        const { publicUrl, error: uploadError } = await uploadToB2(
          imageFile,
          `media/${userId}`
        );

        if (uploadError) throw uploadError;

        finalImageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('media_items').insert([
        {
          user_id: userId,
          title,
          creator: userName,
          description: description || null,
          thumbnail_url: finalImageUrl,
          type: mediaType,
          category: category || null,
          views_count: 0,
          like_count: 0,
        },
      ]);

      if (insertError) throw insertError;

      setTitle('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview(null);
      setCategory('');
      setIsOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition flex items-center gap-2 z-40"
      >
        <Upload className="w-6 h-6" />
        <span className="hidden sm:inline font-medium">Post Content</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Post Content</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setImageFile(null);
              setImagePreview(null);
              setImageUrl('');
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Summer Vibes"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Media Source *
            </label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('file');
                  setImageUrl('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  uploadMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('url');
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  uploadMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Link2 className="w-4 h-4" />
                Use URL
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className={`w-6 h-6 ${dragActive ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className={`font-medium ${dragActive ? 'text-blue-600' : 'text-slate-600'}`}>
                    {dragActive ? 'Drop your file here' : 'Click to upload or drag file'}
                  </span>
                  <span className="text-sm text-slate-500">Image, video, audio, or document (max 50MB)</span>
                </div>

                {imageFile && (
                  <div className="mt-3 w-full">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {getFileIcon(imageFile)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{imageFile.name}</p>
                        <p className="text-xs text-slate-500">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={imageUrl || ''}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="https://example.com/media.jpg"
                />
                {imageUrl && (
                  <div className="mt-2 w-full h-40 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setError('Invalid media URL')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Tell us about this content..."
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">Select a category</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="music">Music</option>
              <option value="podcast">Podcast</option>
              <option value="art">Art</option>
              <option value="writing">Writing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
                setImageFile(null);
                setImagePreview(null);
                setImageUrl('');
              }}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
