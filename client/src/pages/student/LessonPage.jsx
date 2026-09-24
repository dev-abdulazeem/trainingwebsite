import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { lessonApi, progressApi, assignmentApi, submissionApi } from '@api/client';
import VideoPlayer from '@components/VideoPlayer';
import { useState, useRef, useEffect } from 'react';
import {
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  Send,
  Loader2,
  Clock,
  Lock,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  // Fetch lesson data with proper error handling
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonApi.get(lessonId).then((res) => res.data),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const trackProgress = useMutation({
    mutationFn: (data) => progressApi.track(data),
    onError: (error) => {
      console.error('Failed to track progress:', error);
    },
  });

  const completeLesson = useMutation({
    mutationFn: (data) => progressApi.complete(data),
    onSuccess: () => {
      toast.success('Lesson completed!');
    },
    onError: (error) => {
      toast.error('Failed to mark lesson as complete');
      console.error('Completion error:', error);
    },
  });

  const submitAssignment = useMutation({
    mutationFn: (data) => submissionApi.create(data),
    onSuccess: () => {
      toast.success('Assignment submitted successfully!');
      setSubmissionContent('');
      setSubmissionFile('');
    },
    onError: (error) => {
      toast.error('Failed to submit assignment');
      console.error('Submission error:', error);
    },
  });

  // Detect video type
  const detectVideoType = (url) => {
    if (!url) return 'none';
    if (/youtu\.be\/|youtube\.com\/(watch|shorts|embed)/i.test(url)) return 'youtube';
    if (/vimeo\.com\//i.test(url)) return 'vimeo';
    if (/drive\.google\.com\//i.test(url)) return 'google-drive';
    if (/\.m3u8($|\?)/i.test(url)) return 'hls';
    if (/\.(mp4|webm|ogg|mov|mkv|avi)($|\?)/i.test(url)) return 'direct';
    return 'direct';
  };

  // Safely extract data with fallbacks (MOVED TO TOP)
  const lesson = data?.lesson || {};
  const progress = data?.progress || {};
  const navigation = data?.navigation || {};
  const assignment = data?.assignment?.assignment;
  const latestSubmission = data?.assignment?.latestSubmission;
  const videoType = detectVideoType(lesson.videoUrl);

  // Video event listeners (only for direct video files)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lesson?.videoUrl) return;

    const videoType = detectVideoType(lesson.videoUrl);
    if (videoType !== 'direct' && videoType !== 'hls') return;

    const handleTimeUpdate = () => {
      setWatchedSeconds(Math.floor(video.currentTime));
    };

    const handleEnded = () => {
      if (lessonId) {
        completeLesson.mutate({ lessonId });
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [lessonId, lesson?.videoUrl, completeLesson]);

  // Auto-save progress every 10 seconds (only for direct video)
  useEffect(() => {
    if (!lesson?.duration || watchedSeconds === 0) return;
    
    const videoType = detectVideoType(lesson.videoUrl);
    if (videoType !== 'direct' && videoType !== 'hls') return;

    const interval = setInterval(() => {
      trackProgress.mutate({
        lessonId,
        watchedSeconds,
        totalSeconds: lesson.duration,
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [watchedSeconds, lessonId, lesson?.duration, lesson?.videoUrl, trackProgress]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (queryError || !data) {
    return (
      <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Failed to Load Lesson</h2>
            <p className="text-dark-300 mb-4">
              {queryError?.message || 'Unable to load the lesson. Please try again.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleManualComplete = () => {
    if (!lessonId) {
      toast.error('Lesson ID not found');
      return;
    }
    completeLesson.mutate({ lessonId });
  };

  const handleSubmitAssignment = (e) => {
    e.preventDefault();

    if (!submissionContent.trim() && !submissionFile.trim()) {
      toast.error('Please provide either an answer or a file URL');
      return;
    }

    if (!assignment?.id) {
      toast.error('Assignment ID not found');
      return;
    }

    submitAssignment.mutate({
      assignmentId: assignment.id,
      content: submissionContent.trim() || undefined,
      fileUrl: submissionFile.trim() || undefined,
    });
  };

  // Render video player based on type
  const renderVideoPlayer = () => {
    if (!lesson.videoUrl) {
      return (
        <div className="aspect-video bg-dark-950 flex items-center justify-center">
          <div className="text-center">
            <Play className="w-16 h-16 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-500">Video coming soon</p>
          </div>
        </div>
      );
    }

    // For external videos (YouTube, Vimeo, Google Drive) - use VideoPlayer with iframe
    if (videoType === 'youtube' || videoType === 'vimeo' || videoType === 'google-drive') {
      return (
        <div className="aspect-video bg-dark-950">
          <VideoPlayer 
            url={lesson.videoUrl} 
            className="w-full h-full"
          />
        </div>
      );
    }

    // For direct video files and HLS - use native video element
    return (
      <div className="aspect-video bg-dark-950">
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          className="w-full h-full"
          controls
          poster={lesson.thumbnailUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {renderVideoPlayer()}

        {/* Video Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-2">
                {lesson.title || 'Untitled Lesson'}
              </h1>
              <p className="text-dark-400 text-sm">
                {lesson.moduleTitle || 'Module'} • {lesson.courseTitle || 'Course'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {progress?.isCompleted ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-success-500/10 text-success-500 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </span>
              ) : (
                <button
                  onClick={handleManualComplete}
                  disabled={completeLesson.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {completeLesson.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {navigation?.previous ? (
          <Link
            to={`/lesson/${navigation.previous.id}`}
            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Previous</span>
          </Link>
        ) : (
          <div />
        )}
        {navigation?.next ? (
          <Link
            to={`/lesson/${navigation.next.id}`}
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            <span className="text-sm">Next Lesson</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Tabs */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <div className="flex border-b border-dark-800">
          {[
            { id: 'description', label: 'Description', icon: FileText },
            { id: 'resources', label: 'Resources', icon: Upload },
            { id: 'assignment', label: 'Assignment', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-dark-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="prose prose-invert max-w-none">
              <p className="text-dark-300 leading-relaxed">
                {lesson.description || 'No description available for this lesson.'}
              </p>
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              {!lesson.resources || lesson.resources.length === 0 ? (
                <p className="text-dark-500 text-center py-8">
                  No resources available for this lesson
                </p>
              ) : (
                <div className="space-y-3">
                  {lesson.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center group-hover:bg-primary-600/20">
                        <FileText className="w-5 h-5 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{resource.title}</p>
                        <p className="text-dark-500 text-xs uppercase">
                          {resource.fileType || 'File'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-600" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignment' && (
            <div>
              {!assignment ? (
                <p className="text-dark-500 text-center py-8">
                  No assignment for this lesson
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-dark-400 leading-relaxed mb-4">
                      {assignment.description}
                    </p>
                    {assignment.dueDays && (
                      <div className="flex items-center gap-2 text-sm text-dark-500">
                        <Clock className="w-4 h-4" />
                        <span>Due in {assignment.dueDays} days</span>
                      </div>
                    )}
                  </div>

                  {latestSubmission ? (
                    <div
                      className={`p-4 rounded-lg ${
                        latestSubmission.status === 'APPROVED'
                          ? 'bg-success-500/10 border border-success-500/20'
                          : latestSubmission.status === 'REJECTED'
                          ? 'bg-danger-500/10 border border-danger-500/20'
                          : 'bg-warning-500/10 border border-warning-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle
                          className={`w-5 h-5 ${
                            latestSubmission.status === 'APPROVED'
                              ? 'text-success-500'
                              : latestSubmission.status === 'REJECTED'
                              ? 'text-danger-500'
                              : 'text-warning-500'
                          }`}
                        />
                        <span className="font-medium text-white">
                          Status: {latestSubmission.status}
                        </span>
                      </div>
                      {latestSubmission.feedback && (
                        <p className="text-dark-400 text-sm mt-2">
                          Feedback: {latestSubmission.feedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAssignment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Your Answer
                        </label>
                        <textarea
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          rows={4}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                          placeholder="Write your response here..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          File URL (optional)
                        </label>
                        <input
                          type="url"
                          value={submissionFile}
                          onChange={(e) => setSubmissionFile(e.target.value)}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                          placeholder="https://..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          submitAssignment.isPending ||
                          (!submissionContent.trim() && !submissionFile.trim())
                        }
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {submitAssignment.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Submit Assignment
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}