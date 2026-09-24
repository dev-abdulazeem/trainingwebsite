import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionApi } from '@api/client';
import {
  ClipboardCheck,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-500/10', label: 'Pending' },
  APPROVED: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-500/10', label: 'Rejected' },
  NEEDS_REVISION: { icon: AlertCircle, color: 'text-primary-500', bg: 'bg-primary-500/10', label: 'Needs Revision' },
};

import { Clock } from 'lucide-react';

export default function AdminSubmissions() {
  const [gradingId, setGradingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: () => submissionApi.getPending().then((res) => res.data),
  });

  const gradeSubmission = useMutation({
    mutationFn: ({ id, data }) => submissionApi.grade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      setGradingId(null);
      setFeedback('');
      setSelectedStatus('');
      toast.success('Submission graded!');
    },
  });

  const handleGrade = (id) => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    gradeSubmission.mutate({
      id,
      data: { status: selectedStatus, feedback: feedback || undefined },
    });
  };

  const submissions = data?.submissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Submissions</h1>
        <p className="text-dark-400">Review and grade student assignments</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No pending submissions</h3>
          <p className="text-dark-500">All assignments have been graded</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const config = statusConfig[submission.status];
            const StatusIcon = config.icon;

            return (
              <div key={submission.id} className="bg-dark-900 border border-dark-800 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {submission.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{submission.user.name}</p>
                      <p className="text-dark-500 text-sm">{submission.user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-dark-400 mb-1">
                    Assignment: <span className="text-white">{submission.assignment.title}</span>
                  </p>
                  <p className="text-sm text-dark-400">
                    Lesson: <span className="text-white">{submission.assignment.lesson.title}</span>
                  </p>
                </div>

                {submission.content && (
                  <div className="bg-dark-800/50 rounded-lg p-4 mb-4">
                    <p className="text-dark-300 text-sm">{submission.content}</p>
                  </div>
                )}

                {submission.fileUrl && (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm mb-4"
                  >
                    <FileText className="w-4 h-4" />
                    View Submission File
                  </a>
                )}

                <p className="text-dark-500 text-xs mb-4">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>

                {/* Grade Form */}
                {gradingId === submission.id ? (
                  <div className="space-y-3 pt-4 border-t border-dark-800">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Status</label>
                      <div className="flex gap-2">
                        {['APPROVED', 'REJECTED', 'NEEDS_REVISION'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedStatus === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-dark-800 text-dark-400 hover:text-white'
                            }`}
                          >
                            {statusConfig[status].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Feedback (optional)</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-600 focus:border-primary-500 transition-colors"
                        placeholder="Provide feedback to the student..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleGrade(submission.id)}
                        disabled={gradeSubmission.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
                      >
                        {gradeSubmission.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Submit Grade
                      </button>
                      <button
                        onClick={() => {
                          setGradingId(null);
                          setFeedback('');
                          setSelectedStatus('');
                        }}
                        className="px-6 py-2.5 text-dark-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setGradingId(submission.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Grade Submission
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}