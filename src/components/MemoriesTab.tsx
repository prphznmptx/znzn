import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Upload,
  Image as ImageIcon,
  Send,
  X,
  Search,
  Calendar,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { EventMemory, EventComment } from '../types/events';

const mockMemories: EventMemory[] = [
  {
    id: 'mem-1',
    event_id: 'event-1',
    user_id: 'user-1',
    user_name: 'Sarah Johnson',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    image_url: 'https://images.pexels.com/photos/1190299/pexels-photo-1190299.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Amazing night at the concert! The energy was incredible 🎉',
    likes_count: 42,
    comments_count: 8,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mem-2',
    event_id: 'event-2',
    user_id: 'user-2',
    user_name: 'James Okonkwo',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    image_url: 'https://www.musicnetwork.ie/content/images/MusicNetWicklow098.jpg?v=1712756689',
    caption: 'Incredible music workshop today! Learning from amazing musicians and making beautiful melodies 🎵',
    likes_count: 28,
    comments_count: 5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'mem-3',
    event_id: 'event-3',
    user_id: 'user-3',
    user_name: 'Emma Wilson',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    image_url: 'https://media.licdn.com/dms/image/v2/D5612AQENugUv0TaLqw/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1725857344878?e=2147483647&v=beta&t=6tH1e_tPqYHyF996-kz61KEfYjsTwJ7ZK4TJ2H52D9I',
    caption: 'What an amazing talent show! So many incredible performances and so much raw talent on display ⭐',
    likes_count: 67,
    comments_count: 15,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'mem-4',
    event_id: 'event-1',
    user_id: 'user-4',
    user_name: 'Michael Chen',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    image_url: 'https://images.stockcake.com/public/9/5/3/953f8b60-726d-424a-8fa5-2b103644e176_large/glamorous-red-carpet-stockcake.jpg',
    caption: 'What an incredible honor at the awards ceremony! So grateful for this recognition 🏆✨',
    likes_count: 51,
    comments_count: 12,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'mem-5',
    event_id: 'event-2',
    user_id: 'user-5',
    user_name: 'Priya Patel',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    image_url: 'https://cloudinary.hbs.edu/hbsit/image/upload/s--YEaAZu8k--/f_auto,c_fill,h_375,w_750,/v20200101/3F33AD7A268D611B6592AB041D96D76C.jpg',
    caption: 'Fantastic networking event! Met incredible professionals and had such meaningful conversations 👥',
    likes_count: 35,
    comments_count: 7,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: 'mem-6',
    event_id: 'event-3',
    user_id: 'user-6',
    user_name: 'Alex Rodriguez',
    user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    image_url: 'https://assets-au-01.kc-usercontent.com/1c344202-e9c0-02e1-35fd-d94199aa6f2b/d962324a-1eb2-4cee-a000-c23cd541e7db/AS_Coldplay_performance_1.jpg?w=1920&q=100&auto=format',
    caption: 'Best event of the year! The energy, the people, the experience - absolutely unforgettable! 🎉',
    likes_count: 73,
    comments_count: 19,
    created_at: new Date(Date.now() - 518400000).toISOString(),
    updated_at: new Date(Date.now() - 518400000).toISOString(),
  },
];

const mockComments: Record<string, EventComment[]> = {
  'mem-3': [
    {
      id: 'cmt-1',
      memory_id: 'mem-3',
      user_id: 'user-7',
      user_name: 'David Lee',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      content: 'Wish I could have been there!',
      likes_count: 3,
      created_at: new Date(Date.now() - 259200000 + 3600000).toISOString(),
    },
    {
      id: 'cmt-2',
      memory_id: 'mem-3',
      user_id: 'user-8',
      user_name: 'Sophie Martin',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie',
      content: 'You all did amazing! Great performance',
      likes_count: 5,
      created_at: new Date(Date.now() - 259200000 + 7200000).toISOString(),
    },
  ],
  'mem-6': [
    {
      id: 'cmt-3',
      memory_id: 'mem-6',
      user_id: 'user-9',
      user_name: 'Lucas Thompson',
      user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas',
      content: 'Absolutely agree! The organization was flawless',
      likes_count: 8,
      created_at: new Date(Date.now() - 518400000 + 3600000).toISOString(),
    },
  ],
};

interface MemoryWithComments extends EventMemory {
  comments?: EventComment[];
}

