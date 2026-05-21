'use client';

import { useState, useRef } from 'react';
import { Image, Smile, MapPin, Loader2, X, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface CreatePostProps {
  onPostCreated?: () => void;
  userAvatar?: string;
}

const MOODS = ['Happy', 'Excited', 'Sad', 'Cool', 'Thinking', 'Loved'];
const LOCATIONS = ['New York', 'London', 'Tokyo', 'Manila', 'General Trias'];

export default function CreatePost({ onPostCreated, userAvatar }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !selectedFile) || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        alert('You must be logged in to create a post.');
        return;
      }

      let imageUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${currentUserId}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          author_id: currentUserId,
          image: imageUrl,
          mood: mood,
          location: location
        });

      if (error) throw error;

      setContent('');
      setSelectedFile(null);
      setMood('');
      setLocation('');
      
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
          
          {(mood || location) && (
            <div className="flex gap-2 mb-2">
              {mood && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Mood: {mood}</span>}
              {location && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Loc: {location}</span>}
            </div>
          )}

          {showMoodPicker && (
            <div className="flex flex-wrap gap-2 mb-4 bg-secondary p-2 rounded-lg">
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => { setMood(m); setShowMoodPicker(false); }} className="text-sm px-2 py-1 hover:bg-background rounded">{m}</button>
              ))}
            </div>
          )}

          {showLocationSearch && (
            <div className="mb-4 bg-secondary p-2 rounded-lg flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input autoFocus placeholder="Search location..." className="bg-transparent w-full text-sm outline-none" onChange={(e) => setLocation(e.target.value)} />
              <X className="h-4 w-4 cursor-pointer" onClick={() => setShowLocationSearch(false)} />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors" disabled={isSubmitting}><Image className="h-5 w-5" /></button>
              <button type="button" onClick={() => setShowMoodPicker(!showMoodPicker)} className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors" disabled={isSubmitting}><Smile className="h-5 w-5" /></button>
              <button type="button" onClick={() => setShowLocationSearch(!showLocationSearch)} className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors" disabled={isSubmitting}><MapPin className="h-5 w-5" /></button>
            </div>
            <Button type="submit" disabled={(!content.trim() && !selectedFile) || isSubmitting} className="rounded-full px-6 font-semibold flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}