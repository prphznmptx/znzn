import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  Users,
  Award,
  Star,
  BookOpen,
  Filter,
  Search,
  CheckCircle,
  Lock,
  Bookmark,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Briefcase,
  Eye,
  X,
  UploadCloud,
  ImageIcon,
  Film,
  Music,
  Edit3,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadToB2 } from '../lib/b2Upload';
import { extractDuration } from '../lib/getDuration';
import { useMediaPageEdit } from '../hooks/useMediaPageEdit';
import { useContentDeletion } from '../hooks/useContentDeletion';
import { useMediaPageLike, useMediaPageFollow } from '../hooks/useMediaPageInteraction';
import { useEnrollment } from '../hooks/useEnrollment';
import EditMasterclassContentModal from '../components/EditMasterclassContentModal';
import ContentCountdownTimer from '../components/ContentCountdownTimer';
import VideoPlaybackModal from '../components/VideoPlaybackModal';
import VideoUploadWithMuxForMasterclass from '../components/VideoUploadWithMuxForMasterclass';

type ViewMode = 'courses' | 'workshops' | 'learning' | 'teaching' | 'mentorship';
type LayoutMode = 'grid' | 'list';

type ContentItem = {
  id: string;
  title: string;
  creator: string;
  category: string;
  thumbnail_url: string;
  duration: string | null;
  views_count: number;
  like_count: number;
  is_premium: boolean;
  description: string;
  type: string;
  level?: string;
  features?: string[];
  lessons_count?: number;
};

type Workshop = {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  spots: number;
  price: number;
  category: string;
  location: string;
};

