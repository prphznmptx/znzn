import React, { useState, useRef, useMemo } from 'react';
import { UploadCloud, X, Music, Film, ImageIcon, FileText, Edit2, Eye, Heart, Calendar, Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToB2 } from '../lib/b2Upload';
import { useAuth } from '../context/AuthContext';
import { useMediaPageEdit } from '../hooks/useMediaPageEdit';
import { useMyContent } from '../hooks/useMyContent';
import { useContentPublication } from '../hooks/useContentPublication';
import { useContentDeletion } from '../hooks/useContentDeletion';
import { extractDuration } from '../lib/getDuration';
import { updateDurationInDatabase } from '../lib/updateDurationInDatabase';
import EditContentModal from '../components/EditContentModal';
import PublicationStatusBadge from '../components/PublicationStatusBadge';
import ContentCountdownTimer from '../components/ContentCountdownTimer';

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

const CONTENT_CATEGORIES = {
  'music-video': ['latest-release', 'new-talent', 'greatest-of-all-time', 'DJ-mixtapes', 'UG-Unscripted', 'Afrobeat', 'hip-hop', 'RnB', 'Others', 'Challenges'],
  'audio-music': ['latest-release', 'new-talent', 'greatest-of-all-time', 'DJ-mixtapes', 'UG-Unscripted', 'Afrobeat', 'hip-hop', 'RnB', 'Others', 'Challenges'],
  'movie': ['action', 'comedy', 'drama', 'horror', 'romance', 'science-fiction', 'thriller', 'documentary', 'animation', 'others'],
  'tv-show': ['drama', 'comedy', 'reality', 'thriller', 'documentary', 'animation', 'others'],
  'podcast': ['interviews', 'behind-the-scenes', 'radio', 'live'],
  'blog': ['stories', 'insights', 'lifestyle'],
  'image': ['design', 'photography', 'art', 'others'],
  'contest': ['ughha', 'asfa', 'miss-uganda'],
};

