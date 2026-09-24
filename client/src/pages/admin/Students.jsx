import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@api/client';
import {
  Search,
  Loader2,
  PauseCircle,
  PlayCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, status, page],
    queryFn: () =>
      adminApi
        .getStudents({ search: search || undefined, status: status !== 'ALL' ? status : undefined, page, limit: 20 })
        .then((res) => res.data),
  });

  const toggleStatus = useMutation({
    mutationFn: (id) => adminApi.toggleStudentStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Student status updated');
    },
  });

  const students = data?.students || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Students</h1>
          <p className="text-dark-400">Manage student accounts and access</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-dark-600 focus:border-primary-500 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-dark-900 border border-dark-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary-500 transition-colors"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Student</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Progress</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Submissions</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Last Active</th>
                <th className="text-left text-dark-400 text-sm font-medium px-6 py-4">Status</th>
                <th className="text-right text-dark-400 text-sm font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{student.name}</p>
                          <p className="text-dark-500 text-xs">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{student.completedLessons} lessons</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{student.totalSubmissions}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark-400 text-sm">
                        {student.lastActiveAt
                          ? new Date(student.lastActiveAt).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        student.isActive
                          ? 'bg-success-500/10 text-success-500'
                          : 'bg-danger-500/10 text-danger-500'
                      }`}>
                        {student.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                          title="View Progress"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus.mutate(student.id)}
                          disabled={toggleStatus.isPending}
                          className={`p-2 transition-colors ${
                            student.isActive
                              ? 'text-dark-400 hover:text-danger-500'
                              : 'text-dark-400 hover:text-success-500'
                          }`}
                          title={student.isActive ? 'Pause Account' : 'Reactivate Account'}
                        >
                          {student.isActive ? (
                            <PauseCircle className="w-4 h-4" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-dark-500">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="flex items-center gap-1 text-sm text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}