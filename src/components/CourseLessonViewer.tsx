import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Lock, AlertCircle, Download, Play } from 'lucide-react';
import VideoPlaybackModal from './VideoPlaybackModal';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  videoUrl?: string;
  description?: string;
  order: number;
  video_id?: string;
  thumbnail_url?: string;
  content_url?: string;
}

interface CourseLessonViewerProps {
  courseId: string;
  courseLessonsCount: number;
  enrollmentProgress: {
    lessons_completed: number;
    progress_percentage: number;
  };
  isEnrolled: boolean;
  onProgressUpdate?: (lessonsCompleted: number, progressPercentage: number) => void;
}

export default function CourseLessonViewer({
  courseId,
  courseLessonsCount,
  enrollmentProgress,
  isEnrolled,
  onProgressUpdate,
}: CourseLessonViewerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showCertificateOption, setShowCertificateOption] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Generate mock lessons based on course lessons count
  useEffect(() => {
    if (courseLessonsCount > 0) {
      const mockLessons: Lesson[] = Array.from({ length: courseLessonsCount }, (_, i) => ({
        id: i + 1,
        title: `Lesson ${i + 1}: ${['Introduction', 'Fundamentals', 'Intermediate Concepts', 'Advanced Topics', 'Capstone Project', 'Q&A Session'][i % 6]}`,
        duration: `${30 + i * 5} min`,
        completed: i < enrollmentProgress.lessons_completed,
        description: `Learn the concepts and practices for lesson ${i + 1} of this course.`,
        order: i + 1,
      }));
      setLessons(mockLessons);
      
      // Auto-select first lesson if not enrolled, first incomplete lesson if enrolled
      if (isEnrolled && mockLessons.length > 0) {
        const firstIncomplete = mockLessons.find((l) => !l.completed) || mockLessons[0];
        setSelectedLesson(firstIncomplete);
      }
    }

    // Check if course is completed
    if (isEnrolled && enrollmentProgress.progress_percentage === 100) {
      setShowCertificateOption(true);
    }
  }, [courseLessonsCount, enrollmentProgress, isEnrolled]);

  const handleLessonComplete = () => {
    if (!selectedLesson) return;

    const updatedLessons = lessons.map((lesson) =>
      lesson.id === selectedLesson.id ? { ...lesson, completed: true } : lesson
    );

    setLessons(updatedLessons);

    const completedCount = updatedLessons.filter((l) => l.completed).length;
    const progressPercentage = Math.round((completedCount / lessons.length) * 100);

    if (onProgressUpdate) {
      onProgressUpdate(completedCount, progressPercentage);
    }

    // Move to next lesson
    const nextLesson = updatedLessons.find((l) => l.order > (selectedLesson?.order || 0) && !l.completed);
    if (nextLesson) {
      setSelectedLesson(nextLesson);
    } else if (progressPercentage === 100) {
      setShowCertificateOption(true);
    }
  };

  if (!isEnrolled) {
    return (
      <div className="glass-effect p-6 rounded-2xl text-center">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-300">Enroll in this course to access lessons</p>
      </div>
    );
  }

  if (courseLessonsCount === 0) {
    return (
      <div className="glass-effect p-6 rounded-2xl">
        <AlertCircle className="w-6 h-6 text-yellow-400 inline mr-2" />
        <p className="text-gray-300 inline">Course lessons coming soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect p-6 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">Course Lessons</h3>

        {/* Progress Overview */}
        <div className="mb-6 p-4 bg-purple-400/10 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm font-semibold text-white">
              {enrollmentProgress.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-rose-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${enrollmentProgress.progress_percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {enrollmentProgress.lessons_completed} of {courseLessonsCount} lessons completed
          </p>
        </div>

        {/* Lessons List */}
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedLesson?.id === lesson.id
                  ? 'bg-gradient-to-r from-rose-500/20 to-purple-600/20 border border-purple-400/50'
                  : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <p className="text-white font-medium">{lesson.title}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{lesson.duration}</p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {lesson.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Detail Panel */}
      {selectedLesson && (
        <div className="glass-effect p-6 rounded-2xl">
          <h4 className="text-xl font-bold text-white mb-4">{selectedLesson.title}</h4>

          {/* Lesson Video Player */}
          {selectedLesson.content_url ? (
            <div className="mb-6">
              <div className="relative group aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={selectedLesson.thumbnail_url || ''}
                  alt={selectedLesson.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowVideoPlayer(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/50"
                >
                  <Play className="w-16 h-16 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Video content loading...</p>
              </div>
            </div>
          )}

          {/* Lesson Description */}
          {selectedLesson.description && (
            <div className="mb-6">
              <h5 className="text-white font-semibold mb-2">About This Lesson</h5>
              <p className="text-gray-300 text-sm">{selectedLesson.description}</p>
            </div>
          )}

          {/* Lesson Duration & Resources */}
          <div className="mb-6 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Duration:</span> {selectedLesson.duration}
            </p>
            <button className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Download Resources
            </button>
          </div>

          {/* Mark as Complete Button */}
          {!selectedLesson.completed && (
            <button
              onClick={handleLessonComplete}
              className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Mark as Complete
            </button>
          )}

          {selectedLesson.completed && (
            <div className="p-3 bg-green-400/10 border border-green-400/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300">You've completed this lesson</span>
            </div>
          )}
        </div>
      )}

      {/* Certificate of Completion */}
      {showCertificateOption && (
        <div className="glass-effect p-6 rounded-2xl bg-yellow-400/5 border border-yellow-400/30">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xl font-bold text-yellow-300 mb-2">🎉 Congratulations!</h4>
              <p className="text-gray-300">You've completed this course. Download your certificate of completion.</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap ml-4">
              Get Certificate
            </button>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && selectedLesson && selectedLesson.content_url && (
        <VideoPlaybackModal
          content={{
            id: courseId,
            title: selectedLesson.title,
            content_url: selectedLesson.content_url,
            thumbnail_url: selectedLesson.thumbnail_url || '',
            creator: '',
            category: '',
            duration: selectedLesson.duration,
            description: selectedLesson.description || '',
            views_count: 0,
            like_count: 0,
            is_premium: false,
            user_id: '',
            created_at: '',
            type: 'lesson',
          }}
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}
    </div>
  );
}
