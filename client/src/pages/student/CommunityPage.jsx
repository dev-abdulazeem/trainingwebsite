import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, uploadApi } from '@api/client';
import { useAuthStore } from '@store/authStore';
import {
  Image as ImageIcon,
  Send,
  Loader2,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const categories = [
  { id: 'GENERAL', label: 'General' },
  { id: 'NICHE_RESEARCH', label: 'Niche Research' },
  { id: 'EDITING', label: 'Editing' },
  { id: 'YOUTUBE', label: 'YouTube' },
  { id: 'MONETIZATION', label: 'Monetization' },
  { id: 'TECHNICAL_ISSUES', label: 'Technical' },
  { id: 'ASSIGNMENTS', label: 'Assignments' },
];

export default function CommunityPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState('GENERAL');
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['community-chat', selectedCategory],
    queryFn: () =>
      communityApi.list({ category: selectedCategory, limit: 100 }).then((res) => res.data),
    refetchInterval: 10000, // Auto-refresh every 10s for "live" feel
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.posts]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    setIsSending(true);
    try {
      let imageUrl = null;

      // 1. Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        const uploadRes = await uploadApi.file(formData);
        imageUrl = uploadRes.data.url || uploadRes.data.fileUrl;
      }

      // 2. Send message
      await communityApi.create({
        category: selectedCategory,
        body: newMessage,
        imageUrl: imageUrl,
      });

      // 3. Reset form
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // 4. Refresh chat
      queryClient.invalidateQueries({ queryKey: ['community-chat'] });
      toast.success('Message sent!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const posts = data?.posts || [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-dark-950 rounded-2xl border border-dark-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Community Chat</h1>
            <p className="text-xs text-dark-400">{posts.length} messages</p>
          </div>
        </div>
        
        {/* Category Selector */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-dark-800 border border-dark-700 text-white text-sm rounded-lg px-3 py-2 focus:border-primary-500 outline-none"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-950/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwn = post.userId === user?.id;
            return (
              <div key={post.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isOwn ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300'
                }`}>
                  {post.user.name.charAt(0).toUpperCase()}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    isOwn 
                      ? 'bg-primary-600 text-white rounded-tr-sm' 
                      : 'bg-dark-800 text-dark-200 rounded-tl-sm border border-dark-700'
                  }`}>
                    {/* Category Tag (only on non-own messages for cleanliness) */}
                    {!isOwn && (
                      <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider mb-1 block">
                        {categories.find(c => c.id === post.category)?.label}
                      </span>
                    )}
                    
                    {/* Text Content */}
                    {post.body && (
                      <p className="text-sm whitespace-pre-wrap break-words">{post.body}</p>
                    )}

                    {/* Image Content */}
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Attachment" 
                        className="mt-2 rounded-lg max-w-full h-auto border border-white/10"
                      />
                    )}
                  </div>
                  
                  {/* Meta */}
                  <span className="text-[10px] text-dark-500 mt-1 px-1">
                    {post.user.name} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-dark-900 border-t border-dark-800 shrink-0">
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block mb-3">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-dark-700" />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-xl transition-colors shrink-0"
            title="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none max-h-32 transition-all"
            style={{ minHeight: '48px' }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !selectedImage)}
            className="p-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-xl transition-all shrink-0"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}