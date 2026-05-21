'use client';

import { useState } from 'react';
import { Image, Smile, MapPin, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/mock-data';

export default function CreatePost() {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      // Mock submission
      alert('Post created!');
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-border p-4">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
          <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none bg-transparent text-xl text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px]"
            rows={3}
          />
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
              >
                <Image className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
              >
                <Smile className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
              >
                <MapPin className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>
            <Button
              type="submit"
              disabled={!content.trim()}
              className="rounded-full px-6 font-semibold"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
