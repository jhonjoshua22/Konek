'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Post, formatNumber } from '@/lib/mock-data';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <article className="border-b border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
          <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
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
            <button className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <div className="rounded-full p-2 group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-sm">{formatNumber(post.comments)}</span>
            </button>

            <button className="group flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
              <div className="rounded-full p-2 group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="h-5 w-5" />
              </div>
              <span className="text-sm">{formatNumber(post.shares)}</span>
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
              <button className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
