'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // Changed from 'next/navigation'
import { Search, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockTrendingTopics, formatNumber } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

export default function RightSidebar() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);
  const router = useRouter(); // Now correctly using next/router

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) setCurrentUserId(user.id);

      try {
        let query = supabase
          .from('profiles')
          .select('id, username, display_name, avatar, is_verified, follows!follows_following_id_fkey(follower_id)');

        if (user) {
          query = query.neq('id', user.id);
        }

        const { data: profilesData } = await query.limit(3);
        if (profilesData) {
          const formatted = profilesData.map(p => ({
            ...p,
            isFollowed: user ? p.follows.some((f: any) => f.follower_id === user.id) : false
          }));
          setAccounts(formatted);
        }
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      }
    }
    init();
  }, []);

  const handleFollow = async (e: React.MouseEvent, followingId: string) => {
    e.stopPropagation();
    if (!currentUserId) return;
    setLoadingFollow(followingId);

    try {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: currentUserId, following_id: followingId }]);

      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === followingId ? { ...a, isFollowed: true } : a));
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoadingFollow(null);
    }
  };

  return (
    <aside className="hidden xl:flex xl:flex-col xl:fixed xl:right-0 xl:top-0 xl:h-screen xl:w-80 xl:border-l xl:border-border xl:bg-sidebar xl:p-4 xl:overflow-y-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search" className="w-full rounded-full bg-secondary border-0 pl-10 focus-visible:ring-primary" />
      </div>

      <div className="mt-6 rounded-2xl bg-card p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Trending</h2>
        <ul className="space-y-4">
          {mockTrendingTopics.slice(0, 5).map((topic) => (
            <li key={topic.id} className="cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
              <p className="text-xs text-muted-foreground">{topic.category}</p>
              <p className="font-semibold text-foreground">{topic.name}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(topic.postsCount)} posts</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Who to follow</h2>
        <ul className="space-y-4">
          {accounts.map((user) => (
            <li 
              key={user.id} 
              className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 -mx-2 rounded-lg"
              onClick={() => router.push(`/profile/${user.username}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate flex items-center gap-1">
                  {user.display_name}
                  {user.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              </div>
              <Button 
                size="sm" 
                variant={user.isFollowed ? "outline" : "secondary"}
                className="rounded-full"
                onClick={(e) => handleFollow(e, user.id)}
                disabled={loadingFollow === user.id || user.isFollowed}
              >
                {loadingFollow === user.id ? '...' : user.isFollowed ? 'Followed' : 'Follow'}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 px-2 text-xs text-muted-foreground">
        <p>Terms of Service · Privacy Policy · Cookie Policy</p>
        <p className="mt-1">© 2026 Konek Inc.</p>
      </div>
    </aside>
  );
}