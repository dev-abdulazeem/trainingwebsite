import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@api/client';
import { useAuthStore } from '@store/authStore';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  Pin,
  User,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const categories = {
  GENERAL: 'General',
  NICHE_RESEARCH: 'Niche Research',
  EDITING: 'Editing',
  YOUTUBE: 'YouTube',
  MONETIZATION: 'Monetization',
  TECHNICAL_ISSUES: 'Technical',
  ASSIGNMENTS: 'Assignments',
};

export default function CommunityPost() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['community-post', id],
    queryFn: () => communityApi.get(id).then((res) => res.data),
  });

  const replyMutation = useMutation({
    mutationFn: (body) => communityApi.reply(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-post', id] });
      setReplyBody('');
      toast.success('Reply posted!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyMutation.mutate(replyBody);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const post = data?.post;

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
        <Link to="/community" className="text-primary-400 hover:text-primary-300">
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/community"
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Post */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-1 bg-dark-800 rounded-full text-dark-400">
            {categories[post.category] || post.category}
          </span>
          {post.isPinned && (
            <span className="flex items-center gap-1 text-xs text-primary-400">
              <Pin className="w-3 h-3" />
              Pinned
            </span>
          )}
          {post.isResolved && (
            <span className="flex items-center gap-1 text-xs text-success-500">
              <CheckCircle className="w-3 h-3" />
              Resolved
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {post.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{post.user.name}</p>
            <p className="text-dark-500 text-sm">
              {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {post.replies?.length || 0} Replies
        </h2>

        {post.replies?.map((reply) => (
          <div key={reply.id} className="bg-dark-900 border border-dark-800 rounded-xl p-6 ml-0 sm:ml-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {reply.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{reply.user.name}</p>
                <p className="text-dark-500 text-xs">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Post a Reply</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-600 focus:border-primary-500 transition-colors"
            placeholder="Write your reply..."
            required
          />
          <button
            type="submit"
            disabled={replyMutation.isPending || !replyBody.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post Reply
          </button>
        </form>
      </div>
    </div>
  );
}