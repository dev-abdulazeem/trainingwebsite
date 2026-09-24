import { useQuery } from '@tanstack/react-query';
import { submissionApi } from '@api/client';
import { ClipboardCheck, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-500/10', label: 'Pending Review' },
  APPROVED: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-500/10', label: 'Rejected' },
  NEEDS_REVISION: { icon: AlertCircle, color: 'text-primary-500', bg: 'bg-primary-500/10', label: 'Needs Revision' },
};

export default function AssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => submissionApi.getMy().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const submissions = data?.submissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Assignments</h1>
        <p className="text-dark-400">Track your assignment submissions and feedback</p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No submissions yet</h3>
          <p className="text-dark-500">Complete lessons and submit assignments to see them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const config = statusConfig[submission.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={submission.id}
                className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-dark-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {submission.assignment.title}
                    </h3>
                    <p className="text-dark-500 text-sm mb-3">
                      Lesson: {submission.assignment.lesson.title}
                    </p>

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
                        View Attached File
                      </a>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-dark-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      {submission.gradedAt && (
                        <span className="text-dark-500">
                          Graded: {new Date(submission.gradedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  </div>
                </div>

                {submission.feedback && (
                  <div className="mt-4 p-4 bg-dark-800/30 rounded-lg border-l-2 border-primary-500">
                    <p className="text-sm text-dark-400 mb-1">Instructor Feedback:</p>
                    <p className="text-sm text-white">{submission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}