import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, moduleApi, lessonApi } from '@api/client';
import {
  Plus, Trash2, Loader2, ChevronLeft, Video, Link as LinkIcon,
  UploadCloud, Pencil, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCourseDetail() {
  const { courseId } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [videoMode, setVideoMode] = useState('upload'); // 'upload' | 'link'
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', isPublished: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-course-full', courseId],
    queryFn: () => courseApi.getFull(courseId).then((r) => r.data),
  });
  const course = data?.course;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-course-full', courseId] });

  const createModule = useMutation({
    mutationFn: () => moduleApi.create(courseId, { title: newModuleTitle }),
    onSuccess: () => {
      setNewModuleTitle('');
      invalidate();
      toast.success('Module added!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteModule = useMutation({
    mutationFn: (id) => moduleApi.delete(id),
    onSuccess: () => { invalidate(); toast.success('Module deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resetLessonForm = () => {
    setForm({ title: '', description: '', videoUrl: '', isPublished: false });
    setSelectedFile(null);
    setVideoMode('upload');
    setActiveModuleId(null);
    setEditingLesson(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('isPublished', form.isPublished);
    if (videoMode === 'upload' && selectedFile) {
      fd.append('video', selectedFile);
    } else if (videoMode === 'link' && form.videoUrl) {
      fd.append('videoUrl', form.videoUrl);
    }
    return fd;
  };

  const saveLesson = useMutation({
    mutationFn: () =>
      editingLesson
        ? lessonApi.update(editingLesson.id, buildFormData())
        : lessonApi.create(activeModuleId, buildFormData()),
    onSuccess: () => {
      invalidate();
      resetLessonForm();
      toast.success(editingLesson ? 'Lesson updated!' : 'Lesson added!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save lesson'),
  });

  const deleteLesson = useMutation({
    mutationFn: (id) => lessonApi.delete(id),
    onSuccess: () => { invalidate(); toast.success('Lesson deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const startEditLesson = (lesson, moduleId) => {
    setEditingLesson(lesson);
    setActiveModuleId(moduleId);
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      videoUrl: lesson.videoType === 'LINK' ? lesson.videoUrl : '',
      isPublished: lesson.isPublished,
    });
    setVideoMode(lesson.videoType === 'LINK' ? 'link' : 'upload');
    setSelectedFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-dark-400">Course not found</p>
        <Link to="/admin/courses" className="text-primary-400 hover:text-primary-300">
          Back to courses
        </Link>
      </div>
    );
  }

  const lessonTotal = course?.modules?.reduce((n, m) => n + m.lessons.length, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/courses" className="p-2 text-dark-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          <p className="text-dark-400 text-sm">
            {course.modules?.length || 0} modules · {lessonTotal} lessons
          </p>
        </div>
      </div>

      {/* Add module */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex gap-3">
        <input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="New module title (e.g. Module 1: Getting Started)"
          className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newModuleTitle.trim()) {
              createModule.mutate();
            }
          }}
        />
        <button
          onClick={() => createModule.mutate()}
          disabled={!newModuleTitle.trim() || createModule.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {createModule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Module
        </button>
      </div>

      {/* Modules & lessons */}
      {course.modules?.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-12 text-center">
          <p className="text-dark-500">No modules yet. Add your first module above!</p>
        </div>
      ) : (
        course.modules?.map((module, mi) => (
          <div key={module.id} className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-dark-800/30 border-b border-dark-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600/10 rounded-lg flex items-center justify-center text-primary-400 font-semibold text-sm">
                {mi + 1}
              </div>
              <h3 className="text-lg font-semibold text-white flex-1">{module.title}</h3>
              <span className="text-sm text-dark-500">{module.lessons?.length || 0} lessons</span>
              <button
                onClick={() => {
                  if (confirm('Delete this module and ALL its lessons?')) deleteModule.mutate(module.id);
                }}
                className="p-1.5 text-dark-400 hover:text-danger-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-dark-800">
              {module.lessons?.length === 0 ? (
                <p className="p-4 text-sm text-dark-500 text-center">No lessons yet</p>
              ) : (
                module.lessons.map((lesson, li) => (
                  <div key={lesson.id} className="flex items-center gap-4 p-4">
                    <span className="text-dark-600 text-sm w-6">{li + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-dark-500 flex items-center gap-2">
                        {lesson.videoType === 'LINK' ? (
                          <><LinkIcon className="w-3 h-3" /> External link</>
                        ) : lesson.videoType === 'UPLOAD' ? (
                          <><Video className="w-3 h-3" /> Uploaded video</>
                        ) : (
                          'No video'
                        )}
                        {lesson.isPublished && (
                          <span className="text-success-500 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Published
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => startEditLesson(lesson, module.id)}
                      className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this lesson?')) deleteLesson.mutate(lesson.id);
                      }}
                      className="p-1.5 text-dark-400 hover:text-danger-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Lesson form (per module) */}
            {activeModuleId === module.id ? (
              <div className="p-4 bg-dark-800/20 border-t border-dark-800 space-y-4 animate-fade-in">
                <h4 className="text-sm font-semibold text-dark-300">
                  {editingLesson ? 'Edit Lesson' : 'New Lesson'}
                </h4>

                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Lesson title"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description (optional)"
                  rows={2}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                />

                {/* Upload or Link toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      videoMode === 'upload'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800 text-dark-400 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" /> Upload Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('link')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      videoMode === 'link'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800 text-dark-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" /> Paste Link
                  </button>
                </div>

                {videoMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      className="w-full text-dark-400 file:mr-4 file:px-4 file:py-2.5 file:rounded-lg file:border-0 file:bg-dark-800 file:text-white hover:file:bg-dark-700 file:cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-xs text-success-500 mt-2">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                      </p>
                    )}
                    {editingLesson?.videoType === 'UPLOAD' && !selectedFile && (
                      <p className="text-xs text-dark-500 mt-2">
                        Current video is kept unless you choose a new file.
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or https://drive.google.com/file/d/... or https://vimeo.com/..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                  />
                )}

                <label className="flex items-center gap-2 text-sm text-dark-300">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="rounded bg-dark-800 border-dark-700"
                  />
                  Publish immediately (students can see it)
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => saveLesson.mutate()}
                    disabled={saveLesson.isPending || !form.title.trim() ||
                      (videoMode === 'upload' && !selectedFile && !editingLesson) ||
                      (videoMode === 'link' && !form.videoUrl.trim() && !editingLesson)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {saveLesson.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                  </button>
                  <button
                    onClick={resetLessonForm}
                    className="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { resetLessonForm(); setActiveModuleId(module.id); }}
                className="w-full p-3 text-sm text-dark-500 hover:text-primary-400 hover:bg-dark-800/30 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}