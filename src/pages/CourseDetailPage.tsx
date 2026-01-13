import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  BookOpen,
  Award,
  Star,
  Users,
  CheckCircle,
  Lock,
  Share2,
  Bookmark,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import VideoPlaybackModal from '../components/VideoPlaybackModal';
import EnrollmentModal from '../components/EnrollmentModal';
import CourseLessonViewer from '../components/CourseLessonViewer';
import { useEnrollment } from '../hooks/useEnrollment';
import { createCertificate, downloadCertificateAsHTML } from '../lib/certificateService';
import { createInvoice, downloadInvoiceAsHTML } from '../lib/invoiceService';

interface CourseDetails {
  id: string;
  title: string;
  creator: string;
  description: string;
  category: string;
  thumbnail_url: string;
  content_url: string;
  duration: string | null;
  level: string;
  features: string[];
  lessons_count: number;
  views_count: number;
  like_count: number;
  is_premium: boolean;
  user_id: string;
  created_at: string;
  instructor_bio?: string;
  instructor_credentials?: string;
  instructor_image_url?: string;
  prerequisites?: string;
  target_audience?: string;
  course_price?: number;
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkEnrollment, getDetails } = useEnrollment();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState(null);
  const { updateProgress } = useEnrollment();

  // Fetch course details
  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('masterclass_page_content')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Course not found');

      setCourse(data);

      // Check if user is enrolled
      if (user) {
        try {
          const enrolled = await checkEnrollment(user.id, courseId);
          setIsEnrolled(enrolled);

          if (enrolled) {
            const details = await getDetails(user.id, courseId);
            setEnrollmentDetails(details);
          }
        } catch (err) {
          console.error('Failed to check enrollment:', err);
          setIsEnrolled(false);
        }
      }

      // Load bookmarked state from localStorage
      const bookmarkedCourseIds = JSON.parse(
        localStorage.getItem('bookmarkedCourseIds') || '[]'
      );
      setIsBookmarked(bookmarkedCourseIds.includes(courseId));
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseId, user, checkEnrollment, getDetails]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleBookmarkToggle = () => {
    if (!courseId) return;

    const bookmarkedCourseIds = JSON.parse(
      localStorage.getItem('bookmarkedCourseIds') || '[]'
    );
    const newBookmarked = !isBookmarked;
    const updated = newBookmarked
      ? [...bookmarkedCourseIds, courseId]
      : bookmarkedCourseIds.filter((id: string) => id !== courseId);

    localStorage.setItem('bookmarkedCourseIds', JSON.stringify(updated));
    setIsBookmarked(newBookmarked);
  };

  const handleEnrollClick = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    setShowEnrollmentModal(true);
  };

  const handleVideoClick = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!isEnrolled) {
      setShowEnrollmentModal(true);
      return;
    }
    setShowVideoPlayer(true);
  };

  const handleProgressUpdate = async (lessonsCompleted: number, progressPercentage: number) => {
    if (!enrollmentDetails) return;

    const success = await updateProgress(
      enrollmentDetails.id,
      progressPercentage,
      lessonsCompleted,
      progressPercentage === 100
    );

    if (success) {
      setEnrollmentDetails({
        ...enrollmentDetails,
        progress_percentage: progressPercentage,
        lessons_completed: lessonsCompleted,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-800 rounded-2xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              <div className="h-64 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="glass-effect p-8 rounded-2xl text-center">
            <p className="text-red-400 mb-4">{error || 'Course not found'}</p>
            <button
              onClick={() => navigate('/masterclass')}
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/masterclass')}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>

        {/* Video Hero Section */}
        <div className="relative mb-8">
          <div className="relative group aspect-video bg-gray-800 rounded-2xl overflow-hidden">
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleVideoClick}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/50"
            >
              {isEnrolled ? (
                <Play className="w-16 h-16 text-white" />
              ) : (
                <div className="text-center">
                  <Lock className="w-16 h-16 text-white mx-auto mb-2" />
                  <p className="text-white font-semibold">Enroll to watch</p>
                </div>
              )}
            </button>

            {/* Bookmark & Premium Badges */}
            <div className="absolute top-4 right-4 flex gap-3 z-10">
              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                  isBookmarked
                    ? 'bg-purple-500/40 text-purple-300'
                    : 'bg-black/40 text-gray-200 hover:text-white'
                }`}
              >
                <Bookmark className="w-6 h-6" />
              </button>
              {course.is_premium && (
                <div className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                  PREMIUM
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {course.level && (
                  <span className="px-3 py-1 bg-rose-400/20 text-rose-300 text-sm rounded-full font-medium">
                    {course.level}
                  </span>
                )}
                <span className="px-3 py-1 bg-purple-400/20 text-purple-300 text-sm rounded-full font-medium">
                  {course.category}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-gray-300 text-lg mb-4">by {course.creator}</p>

              {/* Rating and Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => {
                      const rating = course.like_count > 0 ? Math.min(5, (course.like_count / 100) * 5) : 0;
                      const isFilled = i < Math.floor(rating);
                      const isPartial = i === Math.floor(rating) && rating % 1 !== 0;
                      return (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            isFilled ? 'text-yellow-400' : isPartial ? 'text-yellow-200' : 'text-gray-600'
                          }`}
                          fill={isFilled ? 'currentColor' : isPartial ? 'currentColor' : 'none'}
                        />
                      );
                    })}
                  </div>
                  <span className="text-gray-300">
                    {course.like_count > 0 ? `${Math.min(5, (course.like_count / 100) * 5).toFixed(1)}` : '0.0'} ({course.like_count} likes)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-5 h-5" />
                  <span>{course.views_count} enrolled</span>
                </div>
              </div>
            </div>

            {/* Enroll CTA - Sticky */}
            <div className="flex flex-col gap-3">
              {isEnrolled ? (
                <div className="px-6 py-3 bg-green-500/20 text-green-300 rounded-xl border border-green-500/30 text-center">
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Enrolled
                </div>
              ) : (
                <button
                  onClick={handleEnrollClick}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all whitespace-nowrap"
                >
                  Enroll Now
                </button>
              )}
              <button className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="md:col-span-2 space-y-8">
            {/* Course Overview */}
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Course Overview</h2>
              <p className="text-gray-300 leading-relaxed">{course.description}</p>
            </div>

            {/* What You'll Learn */}
            {course.features && course.features.length > 0 && (
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">What You'll Learn</h2>
                <ul className="space-y-3">
                  {course.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Prerequisites</h2>
                <p className="text-gray-300 leading-relaxed">{course.prerequisites}</p>
              </div>
            )}

            {/* Target Audience */}
            {course.target_audience && (
              <div className="glass-effect p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Who Should Take This Course?</h2>
                <p className="text-gray-300 leading-relaxed">{course.target_audience}</p>
              </div>
            )}

            {/* Course Structure */}
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Course Structure</h2>
              <div className="space-y-3">
                {course.lessons_count > 0 ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-purple-400/10 rounded-lg">
                      <BookOpen className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-white font-semibold">
                          {course.lessons_count} Lessons
                        </p>
                        <p className="text-gray-400 text-sm">
                          {course.duration || 'Duration TBA'}
                        </p>
                      </div>
                    </div>
                    {isEnrolled && (
                      <div className="mt-4 p-4 bg-blue-400/10 rounded-lg">
                        <p className="text-blue-300 text-sm">
                          ✓ You have access to all {course.lessons_count} lessons
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">Course structure details coming soon</p>
                )}
              </div>
            </div>

            {/* Access Requirements */}
            {isEnrolled && (
              <div className="glass-effect p-6 rounded-2xl bg-green-400/5 border border-green-400/20">
                <h3 className="text-lg font-semibold text-green-300 mb-3">
                  ✓ Course Access Unlocked
                </h3>
                <p className="text-gray-300 text-sm">
                  You now have full access to all course materials, lessons, and resources.
                </p>
              </div>
            )}

            {/* Lessons Viewer */}
            {isEnrolled && course && (
              <CourseLessonViewer
                courseId={course.id}
                courseLessonsCount={course.lessons_count || 0}
                enrollmentProgress={{
                  lessons_completed: enrollmentDetails?.lessons_completed || 0,
                  progress_percentage: enrollmentDetails?.progress_percentage || 0,
                }}
                isEnrolled={isEnrolled}
                onProgressUpdate={handleProgressUpdate}
              />
            )}
          </div>

          {/* Right Column - Course Details */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {/* Course Details Card */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Course Details</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Level</p>
                  <p className="text-white font-medium">{course.level}</p>
                </div>
                <div className="pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Category</p>
                  <p className="text-white font-medium">{course.category}</p>
                </div>
                <div className="pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <p className="text-white font-medium">{course.duration || 'TBA'}</p>
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">Lessons</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <p className="text-white font-medium">{course.lessons_count}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Enrollment Status</p>
                  <p className={`font-medium ${isEnrolled ? 'text-green-400' : 'text-gray-400'}`}>
                    {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructor Card */}
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">About Instructor</h3>
              <div className="flex items-center gap-4 mb-4">
                {course.instructor_image_url ? (
                  <img
                    src={course.instructor_image_url}
                    alt={course.creator}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{course.creator}</p>
                  {course.instructor_credentials && (
                    <p className="text-gray-400 text-sm">{course.instructor_credentials}</p>
                  )}
                  {!course.instructor_credentials && (
                    <p className="text-gray-400 text-sm">Expert Instructor</p>
                  )}
                </div>
              </div>
              {course.instructor_bio && (
                <div className="mb-4 p-3 bg-purple-400/10 rounded-lg">
                  <p className="text-gray-300 text-sm">{course.instructor_bio}</p>
                </div>
              )}
              <button className="w-full px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium">
                Follow Instructor
              </button>
            </div>

            {/* Progress Card (if enrolled) */}
            {isEnrolled && enrollmentDetails && (
              <div className="glass-effect p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Your Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Overall Progress</span>
                      <span className="text-sm text-white font-semibold">
                        {enrollmentDetails.progress_percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollmentDetails.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {enrollmentDetails.lessons_completed}/{course.lessons_count} lessons completed
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Playback Modal */}
      {showVideoPlayer && course && (
        <VideoPlaybackModal
          content={course}
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}

      {/* Enrollment Modal */}
      {showEnrollmentModal && course && !isEnrolled && (
        <EnrollmentModal
          course={course}
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          onEnrollmentComplete={() => {
            setShowEnrollmentModal(false);
            setIsEnrolled(true);
          }}
        />
      )}
    </div>
  );
}
