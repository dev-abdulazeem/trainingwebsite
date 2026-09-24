import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseApi, progressApi } from '@api/client';
import { Loader2, AlertCircle, ArrowLeft, BookOpen, Lock, CheckCircle, ChevronDown, ChevronUp, PlayCircle, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(null);
  const [courseData, setCourseData] = useState(null);

  // 1. Fetch catalog
  const { data: allCourses, isLoading: catalogLoading } = useQuery({
    queryKey: ['courses-catalog'],
    queryFn: async () => {
      const res = await courseApi.list();
      return res.data;
    },
  });

  // 2. Check enrollment - CATCH 403/404 gracefully
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      try {
        const res = await progressApi.getCourseProgress(courseId);
        return res.data;
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 404) {
          return { isEnrolled: false, hasAccess: false };
        }
        throw error;
      }
    },
    enabled: !!courseId,
    retry: false,
  });

  const isEnrolled = !!(
    progressData && 
    (progressData.isEnrolled === true || 
     progressData.enrollment?.status === 'ACTIVE' || 
     progressData.hasAccess === true ||
     typeof progressData.completedLessons === 'number')
  );

  // 3. Fetch full course ONLY if enrolled
  const { data: learnData, isLoading: learnLoading } = useQuery({
    queryKey: ['course-learn', courseId],
    queryFn: async () => {
      const res = await courseApi.getLearn(courseId);
      return res.data;
    },
    enabled: !!courseId && isEnrolled,
    retry: false,
  });

  // Simple redirect to Payment Page
  const handleEnrollNow = () => {
    if (!courseData) {
      toast.error('Course data not loaded');
      return;
    }
    navigate(`/payment?courseId=${courseData.id}`);
  };

  const courses = Array.isArray(allCourses?.courses) ? allCourses.courses : 
                  Array.isArray(allCourses) ? allCourses : [];

  useEffect(() => {
    if (courseId && courses.length > 0) {
      const found = courses.find(c => c.id === courseId);
      setCourseData(found || null);
    }
  }, [courseId, courses]);

  const isLoading = catalogLoading || progressLoading || (isEnrolled && learnLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-400">Loading course...</p>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Available Courses</h1>
          <p className="text-gray-400">Choose a course to start your learning journey</p>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Courses Available</h2>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all">
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-primary-400/30" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{c.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span className="text-2xl font-bold text-white">₦{Number(c.price || 0).toLocaleString()}</span>
                    <Link to={`/course/${c.id}`} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-3">Course Not Found</h2>
        <p className="text-gray-400 mb-8">This course doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/course')} className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl">
          Browse Courses
        </button>
      </div>
    );
  }

  const totalModules = courseData.modules?.length || 0;
  const totalLessons = courseData.modules?.reduce((acc, m) => acc + (m.lessonCount || m.lessons?.length || 0), 0) || 0;
  const originalPrice = parseFloat(courseData.price || 0);

  // ==========================================
  // ENROLLED VIEW
  // ==========================================
  if (isEnrolled && learnData?.course) {
    const course = learnData.course;
    const progress = progressData;
    const completedLessons = progress?.completedLessons || 0;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-1.5 bg-green-900/30 text-green-400 rounded-lg text-sm font-semibold border border-green-700/50">Enrolled</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
          <p className="text-gray-300 text-lg mb-6">{course.description}</p>
          
          <div className="flex items-center gap-6 pt-6 border-t border-gray-800">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <span className="text-gray-300">{totalModules} modules • {totalLessons} lessons</span>
            <span className="text-primary-400 font-semibold">{percentage}% complete</span>
          </div>

          <div className="mt-6">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-sm text-gray-400 mt-2">{completedLessons} of {totalLessons} lessons completed</p>
          </div>

          {percentage > 0 && percentage < 100 && (
            <button
              onClick={() => {
                const nextLesson = course.modules.flatMap(m => m.lessons).find(l => !progress.lessons?.find(pl => pl.lessonId === l.id)?.isCompleted);
                if (nextLesson) navigate(`/lesson/${nextLesson.id}`);
              }}
              className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" /> Continue Learning
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">Course Content</h3>
          {course.modules?.map((module, index) => (
            <div key={module.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-400 font-bold border border-primary-700/30">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{module.title}</h4>
                    <p className="text-sm text-gray-500">{module.lessons?.length || 0} lessons</p>
                  </div>
                </div>
                {expandedModule === module.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
              </button>

              {expandedModule === module.id && (
                <div className="border-t border-gray-800 divide-y divide-gray-800">
                  {module.lessons?.map((lesson) => {
                    const isCompleted = progress.lessons?.find(l => l.lessonId === lesson.id)?.isCompleted;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => navigate(`/lesson/${lesson.id}`)}
                        className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-900/30' : 'bg-primary-900/30'}`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <PlayCircle className="w-5 h-5 text-primary-400" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{lesson.title}</p>
                          {lesson.duration && <p className="text-xs text-gray-500 mt-0.5">{Math.floor(lesson.duration / 60)} min</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // NON-ENROLLED VIEW (PURCHASE PAGE - NO COUPON HERE)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <button onClick={() => navigate('/course')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-white mb-3">{courseData.title}</h1>
        <p className="text-gray-300 text-lg mb-6">{courseData.description}</p>
        <div className="flex items-center gap-6 pt-6 border-t border-gray-800">
          <BookOpen className="w-5 h-5 text-primary-400" />
          <span className="text-gray-300">{totalModules} modules • {totalLessons} lessons</span>
          <span className="text-2xl font-bold text-primary-400">₦{Number(courseData.price || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">What You'll Learn</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span className="text-gray-300 text-sm">YouTube automation mastery</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span className="text-gray-300 text-sm">Content creation</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span className="text-gray-300 text-sm">Monetization strategies</span></div>
              <div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span className="text-gray-300 text-sm">Channel scaling</span></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Course Content</h3>
            <div className="space-y-3">
              {courseData.modules?.map((module, index) => (
                <div key={module.id} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-400 font-bold border border-primary-700/30">{index + 1}</div>
                    <div>
                      <p className="text-white font-medium">{module.title}</p>
                      <p className="text-sm text-gray-500">{module.lessonCount || module.lessons?.length || 0} lessons</p>
                    </div>
                  </div>
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Cleaned up, no coupon input */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-24">
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">₦{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">One-time payment • Lifetime access</p>

            <button 
              onClick={handleEnrollNow}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 mb-6 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Enroll Now
            </button>

            <div className="space-y-3 pt-6 border-t border-gray-800">
              <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-green-500" /><span>Lifetime access</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-green-500" /><span>All content included</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-green-500" /><span>Certificate of completion</span></div>
              <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-green-500" /><span>Community access</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}