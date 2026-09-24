import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@api/client';
import {
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Eye,
  X,
  User,
  Calendar,
} from 'lucide-react';
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

export default function AdminCommunity() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewingPost, setViewingPost] = useState(null);
  const queryClient = useQueryClient();

  // Fetch posts with search and category filter
  const { data, isLoading } = useQuery({
    queryKey: ['admin-community', search, selectedCategory],
    queryFn: () =>
      communityApi
        .list({ 
          search: search || undefined, 
          category: selectedCategory || undefined, 
          limit: 100 
        })
        .then((res) => res.data),
  });

  // Mutations
  const deletePost = useMutation({
    mutationFn: (id) => communityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast.success('Post deleted successfully');
      setViewingPost(null); // Close modal if open
    },
    onError: () => toast.error('Failed to delete post'),
  });

  const resolvePost = useMutation({
    mutationFn: (id) => communityApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast.success('Post status updated');
      if (viewingPost) {
        // Update modal data optimistically
        setViewingPost(prev => ({ ...prev, isResolved: !prev.isResolved }));
      }
    },
  });

  const pinPost = useMutation({
    mutationFn: (id) => communityApi.pin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast.success('Post pinned status updated');
      if (viewingPost) {
        setViewingPost(prev => ({ ...prev, isPinned: !prev.isPinned }));
      }
    },
  });

  const posts = data?.posts || [];

  // Calculate stats
  const stats = {
    total: posts.length,
    resolved: posts.filter(p => p.isResolved).length,
    pinned: posts.filter(p => p.isPinned).length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Community Moderation</h1>
        <p className="text-dark-400 mb-6">Manage posts, resolve issues, and keep the community safe.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-dark-400">Total Posts</p>
            </div>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-success-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.resolved}</p>
              <p className="text-sm text-dark-400">Resolved</p>
            </div>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-warning-500/10 rounded-lg flex items-center justify-center">
              <Pin className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pinned}</p>
              <p className="text-sm text-dark-400">Pinned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search posts or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-dark-600 focus:border-primary-500 transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-dark-900 border border-dark-800 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 transition-colors"
        >
          <option value="">All Categories</option>
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Posts List */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-dark-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No posts found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-dark-800/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Post Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-dark-800 text-dark-300">
                      {categories[post.category] || post.category}
                    </span>
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-xs text-warning-500">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    {post.isResolved && (
                      <span className="flex items-center gap-1 text-xs text-success-500">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-medium truncate">{post.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-dark-500 mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.user.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.replyCount} replies</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingPost(post)}
                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    title="View Details & Replies"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => pinPost.mutate(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.isPinned 
                        ? 'text-warning-500 hover:bg-warning-500/10' 
                        : 'text-dark-400 hover:text-warning-500 hover:bg-dark-800'
                    }`}
                    title={post.isPinned ? 'Unpin Post' : 'Pin Post'}
                  >
                    {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => resolvePost.mutate(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.isResolved 
                        ? 'text-success-500 hover:bg-success-500/10' 
                        : 'text-dark-400 hover:text-success-500 hover:bg-dark-800'
                    }`}
                    title={post.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                  >
                    {post.isResolved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this post? This cannot be undone.')) {
                        deletePost.mutate(post.id);
                      }
                    }}
                    className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Post Modal */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">Post Details</h2>
              <button 
                onClick={() => setViewingPost(null)}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Post Meta */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary-600/10 text-primary-400">
                    {categories[viewingPost.category]}
                  </span>
                  <span className="text-xs text-dark-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(viewingPost.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{viewingPost.title}</h3>
                <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{viewingPost.body}</p>
                {viewingPost.imageUrl && (
                  <img src={viewingPost.imageUrl} alt="Post attachment" className="mt-4 rounded-lg max-w-full h-auto border border-dark-700" />
                )}
              </div>

              {/* Replies Section */}
              <div className="border-t border-dark-800 pt-6">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-400" />
                  Replies ({viewingPost.replyCount})
                </h4>

                {/* Note: To show actual replies, you'd need to fetch them.
                    For now, we show a placeholder or you can add a useQuery here to fetch `/api/community/${viewingPost.id}` */}
                <div className="text-center py-8 text-dark-500 text-sm bg-dark-950/50 rounded-xl border border-dark-800 border-dashed">
                  <p>Reply details can be fetched by expanding the API to include replies in the list, or by making a secondary fetch here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}