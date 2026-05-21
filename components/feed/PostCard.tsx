'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [shares, setShares] = useState(post.shares);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click bubbling up to parent article card container
    
    // Optimistic UI updates
    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setLikes(nextLikedState ? likes + 1 : likes - 1);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) return;

      if (nextLikedState) {
        // Insert record to likes table
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: currentUserId });
      } else {
        // Remove record from likes table
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
    e.stopPropagation(); // Stop click bubbling up to parent article card container
    
    // Optimistic UI updates
    const nextBookmarkState = !isBookmarked;
    setIsBookmarked(nextBookmarkState);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) return;

      if (nextBookmarkState) {
        // Insert record to bookmarks table
        await supabase
          .from('bookmarks')
          .insert({ post_id: post.id, user_id: currentUserId });
      } else {
        // Remove record from bookmarks table
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

  const handleCommentClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prompt placeholder mock fallback example to add comments to table row counter 
    const commentText = prompt('Enter your reply:');
    if (!commentText || !commentText.trim()) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) return;

      // Optimistic UI bump count tracking
      setComments(comments + 1);

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: commentText.trim()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding comment to Supabase:', error);
    }
  };

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) return;

      // Optimistic state bump incrementor
      setShares(shares + 1);

      const { error } = await supabase
        .from('reposts')
        .insert({
          post_id: post.id,
          user_id: currentUserId
        });

      if (error) throw error;
      alert('Post reposted successfully!');
    } catch (error) {
      console.error('Error adding repost transaction to backend:', error);
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

  return (
    <article className="border-b border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={post.author.avatar || undefined} alt={post.author.displayName} />
          <AvatarFallback>{post.author.displayName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Author Info */}
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

          {/* Content */}
          <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>

          {/* Image */}
          {post.image && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border">
              <img
                src={post.image}
                alt="Post attachment"
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between max-w-md">
            <button 
              onClick={handleCommentClick}
              className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-sm">{formatNumber(comments)}</span>
            </button>

            <button 
              onClick={handleRepostClick}
              className="group flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors"
            >
              <div className="rounded-full p-2 group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="h-5 w-5" />
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
  );
}