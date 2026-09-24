import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@api/client';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  BookOpen,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    status: 'DRAFT',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => courseApi.list().then((res) => res.data),
  });

  const createCourse = useMutation({
    mutationFn: (data) => courseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setShowForm(false);
      resetForm();
      toast.success('Course created!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create course'),
  });

  const updateCourse = useMutation({
    mutationFn: ({ id, data }) => courseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setShowForm(false);
      setEditingCourse(null);
      resetForm();
      toast.success('Course updated!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update course'),
  });

  const deleteCourse = useMutation({
    mutationFn: (id) => courseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course deleted!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete course'),
  });

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '', price: '', status: 'DRAFT' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
    };

    if (editingCourse) {
      updateCourse.mutate({ id: editingCourse.id, data: payload });
    } else {
      createCourse.mutate(payload);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description,
      price: course.price.toString(),
      status: course.status,
    });
    setShowForm(true);
  };

  const courses = data?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Courses</h1>
          <p className="text-dark-400">Manage your course content</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Course'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Price (₦)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createCourse.isPending || updateCourse.isPending}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
            >
              {createCourse.isPending || updateCourse.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingCourse ? (
                'Update Course'
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full bg-dark-900 border border-dark-800 rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-500">No courses yet</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-dark-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.status === 'PUBLISHED' ? 'bg-success-500/10 text-success-500' :
                  course.status === 'DRAFT' ? 'bg-warning-500/10 text-warning-500' :
                  'bg-dark-700 text-dark-400'
                }`}>
                  {course.status}
                </div>
                <div className="flex gap-1">
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors"
                    title="Manage modules & lessons"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this course?')) deleteCourse.mutate(course.id);
                    }}
                    className="p-1.5 text-dark-400 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
              <p className="text-dark-400 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-dark-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.moduleCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.studentCount || 0}
                  </span>
                </div>
                <span className="text-white font-semibold">₦{Number(course.price).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}