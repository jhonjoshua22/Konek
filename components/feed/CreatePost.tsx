'use client';

import { useState } from 'react';
import { Image, Smile, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface CreatePostProps {
  onPostCreated?: () => void;
  userAvatar?: string;
}

export default function CreatePost({ onPostCreated, userAvatar }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Get current authenticated user session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        alert('You must be logged in to create a post.');
        return;
      }

      // Insert new post entry into the database
      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          author_id: currentUserId,
        });

      if (error) throw error;

      setContent('');
      
      // Trigger feed refresh callback
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error('Error creating post:', error.message);
      alert('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-border p-4">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={userAvatar} alt="My Avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none bg-transparent text-xl text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px]"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
                disabled={isSubmitting}
              >
                <Image className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
                disabled={isSubmitting}
              >
                <Smile className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
                disabled={isSubmitting}
              >
                <MapPin className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
                disabled={isSubmitting}
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="rounded-full px-6 font-semibold flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}