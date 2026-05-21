'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Link as LinkIcon, BadgeCheck,
  Grid3X3, MessageSquare, Heart, Bookmark, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type TabType = 'posts' | 'replies' | 'likes' | 'bookmarks';

export default function ViewOnlyProfilePage({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, postsCount: 0 });
  const [loading, setLoading] = useState(true);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'replies', label: 'Replies', icon: MessageSquare },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        setProfile(profileData);

        const [postsCountRes, followersRes, followingRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId)
        ]);

        setStats({
          postsCount: postsCountRes.count || 0,
          followers: followersRes.count || 0,
          following: followingRes.count || 0
        });

        const { data: postsData } = await supabase
          .from('posts')
          .select(`id, content, image, created_at, mood, location`)
          .eq('author_id', userId)
          .order('created_at', { ascending: false });

        if (postsData) {
          setPosts(postsData.map(p => ({ ...p, author: profileData })));
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  if (!profile) return <div className="p-12 text-center">User not found</div>;

  return (
    <div className="min-h-screen border-x border-border">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg px-4 py-3 flex items-center gap-4">
        <Link href="/" className="rounded-full p-2 hover:bg-secondary/50"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="font-bold text-xl">{profile.display_name}</h1>
          <p className="text-xs text-muted-foreground">{stats.postsCount} posts</p>
        </div>
      </header>

      <div className="h-48 bg-secondary">
        {profile.cover_image && <img src={profile.cover_image} className="w-full h-full object-cover" alt="Cover" />}
      </div>

      <div className="px-4 pb-4">
        <Avatar className="h-32 w-32 border-4 border-background -mt-16 mb-4">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
        </Avatar>

        <h2 className="text-2xl font-bold flex items-center gap-1">
          {profile.display_name} {profile.is_verified && <BadgeCheck className="text-primary" />}
        </h2>
        <p className="text-muted-foreground">@{profile.username}</p>
        <p className="mt-4">{profile.bio}</p>

        <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground text-sm">
          {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
          {profile.website && <span className="flex items-center gap-1"><LinkIcon className="h-4 w-4" />{profile.website}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {new Date(profile.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-6 mt-4">
          <p className="font-bold">{formatNumber(stats.following)} <span className="text-muted-foreground font-normal">Following</span></p>
          <p className="font-bold">{formatNumber(stats.followers)} <span className="text-muted-foreground font-normal">Followers</span></p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 py-4 font-semibold relative', activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground')}>
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <div>
          {activeTab === 'posts' && posts.map((p) => <PostCard key={p.id} post={p} />)}
          {activeTab !== 'posts' && <div className="p-8 text-center text-muted-foreground">View only</div>}
        </div>
      </div>
    </div>
  );
}