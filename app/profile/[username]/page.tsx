'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, BadgeCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import RightSidebar from '@/components/layout/RightSidebar';

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, postsCount: 0 });

  useEffect(() => {
    async function loadUserProfile() {
      if (!username) return;
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', decodeURIComponent(username as string))
          .single();

        if (!userData) throw new Error("User not found");
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
          .select(`id, content, image, created_at, mood, location, likes (user_id)`)
          .eq('author_id', userData.id)
          .order('created_at', { ascending: false });

        if (postsData) {
          setPosts(postsData.map((p: any) => ({ ...p, likes: p.likes?.length || 0, author: userData })));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!profile) return <div className="p-12 text-center text-muted-foreground">User not found.</div>;

  return (
    <div className="flex justify-center w-full">
      <Sidebar />
      <main className="flex-1 max-w-2xl min-h-screen border-x border-border">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-secondary/50"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-bold text-xl">{profile.display_name}</h1>
        </header>

        <div className="h-48 bg-secondary">
          {profile.cover_image && <img src={profile.cover_image} className="w-full h-full object-cover" />}
        </div>

        <div className="px-4 pb-4 relative">
          <div className="flex justify-between items-start">
            <Avatar className="h-32 w-32 border-4 border-background -mt-16 mb-4">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
            </Avatar>
            <Button variant={isFollowed ? "outline" : "default"} className="mt-4 rounded-full" onClick={toggleFollow}>
              {isFollowed ? "Followed" : "Follow"}
            </Button>
          </div>
          
          <h2 className="text-2xl font-bold flex items-center gap-1">{profile.display_name} {profile.is_verified && <BadgeCheck className="text-primary" />}</h2>
          <p className="text-muted-foreground">@{profile.username}</p>
          <p className="mt-4 text-foreground">{profile.bio}</p>
          <div className="flex gap-6 mt-4 font-bold text-sm">
            <p>{formatNumber(stats.following)} <span className="font-normal text-muted-foreground">Following</span></p>
            <p>{formatNumber(stats.followers)} <span className="font-normal text-muted-foreground">Followers</span></p>
          </div>
        </div>

        <div className="border-t border-border">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </main>
      <RightSidebar />
    </div>
  );
}