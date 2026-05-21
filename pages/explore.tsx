'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, BadgeCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { PostModal } from '@/components/post-modal';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedAccounts, setSuggestedAccounts] = useState<any[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    async function loadExploreData() {
      try {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        setCurrentUserId(userId || null);

        // 1. Fetch dynamic real trending topics
        const { data: topicsData } = await supabase
          .from('trending_topics')
          .select('*')
          .order('posts_count', { ascending: false })
          .limit(10);

        if (topicsData) setTrendingTopics(topicsData);

        // 2. Fetch suggested profiles with follow status
        let profilesQuery = supabase
          .from('profiles')
          .select(`
            id,
            username,
            display_name,
            avatar,
            is_verified,
            follows:follows!follows_following_id_fkey(follower_id)
          `)
          .limit(8);

        if (userId) {
          profilesQuery = profilesQuery.not('id', 'eq', userId);
        }

        const { data: accountsData } = await profilesQuery;

        if (accountsData) {
          const formattedAccounts = accountsData.map((acc: any) => ({
            id: acc.id,
            username: acc.username,
            displayName: acc.display_name,
            avatar: acc.avatar,
            isVerified: acc.is_verified,
            isFollowed: userId ? acc.follows.some((f: any) => f.follower_id === userId) : false,
          }));
          setSuggestedAccounts(formattedAccounts);
        }

        // 3. Fetch posts for discovery (including mood and location)
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image,
            created_at,
            mood,
            location,
            author:profiles(id, display_name, avatar, is_verified, username)
          `)
          .not('image', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (postsData) setDiscoverPosts(postsData);

      } catch (error: any) {
        console.error('Error rendering explore live datasets:', error.message);
      } finally {
        setLoading(false);
      }
    }

    loadExploreData();
  }, []);

  const handleFollow = async (followingId: string) => {
    if (!currentUserId) return;
    setLoadingFollow(followingId);
    try {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: currentUserId, following_id: followingId }]);
      
      if (error) throw error;
      
      // Update UI to show "followed" state
      setSuggestedAccounts((prev) => 
        prev.map(acc => acc.id === followingId ? { ...acc, isFollowed: true } : acc)
      );
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoadingFollow(null);
    }
  };

  return (
    <>
      <Head>
        <title>Explore / Konek</title>
        <meta name="description" content="Explore trending topics and discover new content." />
      </Head>

      <div className="min-h-screen border-x border-border">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, people, and topics"
              className="w-full rounded-full bg-secondary border-0 pl-12 py-6 text-base focus-visible:ring-primary"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="border-b border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Trending Now</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {trendingTopics.map((topic) => (
                  <div key={topic.id} className="flex-shrink-0 rounded-xl bg-card p-4 min-w-[160px] border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{topic.category}</p>
                    <p className="font-semibold text-foreground">{topic.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatNumber(topic.posts_count)} posts</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-border p-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Suggested for you</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {suggestedAccounts.map((user) => (
                  <div key={user.id} className="flex-shrink-0 rounded-xl bg-card p-4 min-w-[180px] text-center border border-border">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-foreground truncate flex items-center justify-center gap-1">
                      {user.displayName}
                      {user.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    <Button 
                      size="sm" 
                      variant={user.isFollowed ? "outline" : "default"}
                      className="rounded-full mt-3 w-full" 
                      onClick={() => handleFollow(user.id)}
                      disabled={loadingFollow === user.id || user.isFollowed}
                    >
                      {loadingFollow === user.id ? '...' : user.isFollowed ? 'Followed' : 'Follow'}
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Discover</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {discoverPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className={`relative overflow-hidden rounded-xl cursor-pointer group ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <img
                      src={post.image}
                      alt="Trending post"
                      className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.display_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium text-sm">{post.author.display_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        
        {selectedPost && (
          <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
      </div>
    </>
  );
}