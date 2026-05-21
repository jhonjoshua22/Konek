'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, BadgeCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/lib/supabase';

export default function UserProfilePage() {
  const params = useParams();
  const username = params?.username;
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, postsCount: 0 });

  useEffect(() => {
    if (!username) return;

    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', decodeURIComponent(username as string))
          .single();

        if (userError || !userData) throw new Error("User not found");
        setProfile(userData);

        if (user && user.id !== userData.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userData.id)
            .maybeSingle();
          setIsFollowed(!!followData);
        }

        const [postsCountRes, followersRes, followingRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userData.id),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userData.id)
        ]);

        setStats({
          postsCount: postsCountRes.count || 0,
          followers: followersRes.count || 0,
          following: followingRes.count || 0
        });

        const { data: postsData } = await supabase
          .from('posts')
          .select(`id, content, image, created_at, mood, location`)
          .eq('author_id', userData.id)
          .order('created_at', { ascending: false });

        if (postsData) {
          setPosts(postsData.map((p: any) => ({
            ...p,
            createdAt: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            author: userData
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUserProfile();
  }, [username]);

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profile) return;
    
    if (isFollowed) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setIsFollowed(false);
      setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowed(true);
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="p-12 text-center">User not found.</div>;

  return (
    // The Layout.tsx already provides the Sidebar and RightSidebar via its structure.
    // This div ensures the main content area centers correctly between those sidebars.
    <div className="w-full max-w-2xl border-x border-border min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-secondary/50"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="font-bold text-xl flex items-center gap-1">{profile.display_name} {profile.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</h1>
          <p className="text-xs text-muted-foreground">{stats.postsCount} posts</p>
        </div>
      </header>

      <div className="h-48 bg-secondary">
        {profile.cover_image && <img src={profile.cover_image} className="w-full h-full object-cover" alt="Cover" />}
      </div>

      <div className="px-4 pb-4 relative">
        <div className="flex justify-between items-start">
          <Avatar className="h-32 w-32 border-4 border-background -mt-16 mb-4"><AvatarImage src={profile.avatar} /><AvatarFallback>{profile.display_name[0]}</AvatarFallback></Avatar>
          <Button variant={isFollowed ? "outline" : "default"} className="mt-4 rounded-full" onClick={toggleFollow}>
            {isFollowed ? "Followed" : "Follow"}
          </Button>
        </div>

        <h2 className="text-2xl font-bold flex items-center gap-1">{profile.display_name} {profile.is_verified && <BadgeCheck className="text-primary" />}</h2>
        <p className="text-muted-foreground">@{profile.username}</p>
        <p className="mt-4">{profile.bio}</p>
        
        <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground text-sm">
          {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
          {profile.website && <span className="flex items-center gap-1"><LinkIcon className="h-4 w-4" /><a href={profile.website} className="text-primary hover:underline">{profile.website}</a></span>}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
        </div>

        <div className="flex gap-6 mt-4">
          <p className="font-bold">{formatNumber(stats.following)} <span className="text-muted-foreground font-normal">Following</span></p>
          <p className="font-bold">{formatNumber(stats.followers)} <span className="text-muted-foreground font-normal">Followers</span></p>
        </div>
      </div>

      <div className="border-t border-border">
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}