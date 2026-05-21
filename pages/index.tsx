import Head from 'next/head';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedPosts() {
      try {
        setLoading(true);

        // Get current authenticated user session to check dynamic like/bookmark states
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        // Fetch posts joined with author profiles, likes list, and bookmarks list
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image,
            created_at,
            author:profiles (
              id,
              username,
              display_name,
              avatar,
              bio,
              cover_image,
              is_verified
            ),
            likes (user_id),
            bookmarks (user_id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Format rows into the standard Post object structure expected by PostCard
          const formattedPosts = data.map((post: any) => {
            const totalLikes = post.likes?.length || 0;
            const isLiked = currentUserId 
              ? post.likes?.some((like: any) => like.user_id === currentUserId) 
              : false;
            const isBookmarked = currentUserId 
              ? post.bookmarks?.some((bookmark: any) => bookmark.user_id === currentUserId) 
              : false;

            // Simple relative time string generation or fallback to locale date
            const postDate = new Date(post.created_at);
            const timeAgo = postDate.toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric' 
            });

            return {
              id: post.id,
              content: post.content,
              image: post.image,
              createdAt: timeAgo,
              likes: totalLikes,
              comments: 0, // Hook up via a comments/replies table later
              shares: 0,
              isLiked: isLiked,
              isBookmarked: isBookmarked,
              author: {
                id: post.author?.id,
                username: post.author?.username,
                displayName: post.author?.display_name,
                avatar: post.author?.avatar,
                bio: post.author?.bio,
                coverImage: post.author?.cover_image,
                isVerified: post.author?.is_verified,
                followers: 0,
                following: 0,
                postsCount: 0
              }
            };
          });

          setPosts(formattedPosts);
        }
      } catch (error: any) {
        console.error('Error loading feed posts:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedPosts();
  }, []);

  return (
    <>
      <Head>
        <title>Home / Konek</title>
        <meta name="description" content="See what's happening in your world right now." />
      </Head>

      <div className="min-h-screen border-x border-border">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">Home</h1>
          </div>
          <div className="flex border-b border-border">
            <button className="flex-1 py-4 text-center font-semibold text-foreground hover:bg-secondary/50 transition-colors relative">
              For you
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-primary" />
            </button>
            <button className="flex-1 py-4 text-center font-semibold text-muted-foreground hover:bg-secondary/50 transition-colors">
              Following
            </button>
          </div>
        </header>

        {/* Create Post */}
        <CreatePost />

        {/* Feed */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No posts found. Start sharing thoughts on Konek!
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </>
  );
}