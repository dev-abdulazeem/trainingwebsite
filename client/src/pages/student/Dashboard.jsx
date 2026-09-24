import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@api/client';
import {
  Play,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  Flame,
  AlertTriangle,
  Clock,
  ChevronRight,
  Trophy,
} from 'lucide-react';

export default function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.dashboard().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  // FIXED: Changed the Link path from "/" to "/course"
  if (!data?.hasEnrollment) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-dark-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">No Active Enrollment</h2>
        <p className="text-dark-400 mb-8">Purchase the course to start learning</p>
        
        {/* 👇 CHANGED THIS LINE 👇 */}
        <Link
          to="/course" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors"
        >
          View Course
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const {
    welcomeMessage,
    courseProgress,
    currentLesson,
    nextLesson,
    pendingAssignments,
    recentCommunityActivity,
    notifications,
    inactivityWarning,
  } = data;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{welcomeMessage}</h1>
        <p className="text-dark-400">Continue where you left off</p>
      </div>

      {/* Inactivity Warning */}
      {inactivityWarning && (
        <div className={`p-4 rounded-xl border ${
          inactivityWarning.level === 'critical'
            ? 'bg-danger-500/10 border-danger-500/20 text-danger-400'
            : 'bg-warning-500/10 border-warning-500/20 text-warning-400'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{inactivityWarning.message}</p>
              <p className="text-sm opacity-80 mt-1">
                {inactivityWarning.daysInactive} days since last activity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-2xl font-bold text-white">{courseProgress.percentage}%</span>
          </div>
          <p className="text-dark-400 text-sm">Course Progress</p>
          <div className="mt-3 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{ width: `${courseProgress.percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-success-500/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-success-500" />
            </div>
            <span className="text-2xl font-bold text-white">
              {courseProgress.completedLessons}/{courseProgress.totalLessons}
            </span>
          </div>
          <p className="text-dark-400 text-sm">Lessons Completed</p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-warning-500/10 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-warning-500" />
            </div>
            <span className="text-2xl font-bold text-white">{pendingAssignments.length}</span>
          </div>
          <p className="text-dark-400 text-sm">Pending Assignments</p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary-600/10 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-2xl font-bold text-white">0</span>
          </div>
          <p className="text-dark-400 text-sm">Day Streak</p>
        </div>
      </div>

      {/* Continue Learning */}
      {currentLesson && (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Continue Learning</h2>
            <Link
              to={`/lesson/${currentLesson.id}`}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
            >
              Resume
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{currentLesson.title}</p>
              <p className="text-dark-500 text-sm">{currentLesson.moduleTitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Assignments</h2>
            <Link to="/assignments" className="text-primary-400 hover:text-primary-300 text-sm">
              View all
            </Link>
          </div>
          {pendingAssignments.length === 0 ? (
            <p className="text-dark-500 text-sm py-4">No pending assignments</p>
          ) : (
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                  <Clock className="w-5 h-5 text-warning-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{assignment.title}</p>
                    <p className="text-dark-500 text-xs">{assignment.lessonTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Lesson */}
        {nextLesson && (
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Up Next</h2>
            <div className="p-4 bg-dark-800/50 rounded-lg">
              <p className="text-white font-medium">{nextLesson.title}</p>
              <Link
                to={`/lesson/${nextLesson.id}`}
                className="inline-flex items-center gap-2 mt-3 text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                Start Lesson
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}