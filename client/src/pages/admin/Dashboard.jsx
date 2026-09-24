import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@api/client';
import {
  Users,
  BookOpen,
  CreditCard,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'text-primary-400', bg: 'bg-primary-600/10' },
  { key: 'totalCourses', label: 'Courses', icon: BookOpen, color: 'text-success-500', bg: 'bg-success-500/10' },
  { key: 'totalEnrollments', label: 'Enrollments', icon: TrendingUp, color: 'text-warning-500', bg: 'bg-warning-500/10' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: CreditCard, color: 'text-primary-400', bg: 'bg-primary-600/10', format: (v) => `₦${Number(v).toLocaleString()}` },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const { stats, recentPayments, recentStudents } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-dark-400">Overview of your course platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = card.format ? card.format(stats[card.key]) : stats[card.key];
          return (
            <div key={card.key} className="bg-dark-900 border border-dark-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{value}</p>
              <p className="text-dark-500 text-sm">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success-500" />
            <span className="text-dark-400 text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-warning-500" />
            <span className="text-dark-400 text-sm">Pending Submissions</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingSubmissions}</p>
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
            <span className="text-dark-400 text-sm">Inactive Students</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeWarnings}</p>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <div className="p-6 border-b border-dark-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
          <Link to="/admin/students" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-dark-800">
          {recentPayments?.length === 0 ? (
            <p className="p-6 text-dark-500 text-center">No payments yet</p>
          ) : (
            recentPayments?.slice(0, 5).map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-success-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-success-500" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{payment.user.name}</p>
                    <p className="text-dark-500 text-xs">{payment.course.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">₦{Number(payment.finalAmount).toLocaleString()}</p>
                  <p className="text-dark-500 text-xs">{new Date(payment.paidAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <div className="p-6 border-b border-dark-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Students</h2>
          <Link to="/admin/students" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-dark-800">
          {recentStudents?.length === 0 ? (
            <p className="p-6 text-dark-500 text-center">No students yet</p>
          ) : (
            recentStudents?.slice(0, 5).map((student) => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{student.name}</p>
                    <p className="text-dark-500 text-xs">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-dark-500">{student.completedLessons} lessons</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    student.isActive ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'
                  }`}>
                    {student.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}