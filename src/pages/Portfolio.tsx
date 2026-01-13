import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Edit3, Eye, EyeOff, Plus, Star, Award, MapPin, Phone, Mail, Globe, Instagram, Twitter, Linkedin, Save, Upload, X, Mic, Clock, Play, BookOpen, Trash2, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePortfolioViewTracking } from '../hooks/usePortfolioViewTracking';
import { useContentDeletion } from '../hooks/useContentDeletion';
import { useMediaPageEdit } from '../hooks/useMediaPageEdit';
import { supabase } from '../lib/supabase';
import { uploadToB2 } from '../lib/b2Upload';
import EditContentModal from '../components/EditContentModal';
import ContentCountdownTimer from '../components/ContentCountdownTimer';

export default function Portfolio() {
  const { user } = useAuth();
  const { trackView } = usePortfolioViewTracking();
  const { deleteFromDestination, saveContent, getDeletionInfo } = useContentDeletion();
  const { editContent } = useMediaPageEdit();
  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [portfolioContent, setPortfolioContent] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editError, setEditError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingContentId, setSavingContentId] = useState<string | null>(null);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPortfolioContent = useCallback(async () => {
    try {
      setLoadingContent(true);
      const { data, error } = await supabase
        .from('portfolio_page_content')
        .select('*')
        .neq('status', 'archived')
        .neq('status', 'permanently_deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setPortfolioContent(data);
      }
    } catch (err) {
      console.error('Error fetching portfolio content:', err);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const handleEditOpen = (content: any) => {
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

    const result = await editContent(editingContent.id, payload, 'portfolio');

    if (result.success) {
      setPortfolioContent((prev) =>
        prev.map((item) =>
          item.id === editingContent.id
            ? {
                ...item,
                title: payload.title,
                description: payload.description || '',
                category: payload.category || '',
                is_premium: payload.is_premium ?? false,
              }
            : item
        )
      );
      handleEditClose();
    } else {
      setEditError(result.error || 'Failed to save changes');
    }

    setIsSaving(false);
  };

  const handleDelete = async (contentId: string) => {
    setDeletingContentId(contentId);
    setIsDeleting(true);
    setEditError(undefined);

    try {
      const { error } = await supabase
        .from('portfolio_page_content')
        .delete()
        .eq('id', contentId);

      if (error) {
        setEditError(error.message || 'Failed to delete content');
        setIsDeleting(false);
        return;
      }

      setPortfolioContent((prev) => prev.filter((item) => item.id !== contentId));
      handleEditClose();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to delete content');
    }

    setIsDeleting(false);
    setDeletingContentId(null);
  };

  const handleDeleteFromPortfolio = async (contentId: string) => {
    setDeletingContentId(contentId);
    const result = await deleteFromDestination(contentId, 'portfolio', 'portfolio');
    if (result.success) {
      // Update the content to show pending deletion status
      setPortfolioContent((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? { ...item, status: 'pending_deletion', is_deleted_pending: true }
            : item
        )
      );
    } else {
      setEditError(result.error || 'Failed to delete content');
    }
    setDeletingContentId(null);
  };

  const handleSaveContent = async (contentId: string) => {
    setSavingContentId(contentId);
    const result = await saveContent(contentId, 'portfolio');
    if (result.success) {
      setPortfolioContent((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? {
                ...item,
                saved: true,
                status: 'draft',
                deleted_at: null,
                auto_delete_at: null,
                is_deleted_pending: false,
              }
            : item
        )
      );
    }
    setSavingContentId(null);
  };

  // Track portfolio view on mount
  useEffect(() => {
    if (user) {
      trackView();
    }
  }, [user?.id]);

  // Fetch portfolio content
  useEffect(() => {
    fetchPortfolioContent();
  }, [fetchPortfolioContent]);

  const [portfolioData, setPortfolioData] = useState({
    profileImage: '',
    coverImage: '',
    bio: 'Passionate creative professional with expertise in digital marketing and brand development.',
    location: 'Kampala, Uganda',
    phone: '+256 772 123456',
    email: user?.email || '',
    website: 'www.example.com',
    socialMedia: {
      instagram: '@username',
      twitter: '@username',
      linkedin: 'linkedin.com/in/username'
    },
    skills: ['Digital Marketing', 'Brand Development', 'Content Creation', 'Social Media Strategy'],
    experience: [
      {
        title: 'Senior Marketing Specialist',
        company: 'Creative Agency Inc.',
        period: '2022 - Present',
        description: 'Led digital marketing campaigns for Fortune 500 clients, achieving 150% ROI improvement.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Marketing',
        institution: 'University of Arts',
        year: '2020',
        honors: 'Magna Cum Laude'
      }
    ],
    portfolio: [
      {
        id: 1,
        title: 'Brand Campaign 2025',
        type: 'image',
        thumbnail: 'https://images.pexels.com/photos/5257578/pexels-photo-5257578.jpeg?auto=compress&cs=tinysrgb&w=400',
        description: 'Complete brand identity redesign for tech startup'
      },
      {
        id: 2,
        title: 'Product Launch Video',
        type: 'video',
        thumbnail: 'https://images.pexels.com/photos/8000646/pexels-photo-8000646.jpeg?auto=compress&cs=tinysrgb&w=400',
        description: 'Creative direction for product launch campaign'
      }
    ],
    certifications: [
      { name: 'Digital Marketing Certification', issuer: 'Creative Arts Institute', year: '2025' },
      { name: 'Brand Ambassador Certification', issuer: 'Creative Arts Institute', year: '2025' }
    ],
    testimonials: [
      {
        client: 'Sarah Johnson',
        company: 'Tech Innovations',
        rating: 5,
        comment: 'Exceptional work quality and professional approach. Highly recommended!'
      }
    ],
    awards: [
      { name: 'Creative of the Year', issuer: 'Creative Excellence Awards', year: '2025' },
      { name: 'Best Marketing Campaign', issuer: 'Digital Media Awards', year: '2024' },
    ],
    interviews: [
      { title: 'The Future of Branding', platform: 'Creative Minds Podcast', date: '2025-10-15' },
      { title: 'A Journey in Digital Marketing', platform: 'The Marketing Show', date: '2025-09-01' },
    ]
  });

  const handleSendToMedia = (content: any) => {
    setSelectedContent(content);
    setShowMediaModal(true);
  };

  const confirmSendToMedia = () => {
    alert('Content sent for admin review. You will be notified once it\'s approved!');
    setShowMediaModal(false);
    setSelectedContent(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'music-video':
      case 'movie':
      case 'image':
        return <Play className="w-12 h-12 text-white" />;
      case 'audio-music':
        return <Clock className="w-12 h-12 text-white" />;
      case 'blog':
        return <BookOpen className="w-12 h-12 text-white" />;
      case 'document':
        return <Upload className="w-12 h-12 text-white" />;
      default:
        return <Play className="w-12 h-12 text-white" />;
    }
  };

  const addSkill = () => {
    const skill = prompt('Enter new skill:');
    if (skill) {
      setPortfolioData({
        ...portfolioData,
        skills: [...portfolioData.skills, skill]
      });
    }
  };

  const removeSkill = (index: number) => {
    setPortfolioData({
      ...portfolioData,
      skills: portfolioData.skills.filter((_, i) => i !== index)
    });
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) {
      setProfilePhotoError('Please select a valid file');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setProfilePhotoError('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfilePhotoError('File size must be less than 5MB');
      return;
    }

    setUploadingProfilePhoto(true);
    setProfilePhotoError(null);

    try {
      const { publicUrl, error } = await uploadToB2(file, 'portfolio_profile_photos');

      if (error) {
        setProfilePhotoError(error);
        setUploadingProfilePhoto(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPortfolioData({
        ...portfolioData,
        profileImage: publicUrl
      });

      setProfilePhotoError(null);
    } catch (err) {
      setProfilePhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingProfilePhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-white mb-2">Portfolio</h1>
            <p className="text-gray-300">Professional record of my work</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Public</span>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-rose-500' : 'bg-gray-600'
                }`}
                disabled={user?.tier === 'free'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              {user?.tier === 'free' && (
                <span className="text-yellow-400 text-sm">Premium required</span>
              )}
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isEditing
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:shadow-xl text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2 inline" />
                  Edit Portfolio
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative mb-8">
          <div className="h-64 bg-gradient-to-r from-rose-400 via-purple-500 to-pink-500 rounded-2xl overflow-hidden">
            {portfolioData.coverImage ? (
              <img src={portfolioData.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="opacity-75">Add cover image</p>
                </div>
              </div>
            )}
          </div>
          
          {isEditing && (
            <button className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
              <Upload className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* Profile Image & Basic Info */}
            <div className="glass-effect p-6 rounded-2xl">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-rose-400 to-purple-500 p-1">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                      {portfolioData.profileImage ? (
                        <img src={portfolioData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingProfilePhoto}
                      className="absolute bottom-0 right-0 p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingProfilePhoto ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                </div>
                {profilePhotoError && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{profilePhotoError}</p>
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-white mt-4">{user?.name}</h2>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-300 ml-2">4.9 (127 reviews)</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={portfolioData.location}
                      onChange={(e) => setPortfolioData({...portfolioData, location: e.target.value})}
                      className="bg-transparent border-b border-gray-600 focus:border-rose-400 outline-none flex-1 text-white"
                    />
                  ) : (
                    <span>{portfolioData.location}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="w-4 h-4 text-rose-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={portfolioData.phone}
                      onChange={(e) => setPortfolioData({...portfolioData, phone: e.target.value})}
                      className="bg-transparent border-b border-gray-600 focus:border-rose-400 outline-none flex-1 text-white"
                    />
                  ) : (
                    <span>{portfolioData.phone}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="w-4 h-4 text-rose-400" />
                  <span>{portfolioData.email}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-300">
                  <Globe className="w-4 h-4 text-rose-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={portfolioData.website}
                      onChange={(e) => setPortfolioData({...portfolioData, website: e.target.value})}
                      className="bg-transparent border-b border-gray-600 focus:border-rose-400 outline-none flex-1 text-white"
                    />
                  ) : (
                    <span>{portfolioData.website}</span>
                  )}
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-3">Social Media</h3>
                <div className="flex space-x-3">
                  <Instagram className="w-5 h-5 text-pink-400 hover:text-pink-300 cursor-pointer" />
                  <Twitter className="w-5 h-5 text-blue-400 hover:text-blue-300 cursor-pointer" />
                  <Linkedin className="w-5 h-5 text-blue-600 hover:text-blue-500 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Awards & Recognitions */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">Awards & Recognitions</h3>
              <div className="space-y-3">
                {portfolioData.awards.map((award, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-yellow-400 mt-1" />
                    <div>
                      <div className="text-white font-medium">{award.name}</div>
                      <div className="text-gray-400 text-sm">{award.issuer} • {award.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interviews & Features */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">Interviews & Features</h3>
              <div className="space-y-3">
                {portfolioData.interviews.map((interview, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Mic className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                      <div className="text-white font-medium">{interview.title}</div>
                      <div className="text-gray-400 text-sm">{interview.platform} • {new Date(interview.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Skills</h3>
                {isEditing && (
                  <button
                    onClick={addSkill}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolioData.skills.map((skill, index) => (
                  <div key={index} className="relative group">
                    <span className="px-3 py-1 bg-gradient-to-r from-rose-400/20 to-purple-500/20 text-rose-300 rounded-full text-sm border border-rose-400/30">
                      {skill}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">Certifications</h3>
              <div className="space-y-3">
                {portfolioData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-yellow-400 mt-1" />
                    <div>
                      <div className="text-white font-medium">{cert.name}</div>
                      <div className="text-gray-400 text-sm">{cert.issuer} • {cert.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Portfolio Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
              {isEditing ? (
                <textarea
                  value={portfolioData.bio}
                  onChange={(e) => setPortfolioData({...portfolioData, bio: e.target.value})}
                  className="w-full h-24 bg-transparent border border-gray-600 rounded-lg p-3 text-white resize-none focus:border-rose-400 outline-none"
                  placeholder="Tell your story..."
                />
              ) : (
                <p className="text-gray-300 leading-relaxed">{portfolioData.bio}</p>
              )}
            </div>

            {/* Highlights */}
            <div className="glass-effect p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Highlights</h3>
                {isEditing && (
                  <button className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Add Work
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {portfolioData.portfolio.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleSendToMedia(item)}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        >
                          Send to Media
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-white font-medium">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Content */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-6">Portfolio Content</h3>

              {loadingContent ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading portfolio content...</p>
                </div>
              ) : portfolioContent.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {portfolioContent.map((item) => {
                    const deletionInfo = getDeletionInfo(item.status || 'draft', item.deleted_at || null, item.auto_delete_at || null, item.saved || false);

                    return (
                      <div key={item.id} className="group relative">
                        {deletionInfo.isDeletedPending && item.auto_delete_at && (
                          <div className="mb-2">
                            <ContentCountdownTimer
                              autoDeleteAt={item.auto_delete_at}
                              onSave={() => handleSaveContent(item.id)}
                              isSaving={savingContentId === item.id}
                            />
                          </div>
                        )}

                        <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden relative">
                          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleEditOpen(item)}
                              className="p-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            {item.status !== 'pending_deletion' && (
                              <button
                                onClick={() => handleDeleteFromPortfolio(item.id)}
                                disabled={deletingContentId === item.id}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all disabled:opacity-50"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          <h4 className="text-white font-medium">{item.title}</h4>
                          <p className="text-gray-400 text-sm">{item.creator}</p>
                          {item.description && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description}</p>
                          )}
                          {item.status === 'pending_deletion' && (
                            <p className="text-yellow-400 text-xs mt-2">Pending deletion</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                            {item.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.views_count.toLocaleString()} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No portfolio content yet. Upload content from the Content page and publish to Portfolio to display it here.</p>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">Experience</h3>
              <div className="space-y-4">
                {portfolioData.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-rose-400 pl-4">
                    <h4 className="text-white font-semibold">{exp.title}</h4>
                    <div className="text-rose-400 text-sm">{exp.company} • {exp.period}</div>
                    <p className="text-gray-300 text-sm mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">Client Testimonials</h3>
              <div className="space-y-4">
                {portfolioData.testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300 italic mb-2">"{testimonial.comment}"</p>
                    <div className="text-sm">
                      <span className="text-white font-medium">{testimonial.client}</span>
                      <span className="text-gray-400"> - {testimonial.company}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Send to Media Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Send to Media</h3>
              <p className="text-gray-300 mb-4">
                Send "{selectedContent?.title}" to the Media section for admin review?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmSendToMedia}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Send for Review
                </button>
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Content Modal */}
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
            onDelete={() => handleDelete(editingContent.id)}
            onClose={handleEditClose}
            isSaving={isSaving}
            isDeleting={isDeleting}
            error={editError}
          />
        )}
      </div>
    </div>
  );
}