export default function Masterclass() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('courses');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'all' | 'popular' | 'newest' | 'highest-rated'>('all');
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>([]);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [mentorshipRequestSent, setMentorshipRequestSent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [courseContent, setCourseContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [uploadLevel, setUploadLevel] = useState('All Levels');
  const [uploadFeatures, setUploadFeatures] = useState<string[]>([]);
  const [uploadFeatureInput, setUploadFeatureInput] = useState('');
  const [uploadLessons, setUploadLessons] = useState('');
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadThumbnail, setUploadThumbnail] = useState<File | null>(null);
  const [uploadThumbnailPreview, setUploadThumbnailPreview] = useState<string | null>(null);
  const uploadThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadVideoPlaybackId, setUploadVideoPlaybackId] = useState<string | null>(null);
  const [uploadVideoId, setUploadVideoId] = useState<string | null>(null);
  const [uploadVideoDuration, setUploadVideoDuration] = useState<string | null>(null);
  const [uploadPrice, setUploadPrice] = useState<number>(0);
  const [userCourses, setUserCourses] = useState<ContentItem[]>([]);
  const [loadingUserCourses, setLoadingUserCourses] = useState(true);
  const [showManageCoursesModal, setShowManageCoursesModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ContentItem | null>(null);
  const [editError, setEditError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingContentId, setSavingContentId] = useState<string | null>(null);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [playingCourse, setPlayingCourse] = useState<ContentItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userFollows, setUserFollows] = useState<Set<string>>(new Set());
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingEnrolledCourses, setLoadingEnrolledCourses] = useState(false);

  const { editContent } = useMediaPageEdit();
  const { deleteFromDestination, saveContent, getDeletionInfo } = useContentDeletion();
  const { toggleLike } = useMediaPageLike();
  const { toggleFollow } = useMediaPageFollow();
  const { fetchEnrollments } = useEnrollment();

  const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  };

  const courseCategories = useMemo(
    () => [
      'all',
      'digital-marketing',
      'brand-ambassador',
      'media-communications',
      'media-production',
      'art-&-design',
      'modelling',
      'dance-&-choreography',
      'acting',
      'critical-media-literacy',
      'film-video-production',
      'audio-production',
      'music',
      'event-management',
      'marketing-&-advertising',
      'AI-research-&-innovation',
      'business-development',
      'professional-development',
      'personal-development'
    ],
    []
  );

  function getCategoryLabel(category: string): string {
    if (category === 'marketing-&-advertising') return 'Branding, Marketing & Advertising';
    if (category === 'AI-research-&-innovation') return 'AI, Research & Innovation';
    if (category === 'media-communications') return 'Communications';
    if (category === 'brand-ambassador') return 'Brand Ambassador Skills';
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function maskNumber(n: number): string {
    const digits = String(Math.max(1, Math.abs(Math.trunc(n)))).length;
    return '-'.repeat(digits);
  }

  function maskRating(r: number): string {
    const len = (Number.isFinite(r) ? r : 0).toFixed(1).length;
    return '-'.repeat(len);
  }

  const fetchCourseContent = useCallback(async () => {
    try {
      // Try to load cached content first for instant display
      const cached = sessionStorage.getItem('masterclass_content_cache');
      if (cached) {
        try {
          setCourseContent(JSON.parse(cached));
        } catch {}
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase.rpc('get_content_by_destination', {
        destination: 'masterclass'
      });

      if (error) throw error;
      if (data) {
        setCourseContent(data);
        // Cache for instant load next time
        sessionStorage.setItem('masterclass_content_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching course content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingUserCourses(true);
      const { data, error } = await supabase
        .from('masterclass_page_content')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'permanently_deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setUserCourses(data);
      }
    } catch (err) {
      console.error('Error fetching user courses:', err);
    } finally {
      setLoadingUserCourses(false);
    }
  }, [user]);

  const fetchUserEnrolledCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingEnrolledCourses(true);

      // Fetch enrollments
      const enrollments = await fetchEnrollments(user.id);

      if (!enrollments || enrollments.length === 0) {
        setEnrolledCourses([]);
        return;
      }

      // Get course details for enrolled courses
      const courseIds = enrollments.map((e: any) => e.course_id);
      const { data: courses, error } = await supabase
        .from('masterclass_page_content')
        .select('*')
        .in('id', courseIds);

      if (error) throw error;

      // Merge enrollment data with course data
      const merged = courses?.map((course) => {
        const enrollment = enrollments.find((e: any) => e.course_id === course.id);
        return {
          ...course,
          enrollment
        };
      }) || [];

      setEnrolledCourses(merged);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
    } finally {
      setLoadingEnrolledCourses(false);
    }
  }, [user, fetchEnrollments]);

  useEffect(() => {
    fetchCourseContent();
  }, [fetchCourseContent]);

  useEffect(() => {
    if (user && showManageCoursesModal) {
      fetchUserCourses();
    }
  }, [user, showManageCoursesModal, fetchUserCourses]);

  useEffect(() => {
    if (user && viewMode === 'learning') {
      fetchUserEnrolledCourses();
    }
  }, [user, viewMode, fetchUserEnrolledCourses]);

  useEffect(() => {
    if (user) fetchUserInteractions();
  }, [user]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToRealTimeUpdates();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  const fetchUserInteractions = async () => {
    if (!user) return;

    try {
      const { data: likes } = await supabase
        .from('media_page_likes')
        .select('content_id')
        .eq('user_id', user.id);

      if (likes) {
        setUserLikes(new Set(likes.map((l: any) => l.content_id)));
      }

      const { data: follows } = await supabase
        .from('media_page_follows')
        .select('creator_name')
        .eq('follower_id', user.id);

      if (follows) {
        setUserFollows(new Set(follows.map((f: any) => f.creator_name)));
      }
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    const contentChannel = supabase
      .channel('public:masterclass_page_content')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'masterclass_page_content',
        },
        (payload: any) => {
          setCourseContent((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? {
                    ...item,
                    like_count: payload.new.like_count,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel('public:media_page_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_page_likes',
        },
        () => {
          if (user) {
            fetchUserInteractions();
          }
        }
      )
      .subscribe();

    return () => {
      contentChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bookmarkedCourseIds');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setBookmarkedCourseIds(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bookmarkedCourseIds', JSON.stringify(bookmarkedCourseIds));
    } catch {}
  }, [bookmarkedCourseIds]);

  const getMediaType = (file: File): string => {
    if (Object.values(ALLOWED_TYPES.image).includes(file.type)) return 'image';
    if (Object.values(ALLOWED_TYPES.video).includes(file.type)) return 'video';
    if (Object.values(ALLOWED_TYPES.audio).includes(file.type)) return 'audio';
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

  const handleUploadFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!isValidFile(selectedFile)) {
      setUploadError('File type not supported. Please upload an image, video, or audio file.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setUploadError('File must be smaller than 100MB');
      return;
    }

    setUploadFile(selectedFile);
    setUploadError(null);

    const type = getMediaType(selectedFile);

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUploadThumbnailSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!Object.values(ALLOWED_TYPES.image).includes(selectedFile.type)) {
      setUploadError('Thumbnail must be an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('Thumbnail must be smaller than 10MB');
      return;
    }

    setUploadThumbnail(selectedFile);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleUploadFileSelect(selectedFile);
  };

  const handleUploadThumbnailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleUploadThumbnailSelect(selectedFile);
  };

  const handleUploadDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setUploadDragActive(true);
    } else if (e.type === 'dragleave') {
      setUploadDragActive(false);
    }
  };

  const handleUploadDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleUploadFileSelect(droppedFile);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      setUploadError('You must be logged in to upload content');
      return;
    }

    if (!uploadTitle) {
      setUploadError('Title is required');
      return;
    }

    if (!uploadVideoPlaybackId || !uploadVideoId) {
      setUploadError('Please upload a video');
      return;
    }

    if (!uploadThumbnail) {
      setUploadError('Please select a thumbnail image');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      // Upload thumbnail to Backblaze B2
      const { publicUrl: thumbnailUrl, error: uploadThumbnailError } = await uploadToB2(
        uploadThumbnail,
        `masterclass_page_content/${user.id}`
      );

      if (uploadThumbnailError) throw uploadThumbnailError;

      // Construct Mux stream URL from playback ID
      const muxStreamUrl = `https://stream.mux.com/${uploadVideoPlaybackId}.m3u8`;

      const { error: insertError } = await supabase.from('masterclass_page_content').insert([
        {
          user_id: user.id,
          title: uploadTitle,
          creator: profile.name,
          description: uploadDescription || null,
          thumbnail_url: thumbnailUrl,
          content_url: muxStreamUrl,
          type: 'course-material',
          category: uploadCategory || null,
          duration: uploadVideoDuration,
          level: uploadLevel,
          features: uploadFeatures,
          lessons_count: parseInt(uploadLessons) || 0,
          video_upload_id: uploadVideoId,
          course_price: uploadPrice || 0,
          views_count: 0,
          like_count: 0,
          is_premium: false,
          status: 'published',
        },
      ]);

      if (insertError) throw insertError;

      setUploadSuccess(true);
      setUploadTitle('');
      setUploadDescription('');
      setUploadVideoPlaybackId(null);
      setUploadVideoId(null);
      setUploadVideoDuration(null);
      setUploadPreview(null);
      setUploadThumbnail(null);
      setUploadThumbnailPreview(null);
      setUploadCategory('');
      setUploadLevel('All Levels');
      setUploadFeatures([]);
      setUploadFeatureInput('');
      setUploadLessons('');
      setUploadPrice(0);

      // Refresh course content
      fetchCourseContent();

      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
      }, 2000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload content');
    } finally {
      setUploadLoading(false);
    }
  };

  const workshops = useMemo<Workshop[]>(
    () => [
      {
        id: 1,
        title: 'Creative Bootcamp',
        date: 'March 15, 2026',
        time: '2:00 PM EAT',
        duration: '3 hours',
        instructor: 'Alex Chen',
        spots: 25,
        price: 185000,
        category: 'digital-marketing',
        location: 'Kampala Creative Hub'
      },
      {
        id: 2,
        title: 'Personal Branding Workshop',
        date: 'June 20, 2026',
        time: '10:00 AM EAT',
        duration: '4 hours',
        instructor: 'Maya Patel',
        spots: 15,
        price: 300000,
        category: 'professional-development',
        location: 'Virtual (Live)'
      },
      {
        id: 3,
        title: 'Litflex - Multimedia Analytica',
        date: 'June 5, 2026',
        time: '4:00 PM EAT',
        duration: '3 hours',
        instructor: 'Rouje Gerard',
        spots: 30,
        price: 220000,
        category: 'critical-media-literacy',
        location: 'Kampala Cine Arena'
      }
    ],
    []
  );

  const filteredCourses = useMemo(() => {
    const categoryValue = activeCategory;
    return courseContent.filter((course) => {
      const matchesCategory = categoryValue === 'all' || course.category === categoryValue;
      const loweredQuery = searchQuery.toLowerCase();
      const matchesSearch =
        loweredQuery.length === 0 ||
        course.title.toLowerCase().includes(loweredQuery) ||
        course.creator.toLowerCase().includes(loweredQuery) ||
        course.description.toLowerCase().includes(loweredQuery);
      return matchesCategory && matchesSearch;
    });
  }, [courseContent, activeCategory, searchQuery]);

  const sortedCourses = useMemo(() => {
    const items = [...filteredCourses];
    if (sortBy === 'all') return items;
    
    switch (sortBy) {
      case 'newest':
        return items;
      case 'popular':
        return items.sort((a, b) => b.views_count - a.views_count);
      case 'highest-rated':
        return items.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      default:
        return items;
    }
  }, [filteredCourses, sortBy]);

  const filteredWorkshops = useMemo(() => {
    const categoryValue = activeCategory;
    return workshops.filter((workshop) => {
      const matchesCategory = categoryValue === 'all' || workshop.category === categoryValue;
      const loweredQuery = searchQuery.toLowerCase();
      const matchesSearch =
        loweredQuery.length === 0 ||
        workshop.title.toLowerCase().includes(loweredQuery) ||
        workshop.instructor.toLowerCase().includes(loweredQuery) ||
        workshop.location.toLowerCase().includes(loweredQuery);
      return matchesCategory && matchesSearch;
    });
  }, [workshops, activeCategory, searchQuery]);

  const handleEnroll = (courseId: string) => {
    if (!user) {
      alert('Please sign up or sign in to enroll.');
      navigate('/signin');
      return;
    }
    if (user.tier === 'free') {
      alert('Upgrade to Premium to access masterclasses!');
      return;
    }
    alert(`Enrollment successful! Welcome to the masterclass.`);
  };

  const handleMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMentorshipRequestSent(true);
  };

  const handleMentorshipClick = () => {
    if (!user) {
      alert('Please sign up or sign in to submit a mentorship request.');
      navigate('/signin');
      return;
    }
    setShowMentorshipModal(true);
    setMentorshipRequestSent(false);
  };

  const handleBookmarkToggle = (courseId: string) => {
    setBookmarkedCourseIds((prev) => {
      const exists = prev.includes(courseId);
      const next = exists ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      setToastMessage(exists ? 'Removed Bookmark' : 'Added Bookmark');
      setTimeout(() => setToastMessage(''), 1600);
      return next;
    });
  };

  const handlePlayClick = (course: ContentItem) => {
    setPlayingCourse(course);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setPlayingCourse(null);
  };

  const handleToggleLike = async (courseId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const isCurrentlyLiked = userLikes.has(courseId);
    const previousLikes = userLikes;
    const previousCourses = courseContent;

    setUserLikes((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });

    setCourseContent((prev) =>
      prev.map((item) =>
        item.id === courseId
          ? { ...item, like_count: isCurrentlyLiked ? item.like_count - 1 : item.like_count + 1 }
          : item
      )
    );

    const result = await toggleLike(courseId, isCurrentlyLiked, user.id);

    if (!result.success) {
      setUserLikes(previousLikes);
      setCourseContent(previousCourses);
    }
  };

  const handleToggleFollow = async (creatorName: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const isCurrentlyFollowing = userFollows.has(creatorName);
    const previousFollows = userFollows;

    setUserFollows((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(creatorName);
      } else {
        next.add(creatorName);
      }
      return next;
    });

    const result = await toggleFollow(creatorName, isCurrentlyFollowing, user.id);

    if (!result.success) {
      setUserFollows(previousFollows);
    }
  };

  const searchPlaceholderMap: Record<ViewMode, string> = {
    courses: 'Search courses and instructors...',
    workshops: 'Search workshops and facilitators...',
    learning: 'Search your enrolled courses...',
    teaching: 'Search teaching resources...',
    mentorship: 'Search mentorship resources...'
  };

  const viewOptions: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'courses', label: 'Courses', icon: BookOpen },
    { key: 'workshops', label: 'Workshops', icon: Clock },
    { key: 'learning', label: 'Learning', icon: Award },
    { key: 'teaching', label: 'Teaching', icon: Briefcase },
    { key: 'mentorship', label: 'Mentorship', icon: Users }
  ];

  const courseContainerClass =
    layoutMode === 'grid'
      ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
      : 'grid gap-4 md:block md:space-y-4';

  const workshopContainerClass =
    layoutMode === 'grid'
      ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
      : 'grid gap-4 md:block md:space-y-4';

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
        return <Search className="w-12 h-12 text-white" />;
      default:
        return <Play className="w-12 h-12 text-white" />;
    }
  };

  const handleEditCourseOpen = (course: ContentItem) => {
    setEditingCourse(course);
    setEditError(undefined);
  };

  const handleEditCourseClose = () => {
    setEditingCourse(null);
    setEditError(undefined);
  };

  const handleEditCourseSave = async (payload: {
    title: string;
    description?: string;
    category?: string;
    level?: string;
    features?: string[];
    lessons_count?: number;
    is_premium?: boolean;
  }) => {
    if (!editingCourse) return;

    setIsSaving(true);
    setEditError(undefined);

    const result = await editContent(editingCourse.id, payload, 'masterclass');

    if (result.success) {
      setUserCourses((prev) =>
        prev.map((item) =>
          item.id === editingCourse.id
            ? {
                ...item,
                title: payload.title,
                description: payload.description || '',
                category: payload.category || '',
                level: payload.level || 'All Levels',
                features: payload.features || [],
                lessons_count: payload.lessons_count || 0,
                is_premium: payload.is_premium ?? false,
              }
            : item
        )
      );
      // Refresh course content to reflect changes in courses tab
      fetchCourseContent();
      handleEditCourseClose();
    } else {
      setEditError(result.error || 'Failed to save changes');
    }

    setIsSaving(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    setDeletingContentId(courseId);
    setIsDeleting(true);
    setEditError(undefined);

    const result = await deleteFromDestination(courseId, 'masterclass', 'masterclass');

    if (result.success) {
      setUserCourses((prev) =>
        prev.map((item) =>
          item.id === courseId
            ? { ...item, status: 'pending_deletion', is_deleted_pending: true }
            : item
        )
      );
      // Refresh course content to reflect changes in courses tab
      fetchCourseContent();
    } else {
      setEditError(result.error || 'Failed to delete course');
    }

    setIsDeleting(false);
    setDeletingContentId(null);
  };

  const handleSaveCourse = async (courseId: string) => {
    setSavingContentId(courseId);
    const result = await saveContent(courseId, 'masterclass');
    if (result.success) {
      setUserCourses((prev) =>
        prev.map((item) =>
          item.id === courseId
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
      // Refresh course content
      fetchCourseContent();
    }
    setSavingContentId(null);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-white mb-2">Masterclass</h1>
            <p className="text-gray-300">
              Stand out with a certificate for your skills and the support of industry experts
            </p>
          </div>

          <Link
            to="/help-center"
            className="hidden md:inline-flex px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all items-center justify-center"
          >
            Help Center
          </Link>
        </div>

        <div className="flex space-x-1 glass-effect p-2 rounded-xl overflow-x-auto whitespace-nowrap w-full mb-8">
          {viewOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setViewMode(key);
                setSearchQuery('');
                if (key === 'teaching' || key === 'mentorship') {
                  setActiveCategory('all');
                }
              }}
              className={`flex-shrink-0 flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                viewMode === key
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative md:flex-[0.65]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholderMap[viewMode]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6 md:flex-[0.35]">
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
              <Filter className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                disabled={viewMode === 'teaching' || viewMode === 'mentorship'}
                className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ml-10 w-[calc(100%-2.5rem)] md:ml-0 md:w-auto md:min-w-[12rem]"
              >
                {courseCategories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800 text-white">
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-gray-400 flex-shrink-0">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all md:w-auto md:min-w-[8rem]"
              >
                <option value="all" className="bg-gray-800">All</option>
                <option value="newest" className="bg-gray-800">Newest</option>
                <option value="popular" className="bg-gray-800">Popular</option>
                <option value="highest-rated" className="bg-gray-800">Highest Rated</option>
              </select>
            </div>

            <div className="glass-effect px-3 py-2 rounded-xl hidden md:flex items-center gap-2 flex-shrink-0 md:ml-auto">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  layoutMode === 'list'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="List view"
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'courses' && (
          <div className={courseContainerClass}>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading courses...</p>
              </div>
            ) : sortedCourses.length > 0 ? (
              sortedCourses.map((course) => {
                const isBookmarked = bookmarkedCourseIds.includes(course.id);
                return (
                  <div
                    key={course.id}
                    className={`glass-effect rounded-2xl overflow-hidden hover-lift transition-all ${
                      layoutMode === 'list' ? 'md:flex' : ''
                    }`}
                  >
                    <div className={`${layoutMode === 'list' ? 'md:w-1/3 md:min-w-[240px]' : ''}`}>
                      <div className={`relative group ${layoutMode === 'list' ? 'md:h-full' : 'aspect-video'} bg-gray-800`}>
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                        <button
                          onClick={() => handleBookmarkToggle(course.id)}
                          className={`absolute top-3 right-3 p-2 rounded-full bg-black/40 transition-colors z-20 ${
                            isBookmarked ? 'text-purple-400' : 'text-gray-200 hover:text-white'
                          }`}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark course'}
                        >
                          <Bookmark className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePlayClick(course)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 cursor-pointer hover:bg-black/60"
                          aria-label="Play course"
                        >
                          {getIcon(course.type)}
                        </button>
                        {course.is_premium && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                            PREMIUM
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`${layoutMode === 'list' ? 'md:w-2/3' : ''} p-6`}>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        {course.level && (
                          <span className="px-2 py-1 bg-rose-400/20 text-rose-300 text-xs rounded-full font-medium">
                            {course.level}
                          </span>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-200">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>0.0</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                      <p className="text-gray-200 text-sm mb-3">by {course.creator}</p>
                      <p className="text-gray-300 text-sm mb-1 line-clamp-2">{course.description}</p>
                      <button
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="text-rose-400 hover:text-rose-300 text-sm font-medium mb-4 transition-colors"
                      >
                        Read More →
                      </button>

                      <div className={`text-sm text-gray-200 mb-4 ${layoutMode === 'list' ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex items-center justify-between'}`}>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration || 'Duration TBA'}</span>
                        </div>
                        {course.lessons_count && course.lessons_count > 0 && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.lessons_count} lessons</span>
                          </div>
                        )}
                      </div>

                      {course.features && course.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course.features.map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-400/20 text-purple-300 text-xs rounded font-medium">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all font-medium text-sm border border-blue-500/30"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-effect rounded-2xl p-8 text-center text-gray-300 md:col-span-2 lg:col-span-3">
                No courses found. Try adjusting your search or filters.
              </div>
            )}
          </div>
        )}

        {viewMode === 'workshops' && (
          <div className={workshopContainerClass}>
            {filteredWorkshops.map((workshop) => (
              <div
                key={workshop.id}
                className={`glass-effect rounded-2xl overflow-hidden hover-lift transition-all p-6 ${
                  layoutMode === 'list' ? 'md:flex md:items-center md:justify-between' : ''
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{workshop.title}</h3>
                  <div className="text-gray-300 text-sm space-y-1">
                    <div>{workshop.date} at {workshop.time}</div>
                    <div>{workshop.duration} • {workshop.spots} spots left</div>
                    <div>by {workshop.instructor}</div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="flex items-center justify-start md:justify-end gap-2 text-sm text-gray-300 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{workshop.location}</span>
                  </div>
                  <div className="flex items-center justify-between md:justify-end md:gap-4">
                    <span className="text-rose-400 font-bold">UGX --</span>
                    <button className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg transition-all">
                      Register
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredWorkshops.length === 0 && (
              <div className="glass-effect rounded-2xl p-8 text-center text-gray-300">
                No workshops match your filters right now.
              </div>
            )}
          </div>
        )}

        {viewMode === 'learning' && (
          <div className="space-y-6">
            {!user ? (
              <div className="glass-effect p-8 rounded-2xl text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300 mb-4">Sign in to view your enrolled courses</p>
                <button
                  onClick={() => navigate('/signin')}
                  className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Sign In
                </button>
              </div>
            ) : loadingEnrolledCourses ? (
              <div className="glass-effect p-8 rounded-2xl text-center">
                <p className="text-gray-300">Loading your courses...</p>
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-4">My Enrolled Courses</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.id}
                        className="glass-effect rounded-2xl overflow-hidden hover-lift transition-all cursor-pointer group"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <div className="aspect-video bg-gray-800 relative overflow-hidden">
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-1">{course.title}</h3>
                          <p className="text-gray-400 text-sm mb-3">by {course.creator}</p>

                          {course.enrollment && (
                            <div className="space-y-3 mb-4">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-gray-400">Progress</span>
                                  <span className="text-xs text-white font-semibold">
                                    {course.enrollment.progress_percentage || 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-gradient-to-r from-rose-500 to-purple-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${course.enrollment.progress_percentage || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400">
                                {course.enrollment.lessons_completed} of {course.lessons_count} lessons
                              </p>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/course/${course.id}`);
                            }}
                            className="w-full px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                          >
                            Continue Learning
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-effect p-6 rounded-2xl">
                  <h2 className="text-2xl font-semibold text-white mb-4">My Achievements</h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <div>
                        <div className="text-white font-medium">Courses Enrolled</div>
                        <div className="text-gray-400 text-sm">{enrolledCourses.length} courses</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Award className="w-8 h-8 text-yellow-400" />
                      <div>
                        <div className="text-white font-medium">Certificates</div>
                        <div className="text-gray-400 text-sm">
                          {enrolledCourses.filter((c) => c.enrollment?.status === 'completed').length} completed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-effect p-8 rounded-2xl text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300 mb-4">You haven't enrolled in any courses yet</p>
                <button
                  onClick={() => setViewMode('courses')}
                  className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'teaching' && (
          <div className="space-y-8">
            <div className="glass-effect p-8 rounded-2xl text-center">
              <BookOpen className="w-16 h-16 text-rose-400 mx-auto mb-4" />
              <h2 className="text-3xl font-playfair font-bold text-white mb-4">Become an Instructor</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Use your expertise, professional accreditations or Masterclass certificate to apply and become an expert instructor, shaping the future of talent
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4">
                  <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1">Access our audience</h3>
                  <p className="text-gray-400 text-sm">Connect with learners globally</p>
                </div>
                <div className="p-4">
                  <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1">Submit and Track lessons</h3>
                  <p className="text-gray-400 text-sm">Leverage Analytics for accurate reporting</p>
                </div>
                <div className="p-4">
                  <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1">Manage your Teaching</h3>
                  <p className="text-gray-400 text-sm">Grow and improve with Platform support</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    alert('Please sign up or sign in to apply as an instructor.');
                    navigate('/signin');
                    return;
                  }
                  alert('Instructor application coming soon!');
                }}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
              >
                Apply to Teach
              </button>
              <p className="text-gray-300 mt-6 max-w-2xl mx-auto">
                Track learner progress, assessment scores, and feedback to continually improve your profession.
              </p>
            </div>

            {user && (
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="text-2xl font-semibold text-white mb-6">Instructor Dashboard</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setShowManageCoursesModal(true)}
                    className="p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <BookOpen className="w-8 h-8 text-rose-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Manage Courses</h3>
                    <p className="text-gray-400 text-sm">Create and edit your courses</p>
                  </button>
                  <button className="p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                    <Users className="w-8 h-8 text-rose-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">View Students</h3>
                    <p className="text-gray-400 text-sm">Track student progress</p>
                  </button>
                  <button className="p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                    <Award className="w-8 h-8 text-rose-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Assignments</h3>
                    <p className="text-gray-400 text-sm">Create and grade assignments</p>
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <Clock className="w-8 h-8 text-rose-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Upload Content</h3>
                    <p className="text-gray-400 text-sm">Add videos and materials</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'mentorship' && (
          <div className="max-w-4xl mx-auto">
            <div className="glass-effect p-8 rounded-2xl text-center mb-8">
              <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-playfair font-bold text-white mb-4">Find Mentorship</h2>
              <p className="text-gray-300 mb-6">
                Get personalized guidance from industry professionals to accelerate your career growth and achieve your goals.
              </p>
              <button
                onClick={handleMentorshipClick}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
              >
                Apply
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-effect p-6 rounded-xl">
                <Award className="w-10 h-10 text-rose-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Expert Guidance</h3>
                <p className="text-gray-300 text-sm">Learn from professionals with years of industry experience</p>
              </div>
              <div className="glass-effect p-6 rounded-xl">
                <Users className="w-10 h-10 text-rose-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Personalized Approach</h3>
                <p className="text-gray-300 text-sm">Get tailored advice based on your specific goals and challenges</p>
              </div>
              <div className="glass-effect p-6 rounded-xl">
                <BookOpen className="w-10 h-10 text-rose-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Career Development</h3>
                <p className="text-gray-300 text-sm">Receive strategic guidance to advance your career</p>
              </div>
              <div className="glass-effect p-6 rounded-xl">
                <CheckCircle className="w-10 h-10 text-rose-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">Accountability</h3>
                <p className="text-gray-300 text-sm">Stay on track with regular check-ins and support</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast for wishlist actions */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-4 py-3 rounded-xl bg-gray-800/90 border border-white/10 text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}

      {showMentorshipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-effect p-6 rounded-2xl max-w-md w-full">
            {!mentorshipRequestSent ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">Request Mentorship</h3>
                <p className="text-gray-300 mb-4">
                  Submit a request for mentorship below
                </p>
                <form onSubmit={handleMentorshipRequest}>
                  <div className="space-y-4">
                    <textarea
                      className="w-full h-24 bg-transparent border border-gray-600 rounded-lg p-3 text-white resize-none focus:border-rose-400 outline-none"
                      placeholder="What do you need help with?"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Request Sent!</h3>
                <p className="text-gray-300 mb-4">
                  Your mentorship request has been received for review. We will notify you once it's approved.
                </p>
                <p className="text-yellow-400 text-sm mb-4">
                  Please note: Mentorship is a premium feature.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowMentorshipModal(false)}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    className="flex-1 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:shadow-xl transition-all"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Content Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-effect p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upload Course Material</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadTitle('');
                  setUploadDescription('');
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadThumbnail(null);
                  setUploadThumbnailPreview(null);
                  setUploadVideoPlaybackId(null);
                  setUploadVideoId(null);
                  setUploadCategory('');
                  setUploadLevel('All Levels');
                  setUploadFeatures([]);
                  setUploadFeatureInput('');
                  setUploadLessons('');
                  setUploadPrice(0);
                  setUploadError(null);
                  setUploadSuccess(false);
                }}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  placeholder="Enter a title for your course material"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  rows={4}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
                  placeholder="Describe your course material"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  <option value="digital-marketing" className="bg-gray-800">Digital Marketing</option>
                  <option value="brand-ambassador" className="bg-gray-800">Brand Ambassador Skills</option>
                  <option value="media-communications" className="bg-gray-800">Communications</option>
                  <option value="media-production" className="bg-gray-800">Media Production</option>
                  <option value="art-&-design" className="bg-gray-800">Art & Design</option>
                  <option value="modelling" className="bg-gray-800">Modelling</option>
                  <option value="dance-&-choreography" className="bg-gray-800">Dance & Choreography</option>
                  <option value="acting" className="bg-gray-800">Acting</option>
                  <option value="critical-media-literacy" className="bg-gray-800">Critical Media Literacy</option>
                  <option value="film-video-production" className="bg-gray-800">Film & Video Production</option>
                  <option value="audio-production" className="bg-gray-800">Audio Production</option>
                  <option value="music" className="bg-gray-800">Music</option>
                  <option value="event-management" className="bg-gray-800">Event Management</option>
                  <option value="marketing-&-advertising" className="bg-gray-800">Marketing & Advertising</option>
                  <option value="AI-research-&-innovation" className="bg-gray-800">AI, Research & Innovation</option>
                  <option value="business-development" className="bg-gray-800">Business Development</option>
                  <option value="professional-development" className="bg-gray-800">Professional Development</option>
                  <option value="personal-development" className="bg-gray-800">Personal Development</option>
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Course Level</label>
                <select
                  value={uploadLevel}
                  onChange={(e) => setUploadLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  <option value="Beginner" className="bg-gray-800">Beginner</option>
                  <option value="Intermediate" className="bg-gray-800">Intermediate</option>
                  <option value="Advanced" className="bg-gray-800">Advanced</option>
                  <option value="All Levels" className="bg-gray-800">All Levels</option>
                  <option value="Beginner to Intermediate" className="bg-gray-800">Beginner to Intermediate</option>
                  <option value="Beginner to Advanced" className="bg-gray-800">Beginner to Advanced</option>
                  <option value="Intermediate to Advanced" className="bg-gray-800">Intermediate to Advanced</option>
                </select>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Course Features</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={uploadFeatureInput}
                    onChange={(e) => setUploadFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (uploadFeatureInput.trim() && uploadFeatures.length < 8) {
                          setUploadFeatures([...uploadFeatures, uploadFeatureInput.trim()]);
                          setUploadFeatureInput('');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                    placeholder="Add a feature (e.g., Live Sessions) and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadFeatureInput.trim() && uploadFeatures.length < 8) {
                        setUploadFeatures([...uploadFeatures, uploadFeatureInput.trim()]);
                        setUploadFeatureInput('');
                      }
                    }}
                    className="px-4 py-3 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 transition-all"
                  >
                    Add
                  </button>
                </div>
                {uploadFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-purple-400/20 text-purple-300 text-sm rounded-full flex items-center gap-2"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFeatures(uploadFeatures.filter((_, i) => i !== index));
                          }}
                          className="text-purple-300 hover:text-purple-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Number of Lessons */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Number of Lessons</label>
                <input
                  type="number"
                  min="0"
                  value={uploadLessons}
                  onChange={(e) => setUploadLessons(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  placeholder="Enter the number of lessons in this course"
                />
              </div>

              {/* Course Price */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Course Price (UGX) - Optional</label>
                <p className="text-xs text-gray-400 mb-2">Leave at 0 for free courses</p>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={uploadPrice}
                  onChange={(e) => setUploadPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  placeholder="Enter course price in UGX (0 for free)"
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Course Thumbnail *</label>
                <p className="text-xs text-gray-400 mb-3">Upload an image to represent your course (displayed on the masterclass page)</p>
                <input
                  ref={uploadThumbnailInputRef}
                  type="file"
                  onChange={handleUploadThumbnailInputChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  className={`w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    uploadDragActive
                      ? 'border-rose-400 bg-rose-400/10'
                      : 'border-gray-600 hover:border-rose-400 hover:bg-rose-400/5'
                  }`}
                  onClick={() => uploadThumbnailInputRef.current?.click()}
                >
                  <ImageIcon className={`w-12 h-12 ${uploadDragActive ? 'text-rose-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${uploadDragActive ? 'text-rose-400' : 'text-gray-300'}`}>
                    Click to upload thumbnail image
                  </span>
                  <span className="text-sm text-gray-500">PNG, JPG, GIF, or WebP (max 10MB)</span>
                </div>

                {uploadThumbnail && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <ImageIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{uploadThumbnail.name}</p>
                        <p className="text-xs text-gray-400">{(uploadThumbnail.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadThumbnail(null);
                          setUploadThumbnailPreview(null);
                        }}
                        className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {uploadThumbnailPreview && (
                      <div className="mt-3 w-full h-40 rounded-lg overflow-hidden border border-gray-700">
                        <img
                          src={uploadThumbnailPreview}
                          alt="Thumbnail Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Video Upload with Mux */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Course Video (Mux) *</label>
                <p className="text-xs text-gray-400 mb-3">Upload a video to be processed by Mux for optimal playback</p>
                <VideoUploadWithMuxForMasterclass
                  userId={user!.id}
                  onVideoSelected={(playbackId, videoUploadId, duration) => {
                    setUploadVideoPlaybackId(playbackId);
                    setUploadVideoId(videoUploadId);
                    setUploadVideoDuration(duration || null);
                  }}
                />
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{uploadError}</p>
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">Material uploaded successfully and published to Masterclass!</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? 'Uploading...' : 'Upload & Publish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Courses Modal */}
      {showManageCoursesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-effect p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Manage Your Courses</h3>
              <button
                onClick={() => setShowManageCoursesModal(false)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {loadingUserCourses ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading your courses...</p>
              </div>
            ) : userCourses.length > 0 ? (
              <div className="grid gap-6">
                {userCourses.map((course) => {
                  const deletionInfo = getDeletionInfo(course.status || 'draft', course.deleted_at || null, course.auto_delete_at || null, course.saved || false);

                  return (
                    <div key={course.id} className="glass-effect rounded-xl overflow-hidden border border-gray-700 p-4">
                      {/* Deletion Countdown */}
                      {deletionInfo.isDeletedPending && course.auto_delete_at && (
                        <div className="mb-4">
                          <ContentCountdownTimer
                            autoDeleteAt={course.auto_delete_at}
                            onSave={() => handleSaveCourse(course.id)}
                            isSaving={savingContentId === course.id}
                          />
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Course Info */}
                        <div className="flex-grow">
                          <h4 className="text-lg font-semibold text-white mb-1">{course.title}</h4>
                          <p className="text-gray-400 text-sm mb-2">{course.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {course.category && (
                              <span className="px-2 py-1 bg-purple-400/20 text-purple-300 rounded">
                                {course.category}
                              </span>
                            )}
                            {course.level && (
                              <span className="px-2 py-1 bg-blue-400/20 text-blue-300 rounded">
                                {course.level}
                              </span>
                            )}
                            {course.lessons_count && course.lessons_count > 0 && (
                              <span>{course.lessons_count} lessons</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {course.status !== 'pending_deletion' && (
                            <button
                              onClick={() => handleEditCourseOpen(course)}
                              className="p-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                              title="Edit course"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {course.status !== 'pending_deletion' && (
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              disabled={deletingContentId === course.id}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all disabled:opacity-50"
                              title="Delete course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {course.status === 'pending_deletion' && (
                            <span className="text-xs text-yellow-400 whitespace-nowrap">Pending deletion</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You haven't uploaded any courses yet.</p>
                <button
                  onClick={() => {
                    setShowManageCoursesModal(false);
                    setShowUploadModal(true);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Upload Your First Course
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditMasterclassContentModal
          isOpen={!!editingCourse}
          title={editingCourse.title}
          description={editingCourse.description}
          category={editingCourse.category}
          level={editingCourse.level}
          features={editingCourse.features}
          lessonsCount={editingCourse.lessons_count}
          isPremium={editingCourse.is_premium}
          status={editingCourse.status}
          onSave={handleEditCourseSave}
          onDelete={() => handleDeleteCourse(editingCourse.id)}
          onClose={handleEditCourseClose}
          isSaving={isSaving}
          isDeleting={isDeleting}
          error={editError}
        />
      )}

      {/* Video Playback Modal */}
      {playingCourse && (
        <VideoPlaybackModal
          isOpen={isPlayerOpen}
          content={playingCourse}
          isLiked={userLikes.has(playingCourse.id)}
          onClose={handleClosePlayer}
          onLikeToggle={handleToggleLike}
          onFollowToggle={handleToggleFollow}
          isFollowing={userFollows.has(playingCourse.creator)}
        />
      )}
    </div>
  );
}
