'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, CornerDownRight, BadgeCheck, Send, Smile, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function PostModal({ post, onClose }: { post: any; onClose: () => void }) {
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUserSession() {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data?.session?.user?.id || null);
    }
    getUserSession();
    fetchCommentsList();
  }, [post.id]);

  const fetchCommentsList = async () => {
    setIsLoadingComments(true);
    const { data: commentsData } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, profiles(id, username, display_name, avatar, is_verified)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    setCommentsList(commentsData || []);
    setIsLoadingComments(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUserId) return;
    setIsSubmittingComment(true);
    await supabase.from('comments').insert({ post_id: post.id, user_id: currentUserId, content: newCommentText.trim() });
    setNewCommentText('');
    await fetchCommentsList();
    setIsSubmittingComment(false);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    onClose();
    window.location.reload(); // Refresh to remove from feed
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-xl h-screen overflow-hidden border-x border-border bg-background shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-150" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-bold text-foreground">Post Thread</h3>
          <div className="flex items-center gap-1">
            {currentUserId === post.author.id && (
              <button onClick={handleDeletePost} className="rounded-full p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors mr-1">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary transition-colors">
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Detailed Post View */}
          <div className="flex gap-3 pb-4 border-b border-border">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={post.author.avatar || undefined} />
              <AvatarFallback>{post.author.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{post.author.displayName}</span>
                {post.author.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                <span className="text-xs text-muted-foreground">@{post.author.username}</span>
              </div>
              
              {(post.mood || post.location) && (
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {post.mood && <span className="flex items-center gap-1"><Smile className="h-3 w-3" /> {post.mood}</span>}
                  {post.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {post.location}</span>}
                </div>
              )}

              <p className="text-sm mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>
              
              {post.image && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  <img src={post.image} alt="Post attachment" className="w-full h-auto max-h-[400px] object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Replies ({commentsList.length})</div>
          {commentsList.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 items-start text-sm">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.profiles?.avatar || undefined} />
                <AvatarFallback>{comment.profiles?.display_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="bg-secondary/40 rounded-2xl px-3 py-2 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs">{comment.profiles?.display_name}</span>
                  {comment.profiles?.is_verified && <BadgeCheck className="h-3 w-3 text-primary" />}
                  <span className="text-[11px] text-muted-foreground">@{comment.profiles?.username}</span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="p-3 border-t border-border bg-background flex gap-2 items-center">
          <input 
            className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Post your reply..."
            disabled={isSubmittingComment}
          />
          <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0" disabled={isSubmittingComment || !newCommentText.trim()}>
            {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}