'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, CornerDownRight, BadgeCheck, Send, Smile, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function PostModal({ post, onClose }: { post: any; onClose: () => void }) {
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.getSession();
    setCurrentUserId(data?.session?.user?.id || null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl h-screen overflow-hidden border-x border-border bg-background shadow-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-lg font-bold">Post Thread</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Post Content Summary */}
          <div className="flex gap-3 pb-4 border-b border-border">
            <Avatar><AvatarImage src={post.author?.avatar} /><AvatarFallback>{post.author?.display_name?.[0]}</AvatarFallback></Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author?.display_name}</p>
              <p className="text-sm">{post.content}</p>
            </div>
          </div>

          {/* Comments List */}
          {commentsList.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={comment.profiles?.avatar} /></Avatar>
              <div className="bg-secondary/40 rounded-2xl px-3 py-2">
                <p className="font-semibold text-xs">{comment.profiles?.display_name}</p>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="p-3 border-t border-border flex gap-2">
          <input 
            className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Reply..."
          />
          <Button type="submit" size="icon" className="rounded-full"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}