export default function MemoriesTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'gallery' | 'feed'>('gallery');
  const [selectedMemory, setSelectedMemory] = useState<MemoryWithComments | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [displayedMemories, setDisplayedMemories] = useState(mockMemories);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredMemories = displayedMemories.filter((mem) =>
    mem.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mem.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLike = (memoryId: string) => {
    setUserLikes((prev) => {
      const next = new Set(prev);
      if (next.has(memoryId)) {
        next.delete(memoryId);
      } else {
        next.add(memoryId);
      }
      return next;
    });
  };

  const handleAddComment = () => {
    if (!user) {
      alert('Please sign in to comment');
      return;
    }
    if (!commentText.trim() || !selectedMemory) return;

    const newComment: EventComment = {
      id: `cmt-${Date.now()}`,
      memory_id: selectedMemory.id,
      user_id: user.id || 'user-current',
      user_name: (user as any)?.name || 'You',
      user_avatar: (user as any)?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      content: commentText,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    if (!mockComments[selectedMemory.id]) {
      mockComments[selectedMemory.id] = [];
    }
    mockComments[selectedMemory.id].push(newComment);

    setCommentText('');
    setSelectedMemory({
      ...selectedMemory,
      comments: mockComments[selectedMemory.id],
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to upload a memory');
      return;
    }

    if (!uploadImage || !uploadCaption.trim()) {
      alert('Please select an image and write a caption');
      return;
    }

    setIsUploading(true);

    try {
      const newMemory: EventMemory = {
        id: `mem-${Date.now()}`,
        event_id: 'event-1',
        user_id: user.id || 'user-current',
        user_name: (user as any)?.name || (user as any)?.email?.split('@')[0] || 'Anonymous',
        user_avatar: (user as any)?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        image_url: uploadImage,
        caption: uploadCaption,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setDisplayedMemories((prev) => [newMemory, ...prev]);

      setUploadCaption('');
      setUploadImage(null);
      setUploadImageFile(null);
      setShowUploadModal(false);

      alert('✓ Memory uploaded successfully! Your memory is now in the gallery.');
    } catch (error) {
      alert('Failed to upload memory. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadCaption('');
    setUploadImage(null);
    setUploadImageFile(null);
    setShowUploadModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (selectedMemory) {
    const memoryComments = mockComments[selectedMemory.id] || [];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/80 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Memories</h2>
            <button
              onClick={() => setSelectedMemory(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="aspect-video rounded-xl overflow-hidden">
              <img
                src={selectedMemory.image_url}
                alt={selectedMemory.caption}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedMemory.user_avatar}
                    alt={selectedMemory.user_name}
                    className="w-12 h-12 rounded-full border-2 border-rose-400"
                  />
                  <div>
                    <h3 className="text-white font-semibold">{selectedMemory.user_name}</h3>
                    <p className="text-gray-400 text-sm">{formatDate(selectedMemory.created_at)}</p>
                  </div>
                </div>
                <button className="px-4 py-2 glass-effect text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium">
                  Follow
                </button>
              </div>

              <p className="text-white text-lg leading-relaxed">{selectedMemory.caption}</p>

              <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleToggleLike(selectedMemory.id)}
                  className={`flex items-center space-x-2 transition-all ${
                    userLikes.has(selectedMemory.id)
                      ? 'text-rose-400'
                      : 'text-gray-400 hover:text-rose-400'
                  }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={userLikes.has(selectedMemory.id) ? 'currentColor' : 'none'}
                  />
                  <span className="text-sm">{selectedMemory.likes_count + (userLikes.has(selectedMemory.id) ? 1 : 0)}</span>
                </button>

                <div className="flex items-center space-x-2 text-gray-400">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{memoryComments.length}</span>
                </div>

                <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>

            {memoryComments.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-white font-semibold mb-4">Comments ({memoryComments.length})</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {memoryComments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full border border-gray-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium text-sm">{comment.user_name}</span>
                          <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                        <button className="text-gray-500 text-xs mt-1 hover:text-gray-300">
                          ♥ {comment.likes_count}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-6">
              <div className="flex space-x-3">
                <img
                  src={
                    (user as any)?.avatar_url ||
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
                  }
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full border border-gray-700"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder={user ? 'Share your thoughts...' : 'Sign in to comment'}
                    disabled={!user}
                    className="flex-1 px-4 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!user || !commentText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showUploadModal) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900/80 backdrop-blur">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Upload className="w-6 h-6 text-rose-400" />
              <span>Share Memories</span>
            </h2>
            <button
              onClick={resetUploadForm}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmitMemory} className="p-6 space-y-6">
            <div>
              <label className="block text-white font-semibold mb-3">Select Photo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="memory-image-input"
                />
                {uploadImage ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-black">
                    <img
                      src={uploadImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <label
                      htmlFor="memory-image-input"
                      className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-white mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Change Photo</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="memory-image-input"
                    className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-white/20 hover:border-rose-400 transition-all cursor-pointer bg-white/5 hover:bg-white/10"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-white font-semibold mb-1">Click to upload photo</p>
                    <p className="text-gray-400 text-sm">or drag and drop</p>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Caption *</label>
              <textarea
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Share your memory... What was special about this moment?"
                rows={4}
                className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
                required
              />
              <p className="text-gray-400 text-xs mt-1">
                {uploadCaption.length}/280 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={resetUploadForm}
                className="flex-1 px-6 py-3 glass-effect text-gray-300 hover:text-white rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!uploadImage || !uploadCaption.trim() || isUploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Share Memory</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles className="w-6 h-6 text-rose-400" />
              <h2 className="text-2xl font-bold text-white">Event Memories</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Relive amazing moments from events. Share photos, memories, and connect with other attendees.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 flex-shrink-0 text-sm md:text-base"
            >
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Share Memories</span>
              <span className="sm:hidden">Share</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveView('gallery')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
              activeView === 'gallery'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                : 'glass-effect text-gray-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span>Gallery</span>
          </button>
          <button
            onClick={() => setActiveView('feed')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
              activeView === 'feed'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                : 'glass-effect text-gray-300 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>Chat</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder={activeView === 'gallery' ? 'Search memories...' : 'Search conversations...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all text-sm md:text-base"
          />
        </div>
      </div>

      {activeView === 'gallery' ? (
        filteredMemories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                onClick={() =>
                  setSelectedMemory({
                    ...memory,
                    comments: mockComments[memory.id] || [],
                  })
                }
                className="glass-effect rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-black overflow-hidden">
                  <img
                    src={memory.image_url}
                    alt={memory.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 text-white mx-auto mb-2" />
                      <p className="text-white text-sm font-semibold">View Memories</p>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm">{memory.caption}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <img
                        src={memory.user_avatar}
                        alt={memory.user_name}
                        className="w-6 h-6 rounded-full border border-gray-700"
                      />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-xs md:text-sm truncate">{memory.user_name}</p>
                        <p className="text-gray-500 text-xs">{formatDate(memory.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs md:text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(memory.id);
                      }}
                      className={`flex items-center space-x-1 transition-all ${
                        userLikes.has(memory.id)
                          ? 'text-rose-400'
                          : 'text-gray-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={userLikes.has(memory.id) ? 'currentColor' : 'none'}
                      />
                      <span>{memory.likes_count + (userLikes.has(memory.id) ? 1 : 0)}</span>
                    </button>

                    <div className="flex items-center space-x-1 text-gray-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>{memory.comments_count}</span>
                    </div>

                    <button className="text-gray-400 hover:text-white transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-effect rounded-2xl">
            <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Memories Found</h3>
            <p className="text-gray-400 mb-6">Start by uploading photos from your favorite events.</p>
            {user && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center space-x-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Memory</span>
              </button>
            )}
          </div>
        )
      ) : (
        <div className="glass-effect rounded-2xl overflow-hidden">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {filteredMemories.length > 0 ? (
              filteredMemories.map((memory) => (
                <div key={memory.id} className="flex space-x-4 pb-4 border-b border-white/10 last:border-0">
                  <img
                    src={memory.user_avatar}
                    alt={memory.user_name}
                    className="w-10 h-10 rounded-full border border-gray-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-semibold text-sm">{memory.user_name}</p>
                      <p className="text-gray-500 text-xs">{formatDate(memory.created_at)}</p>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{memory.caption}</p>
                    <button
                      onClick={() =>
                        setSelectedMemory({
                          ...memory,
                          comments: mockComments[memory.id] || [],
                        })
                      }
                      className="text-rose-400 text-xs font-medium hover:text-rose-300"
                    >
                      View {mockComments[memory.id]?.length || 0} Comments
                    </button>
                  </div>
                  <img
                    src={memory.image_url}
                    alt={memory.caption}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      setSelectedMemory({
                        ...memory,
                        comments: mockComments[memory.id] || [],
                      })
                    }
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet. Be part of the community!</p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex space-x-3">
              <img
                src={
                  (user as any)?.avatar_url ||
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
                }
                alt="Your avatar"
                className="w-8 h-8 rounded-full border border-gray-700 flex-shrink-0"
              />
              <div className="flex-1 flex space-x-2 min-w-0">
                <input
                  type="text"
                  placeholder={user ? 'Share your thoughts...' : 'Sign in to chat'}
                  disabled={!user}
                  className="flex-1 px-4 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                />
                <button
                  disabled={!user}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
