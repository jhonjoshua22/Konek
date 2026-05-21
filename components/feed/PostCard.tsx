'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, BadgeCheck, X, Send, Loader2, Trash2, CornerDownRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

// Explicitly type the expected Post structure coming from your Supabase query
interface Post {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    bio: string | null;
    coverImage: string | null;
    isVerified: boolean;
  };
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likes, setLikes] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [shares, setShares] = useState(post.shares);
  const [isReposted, setIsReposted] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Modal and Comments Tracking States
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Get active session user info
  useEffect(() => {
    async function getUserSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUserId(data.session.user.id);
      }
    }
    getUserSession();
  }, []);

  // Fetch real-time counts from DB when initialized or when currentUserId changes
  useEffect(() => {
    async function fetchEngagements() {
      try {
        const [commentsRes, repostsRes] = await Promise.all([
          supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('reposts').select('id', { count: 'exact', head: true }).eq('post_id', post.id)
        ]);

        if (commentsRes.count !== null) setCommentsCount(commentsRes.count);
        if (repostsRes.count !== null) setShares(repostsRes.count);

        if (currentUserId) {
          const { count } = await supabase
            .from('reposts')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('user_id', currentUserId);
          
          setIsReposted(!!count);
        }
      } catch (err) {
        console.error('Error fetching counter engagements:', err);
      }
    }
    fetchEngagements();
  }, [post.id, currentUserId]);

  // FIXED: Re-run comments processing when the modal opens
  useEffect(() => {
    if (isCommentsModalOpen) {
      fetchCommentsList();
    }
  }, [isCommentsModalOpen]);

  // Fetch Full Thread Comments
  // Fetch Full Thread Comments
  // Fetch Full Thread Comments
  // Fetch Full Thread Comments
  const fetchCommentsList = async () => {
    try {
      setIsLoadingComments(true);
      
      // 1. Fetch comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setCommentsList([]);
        setIsLoadingComments(false);
        return;
      }

      // 2. Fetch profiles and likes separately to avoid join issues
      const commentIds = commentsData.map(c => c.id);
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      const [profilesRes, likesRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar, is_verified').in('id', userIds),
        supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds)
      ]);

      const profilesMap = (profilesRes.data || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
      
      // Group likes by comment_id
      const likesMap = (likesRes.data || []).reduce((acc: any, like: any) => {
        if (!acc[like.comment_id]) acc[like.comment_id] = [];
        acc[like.comment_id].push(like.user_id);
        return acc;
      }, {});

      // 3. Merge data
      const processedComments = commentsData.map((comment: any) => {
        const commentLikes = likesMap[comment.id] || [];
        return {
          ...comment,
          profiles: profilesMap[comment.user_id] || { display_name: 'User', username: 'user' },
          likesCount: commentLikes.length,
          isLiked: currentUserId ? commentLikes.includes(currentUserId) : false
        };
      });

      setCommentsList(processedComments);
    } catch (err) {
      console.error('Error getting post replies:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCardClick = () => {
    setIsCommentsModalOpen(true);
  };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      setIsDeleted(true);
      setIsCommentsModalOpen(false);
    } catch (err) {
      console.error('Error deleting post transaction:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setCommentsCount((prev) => Math.max(0, prev - 1));
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Error removing comment execution:', err);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!currentUserId) return;

    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !currentlyLiked,
            likesCount: currentlyLiked ? c.likesCount - 1 : c.likesCount + 1
          };
        }
        return c;
      })
    );

    try {
      if (!currentlyLiked) {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUserId });
      } else {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      }
    } catch (err) {
      console.error('Error syncing comment like transaction:', err);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setLikes(nextLikedState ? likes + 1 : likes - 1);

    try {
      if (!currentUserId) return;

      if (nextLikedState) {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: currentUserId });
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
      }
    } catch (error) {
      console.error('Error synchronizing database like state:', error);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    const nextBookmarkState = !isBookmarked;
    setIsBookmarked(nextBookmarkState);

    try {
      if (!currentUserId) return;

      if (nextBookmarkState) {
        await supabase
          .from('bookmarks')
          .insert({ post_id: post.id, user_id: currentUserId });
      } else {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
      }
    } catch (error) {
      console.error('Error synchronizing database bookmark state:', error);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCommentsModalOpen(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      if (!currentUserId) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newCommentText.trim()
        });

      if (error) throw error;
      
      setNewCommentText('');
      setCommentsCount((prev) => prev + 1);
      await fetchCommentsList();
    } catch (error) {
      console.error('Error adding comment to Supabase:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    const nextRepostState = !isReposted;
    setIsReposted(nextRepostState);
    setShares(nextRepostState ? shares + 1 : Math.max(0, shares - 1));

    try {
      if (nextRepostState) {
        const { error } = await supabase
          .from('reposts')
          .insert({
            post_id: post.id,
            user_id: currentUserId
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error adding/removing repost transaction backend:', error);
      setIsReposted(!nextRepostState);
      setShares(shares);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.displayName}`,
          text: post.content,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error utilizing Web Share API structure window:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Post link copied to clipboard!');
      } catch (err) {
        console.error('Failed copying link context:', err);
      }
    }
  };

  if (isDeleted) return null;

  return (
    <>
      <article 
        onClick={handleCardClick}
        className="border-b border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={post.author.avatar || undefined} alt={post.author.displayName} />
            <AvatarFallback>{post.author.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-foreground hover:underline">
                  {post.author.displayName}
                </span>
                {post.author.isVerified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
                <span className="text-muted-foreground">@{post.author.username}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground hover:underline">{post.createdAt}</span>
              </div>
              
              {currentUserId === post.author.id && (
                <button
                  onClick={handleDeletePost}
                  className="text-muted-foreground hover:text-red-500 rounded-full p-1.5 hover:bg-red-500/10 transition-colors"
                  title="Delete Post"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>

            {post.image && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                <img
                  src={post.image}
                  alt="Post attachment"
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between max-w-md">
              <button 
                onClick={handleCommentClick}
                className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-sm">{formatNumber(commentsCount)}</span>
              </button>

              <button 
                onClick={handleRepostClick}
                className={cn(
                  'group flex items-center gap-2 transition-colors',
                  isReposted ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'
                )}
              >
                <div className="rounded-full p-2 group-hover:bg-green-500/10 transition-colors">
                  <Repeat2 className={cn('h-5 w-5', isReposted && 'stroke-[2.5px]')} />
                </div>
                <span className="text-sm">{formatNumber(shares)}</span>
              </button>

              <button
                onClick={handleLike}
                className={cn(
                  'group flex items-center gap-2 transition-colors',
                  isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                )}
              >
                <div className="rounded-full p-2 group-hover:bg-red-500/10 transition-colors">
                  <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
                </div>
                <span className="text-sm">{formatNumber(likes)}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleBookmark}
                  className={cn(
                    'rounded-full p-2 transition-colors',
                    isBookmarked
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  )}
                >
                  <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
                </button>
                <button 
                  onClick={handleShareClick} 
                  className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Share className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {isCommentsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsCommentsModalOpen(false)}
        >
          <div 
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-lg font-bold text-foreground">Post Thread</h3>
              <div className="flex items-center gap-1">
                {currentUserId === post.author.id && (
                  <button
                    onClick={handleDeletePost}
                    className="rounded-full p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors mr-1"
                    title="Delete Post"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsCommentsModalOpen(false)}
                  className="rounded-full p-1.5 hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-3 pb-4 border-b border-border">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={post.author.avatar || undefined} />
                  <AvatarFallback>{post.author.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{post.author.displayName}</span>
                    <span className="text-xs text-muted-foreground">@{post.author.username}</span>
                  </div>
                  <p className="text-sm mt-1 text-foreground whitespace-pre-wrap">{post.content}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                Replies ({commentsCount})
              </div>

              {isLoadingComments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : commentsList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No replies on this thread yet. Be the first!
                </div>
              ) : (
                <div className="space-y-4">
                  {commentsList.map((comment) => {
                    const commentAuthor = comment.profiles || {};
                    const canDeleteComment = currentUserId === comment.user_id || currentUserId === post.author.id;

                    return (
                      <div key={comment.id} className="flex gap-3 items-start text-sm group/item">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={commentAuthor.avatar || undefined} />
                          <AvatarFallback>{commentAuthor.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-secondary/40 rounded-2xl px-3 py-2">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-xs text-foreground truncate">
                                  {commentAuthor.display_name || 'User'}
                                </span>
                                {commentAuthor.is_verified && (
                                  <BadgeCheck className="h-3 w-3 text-primary shrink-0" />
                                )}
                                <span className="text-[11px] text-muted-foreground truncate">
                                  @{commentAuthor.username || 'user'}
                                </span>
                              </div>

                              {canDeleteComment && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-muted-foreground">
                            <button
                              onClick={() => handleLikeComment(comment.id, comment.isLiked)}
                              className={cn(
                                "flex items-center gap-1 hover:text-red-500 transition-colors",
                                comment.isLiked && "text-red-500 font-medium"
                              )}
                            >
                              <Heart className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")} />
                              <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                            </button>

                            <button
                              onClick={() => setNewCommentText(`Reply @${commentAuthor.username} `)}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <CornerDownRight className="h-3.5 w-3.5" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="p-3 border-t border-border bg-background flex gap-2 items-center">
              <input
                type="text"
                placeholder="Post your reply..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full h-9 w-9 shrink-0"
                disabled={isSubmittingComment || !newCommentText.trim()}
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}