export default function Content() {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('music-video');
  const [category, setCategory] = useState('');
  const [publicationDestination, setPublicationDestination] = useState<'media' | 'portfolio'>('media');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'not-published' | 'pending-deletion'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // My Content state using custom hook
  const { contentItems, loading: contentLoading, error: contentError, updateContentItem, removeContentItem } = useMyContent(user?.id);
  const [editingContent, setEditingContent] = useState<typeof contentItems[0] | null>(null);
  const [editError, setEditError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishingContentId, setPublishingContentId] = useState<string | null>(null);
  const [savingContentId, setSavingContentId] = useState<string | null>(null);

  const { editContent } = useMediaPageEdit();
  const { publishToDestination, unpublishFromDestination } = useContentPublication();
  const { deleteFromDestination, saveContent, getDeletionInfo } = useContentDeletion();

  // Auto-update durations for existing content with "0:00"
  const processedDurations = useRef<Set<string>>(new Set());
  const videoDurationTypes = ['music-video', 'movie', 'tv-show', 'podcast', 'audio-music'];

  React.useEffect(() => {
    contentItems.forEach((item) => {
      if (
        !processedDurations.current.has(item.id) &&
        (item.duration === '0:00' || !item.duration) &&
        videoDurationTypes.includes(item.type)
      ) {
        processedDurations.current.add(item.id);
        updateDurationInDatabase(item.id, item.content_url)
          .then((newDuration) => {
            if (newDuration) {
              updateContentItem(item.id, { duration: newDuration });
            }
          })
          .catch((err) => {
            console.error(`Failed to auto-update duration for ${item.id}:`, err);
          });
      }
    });
  }, [contentItems, updateContentItem]);

  const getMediaType = (file: File): string => {
    if (ALLOWED_TYPES.image.includes(file.type)) return 'image';
    if (ALLOWED_TYPES.video.includes(file.type)) return 'video';
    if (ALLOWED_TYPES.audio.includes(file.type)) return 'audio';
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
        return <ImageIcon className="w-12 h-12 text-blue-400" />;
      case 'video':
        return <Film className="w-12 h-12 text-purple-400" />;
      case 'audio':
        return <Music className="w-12 h-12 text-green-400" />;
      default:
        return <UploadCloud className="w-12 h-12 text-gray-400" />;
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!isValidFile(selectedFile)) {
      setError('File type not supported. Please upload an image, video, or audio file.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File must be smaller than 100MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const type = getMediaType(selectedFile);
    
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const handleThumbnailSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!Object.values(ALLOWED_TYPES.image).includes(selectedFile.type)) {
      setError('Thumbnail must be an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Thumbnail must be smaller than 10MB');
      return;
    }

    setThumbnail(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleThumbnailSelect(selectedFile);
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

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      setError('You must be logged in to upload content');
      return;
    }

    if (!title) {
      setError('Title is required');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!thumbnail) {
      setError('Please select a thumbnail image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine folder path based on destination
      const folderPath = publicationDestination === 'portfolio' ? 'portfolio_page_content' : 'media_page_content';
      const tableName = publicationDestination === 'portfolio' ? 'portfolio_page_content' : 'media_page_content';

      // Upload file to Backblaze B2
      const { publicUrl: contentUrl, error: uploadError } = await uploadToB2(
        file,
        `${folderPath}/${user.id}`
      );

      if (uploadError) throw uploadError;

      // Upload thumbnail to Backblaze B2
      const { publicUrl: thumbnailUrl, error: uploadThumbnailError } = await uploadToB2(
        thumbnail,
        `${folderPath}/${user.id}`
      );

      if (uploadThumbnailError) throw uploadThumbnailError;

      const mediaType = getMediaType(file);
      let duration: string | undefined = undefined;

      if ((mediaType === 'video' || mediaType === 'audio') && videoDurationTypes.includes(contentType)) {
        try {
          duration = await extractDuration(file);
        } catch (durationError) {
          console.error('Failed to extract duration:', durationError);
          duration = '0:00';
        }
      }

      // Prepare insert data with publication tracking
      const insertData = {
        user_id: user.id,
        title,
        creator: profile.name,
        description: description || null,
        thumbnail_url: thumbnailUrl,
        content_url: contentUrl,
        type: contentType,
        category: category || null,
        duration,
        views_count: 0,
        like_count: 0,
        is_premium: false,
        publication_destination: publicationDestination,
        published_to: [publicationDestination],
        saved: false,
        status: 'published',
      };

      const { data: insertedData, error: insertError } = await supabase
        .from(tableName)
        .insert([insertData])
        .select();

      if (insertError) throw insertError;

      if (insertedData && insertedData.length > 0) {
        const contentWithSource = { ...insertedData[0], source: publicationDestination };
        updateContentItem(insertedData[0].id, contentWithSource, publicationDestination);
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setFile(null);
      setPreview(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setContentType('music-video');
      setCategory('');
      setPublicationDestination('media' as 'media' | 'portfolio');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (content: typeof contentItems[0]) => {
    setEditingContent(content);
    setEditError(undefined);
  };

  const handleEditClose = () => {
    setEditingContent(null);
    setEditError(undefined);
  };

  const handleEditSave = async (payload: {
    title: string;
    description?: string;
    category?: string;
    is_premium?: boolean;
  }) => {
    if (!editingContent) return;

    setIsSaving(true);
    setEditError(undefined);

    const result = await editContent(editingContent.id, payload, editingContent.source);

    if (result.success) {
      updateContentItem(editingContent.id, {
        title: payload.title,
        description: payload.description || '',
        category: payload.category || '',
        is_premium: payload.is_premium ?? false,
      }, editingContent.source);
      handleEditClose();
    } else {
      setEditError(result.error || 'Failed to save changes');
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!editingContent) return;

    setIsDeleting(true);
    setEditError(undefined);

    try {
      const tableName = editingContent.source === 'portfolio' ? 'portfolio_page_content' : 'media_page_content';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', editingContent.id);

      if (error) {
        setEditError(error.message || 'Failed to delete content');
        setIsDeleting(false);
        return;
      }

      removeContentItem(editingContent.id, editingContent.source);
      handleEditClose();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to delete content');
    }

    setIsDeleting(false);
  };

  const handlePublishContent = async (contentId: string, destination: 'media' | 'portfolio') => {
    setPublishingContentId(contentId);
    const content = contentItems.find((item) => item.id === contentId);
    const result = await publishToDestination(contentId, destination, content?.source);
    if (result.success) {
      if (content) {
        const publishedTo = content.published_to || [];
        const newPublishedTo = [...new Set([...publishedTo, destination])];
        updateContentItem(contentId, {
          published_to: newPublishedTo,
          status: 'published',
          publication_destination: destination,
        }, content.source);
      }
    } else {
      setEditError(result.error || 'Failed to publish content');
    }
    setPublishingContentId(null);
  };

  const handleSaveContent = async (contentId: string) => {
    setSavingContentId(contentId);
    const content = contentItems.find((item) => item.id === contentId);
    const result = await saveContent(contentId, content?.source);
    if (result.success) {
      if (content) {
        updateContentItem(contentId, {
          saved: true,
          status: 'draft',
          deleted_at: null,
          auto_delete_at: null,
          is_deleted_pending: false,
        }, content.source);
      }
    }
    setSavingContentId(null);
  };

  const filteredAndSortedContent = useMemo(() => {
    let filtered = contentItems;

    if (filterStatus === 'published') {
      filtered = filtered.filter((item) => item.status === 'published' && item.published_to && item.published_to.length > 0);
    } else if (filterStatus === 'not-published') {
      filtered = filtered.filter((item) => item.status === 'draft');
    } else if (filterStatus === 'pending-deletion') {
      filtered = filtered.filter((item) => item.status === 'pending_deletion' && !item.saved);
    }

    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [contentItems, filterStatus, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Upload Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">Add Content</h1>
          <p className="text-gray-300 mb-8">Upload your creative work to share with the world.</p>

          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  placeholder="Enter a title for your content"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us more about your content"
                />
              </div>

              {/* Grid layout for type, category, and publication destination */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content Type *</label>
                  <select
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      setCategory('');
                    }}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  >
                    <option value="music-video" className="bg-gray-800">Music Video</option>
                    <option value="audio-music" className="bg-gray-800">Audio/Music</option>
                    <option value="movie" className="bg-gray-800">Movie/Film</option>
                    <option value="tv-show" className="bg-gray-800">TV Show</option>
                    <option value="podcast" className="bg-gray-800">Podcast</option>
                    <option value="blog" className="bg-gray-800">Blog</option>
                    <option value="image" className="bg-gray-800">Image</option>
                    <option value="document" className="bg-gray-800">Document</option>
                    <option value="contest" className="bg-gray-800">Contest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  >
                    <option value="" className="bg-gray-800">Select a category</option>
                    {CONTENT_CATEGORIES[contentType as keyof typeof CONTENT_CATEGORIES]?.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-800">
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Publish To *</label>
                  <select
                    value={publicationDestination}
                    onChange={(e) => setPublicationDestination(e.target.value as 'media' | 'portfolio')}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  >
                    <option value="media" className="bg-gray-800">Media</option>
                    <option value="portfolio" className="bg-gray-800">Portfolio</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Content Thumbnail *</label>
                <p className="text-xs text-gray-400 mb-3">Upload an image to represent your content (displayed on media/portfolio pages)</p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  onChange={handleThumbnailInputChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  className={`w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive
                      ? 'border-rose-400 bg-rose-400/10'
                      : 'border-gray-600 hover:border-rose-400 hover:bg-rose-400/5'
                  }`}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <ImageIcon className={`w-12 h-12 ${dragActive ? 'text-rose-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${dragActive ? 'text-rose-400' : 'text-gray-300'}`}>
                    Click to upload thumbnail image
                  </span>
                  <span className="text-sm text-gray-500">PNG, JPG, GIF, or WebP (max 10MB)</span>
                </div>

                {thumbnail && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <ImageIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{thumbnail.name}</p>
                        <p className="text-xs text-gray-400">{(thumbnail.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail(null);
                          setThumbnailPreview(null);
                        }}
                        className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {thumbnailPreview && (
                      <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border border-gray-700">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Upload File *</label>
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
                  className={`w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive
                      ? 'border-rose-400 bg-rose-400/10'
                      : 'border-gray-600 hover:border-rose-400 hover:bg-rose-400/5'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className={`w-12 h-12 ${dragActive ? 'text-rose-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${dragActive ? 'text-rose-400' : 'text-gray-300'}`}>
                    {dragActive ? 'Drop your file here' : 'Click to upload or drag file'}
                  </span>
                  <span className="text-sm text-gray-500">Image, video, or audio (max 100MB)</span>
                </div>

                {file && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                      {getFileIcon(file)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                        }}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {preview && (
                      <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border border-gray-700">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">Content uploaded successfully! It will appear in your content list below.</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Content'}
              </button>
            </form>
          </div>
        </div>

        {/* Your Content Section */}
        <div>
          <h2 className="text-3xl font-playfair font-bold text-white mb-2">Your Content</h2>
          <p className="text-gray-300 mb-6">Manage and edit your uploaded content</p>

          {/* Error Message */}
          {contentError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{contentError}</p>
            </div>
          )}

          {/* Filter and Sort Controls */}
          {contentItems.length > 0 && (
            <div className="mb-6 bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Filter by Status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'published', label: 'Published' },
                    { value: 'not-published', label: 'Not Published' },
                    { value: 'pending-deletion', label: 'Pending Deletion' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterStatus(filter.value as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === filter.value
                          ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {contentLoading && contentItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading your content...</p>
            </div>
          ) : filteredAndSortedContent.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedContent.map((item) => {
                const deletionInfo = getDeletionInfo(item.status || 'draft', item.deleted_at || null, item.auto_delete_at || null, item.saved || false);
                const publishedTo = (item.published_to || []) as string[];
                const isPublished = publishedTo.length > 0;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    {/* Countdown Timer for pending deletion */}
                    {deletionInfo.isDeletedPending && item.auto_delete_at && (
                      <div className="mb-4">
                        <ContentCountdownTimer
                          autoDeleteAt={item.auto_delete_at}
                          onSave={() => handleSaveContent(item.id)}
                          isSaving={savingContentId === item.id}
                        />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="md:w-40 md:h-24 flex-shrink-0">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white truncate">{item.title}</h3>
                            {item.category && (
                              <p className="text-sm text-gray-400 capitalize">{item.category}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.is_premium && (
                              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs font-bold rounded">
                                PREMIUM
                              </span>
                            )}
                            {item.source && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                                item.source === 'portfolio'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {item.source}
                              </span>
                            )}
                            <PublicationStatusBadge
                              status={item.status || 'draft'}
                              publishedTo={publishedTo}
                              isDeletedPending={deletionInfo.isDeletedPending}
                              daysUntilDeletion={deletionInfo.daysUntilDeletion}
                              saved={item.saved}
                            />
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.views_count.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{item.like_count.toLocaleString()} likes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 md:flex-col">
                        {!isPublished && (
                          <button
                            onClick={() => handlePublishContent(item.id, item.publication_destination as 'media' | 'portfolio' || 'media')}
                            disabled={publishingContentId === item.id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Publish</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditOpen(item)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Edit2 className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
              <p className="text-gray-400">Start by uploading your first piece of content above</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingContent && (
        <EditContentModal
          isOpen={!!editingContent}
          title={editingContent.title}
          description={editingContent.description}
          category={editingContent.category}
          isPremium={editingContent.is_premium}
          publishedTo={(editingContent.published_to || []) as string[]}
          status={editingContent.status}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={handleEditClose}
          isSaving={isSaving}
          isDeleting={isDeleting}
          error={editError}
        />
      )}
    </div>
  );
}
