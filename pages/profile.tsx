import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  BadgeCheck,
  Grid3X3,
  MessageSquare,
  Heart,
  Loader2,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type TabType = 'posts' | 'replies' | 'likes';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, postsCount: 0 });
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    coverImage: ''
  });

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'replies', label: 'Replies', icon: MessageSquare },
    { id: 'likes', label: 'Likes', icon: Heart },
  ];

  async function loadProfileData() {
    try {
      setLoading(true);
      
      // 1. Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Fetch public profile row
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Initialize form tracking states with database defaults
      setFormData({
        displayName: profileData.display_name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        avatar: profileData.avatar || '',
        coverImage: profileData.cover_image || ''
      });

      // 3. Fetch count metrics dynamically (Followers, Following, and Posts)
      const [postsCountRes, followersRes, followingRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id)
      ]);

      setStats({
        postsCount: postsCountRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0
      });

      // 4. Fetch user's own posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id, content, image, created_at,
          likes (user_id), bookmarks (user_id)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        const formattedOwnPosts = postsData.map((p: any) => formatPostRow(p, profileData, user.id));
        setPosts(formattedOwnPosts);
      }

      // 5. Fetch posts the user liked
      const { data: likedData } = await supabase
        .from('likes')
        .select(`
          post:posts (
            id, content, image, created_at,
            author:profiles (id, username, display_name, avatar, is_verified, bio, cover_image, location, website, created_at),
            likes (user_id), bookmarks (user_id)
          )
        `)
        .eq('user_id', user.id);

      if (likedData) {
        const cleanLikedPosts = likedData
          .filter((item: any) => item.post !== null)
          .map((item: any) => formatPostRow(item.post, item.post.author, user.id));
        setLikedPosts(cleanLikedPosts);
      }

    } catch (error: any) {
      console.error('Error fetching profile dataset:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, []);

  // Structural transformation helper
  function formatPostRow(post: any, authorData: any, currentUserId: string) {
    const totalLikes = post.likes?.length || 0;
    const isLiked = post.likes?.some((l: any) => l.user_id === currentUserId) || false;
    const isBookmarked = post.bookmarks?.some((b: any) => b.user_id === currentUserId) || false;
    const timeAgo = new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: timeAgo,
      likes: totalLikes,
      comments: 0,
      shares: 0,
      isLiked,
      isBookmarked,
      author: {
        id: authorData?.id,
        username: authorData?.username,
        displayName: authorData?.display_name,
        avatar: authorData?.avatar,
        bio: authorData?.bio,
        coverImage: authorData?.cover_image,
        isVerified: authorData?.is_verified,
        followers: 0,
        following: 0,
        postsCount: 0
      }
    };
  }

  // Handle saving the modified profile fields to Supabase
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          avatar: formData.avatar,
          cover_image: formData.coverImage
        })
        .eq('id', user.id);

      if (error) throw error;

      // Close modal structure and resync data layout values locally
      setIsModalOpen(false);
      await loadProfileData();
    } catch (err: any) {
      console.error('Error updating public user records:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center border-x border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if profile is empty or unauthenticated
  const currentProfile = profile || {
    display_name: 'Konek User',
    username: 'user',
    avatar: '',
    bio: '',
    cover_image: '',
    location: '',
    website: '',
    created_at: new Date().toISOString()
  };

  const joinedDate = new Date(currentProfile.created_at).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Head>
        <title>{currentProfile.display_name} (@{currentProfile.username}) / Konek</title>
        <meta name="description" content={currentProfile.bio || "User Profile"} />
      </Head>

      <div className="min-h-screen border-x border-border">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="rounded-full p-2 hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-1">
                {currentProfile.display_name}
                {currentProfile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatNumber(stats.postsCount)} posts
              </p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-secondary">
          {currentProfile.cover_image && (
            <img
              src={currentProfile.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-background">
              <AvatarImage src={currentProfile.avatar} alt={currentProfile.display_name} />
              <AvatarFallback className="text-4xl">
                {currentProfile.display_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-4 right-4">
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
              Edit profile
            </Button>
          </div>

          {/* User Info */}
          <div className="mt-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {currentProfile.display_name}
              {currentProfile.is_verified && <BadgeCheck className="h-6 w-6 text-primary" />}
            </h2>
            <p className="text-muted-foreground">@{currentProfile.username}</p>
          </div>

          {/* Bio */}
          <p className="mt-4 text-foreground">{currentProfile.bio || "No bio yet."}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-muted-foreground">
            {currentProfile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {currentProfile.location}
              </span>
            )}
            {currentProfile.website && (
              <span className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <a 
                  href={currentProfile.website.startsWith('http') ? currentProfile.website : `https://${currentProfile.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  {currentProfile.website.replace(/(^\w+:|^)\/\//, '')}
                </a>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {joinedDate}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <button className="hover:underline">
              <span className="font-bold text-foreground">
                {formatNumber(stats.following)}
              </span>{' '}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-bold text-foreground">
                {formatNumber(stats.followers)}
              </span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-colors relative',
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No posts published yet</div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}
          {activeTab === 'replies' && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </div>
          )}
          {activeTab === 'likes' && (
            <div>
              {likedPosts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No liked posts yet</div>
              ) : (
                likedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Dialog Box overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-lg animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
                <h3 className="text-lg font-bold text-foreground">Edit profile</h3>
              </div>
              <Button 
                onClick={handleSaveChanges}
                disabled={isSaving || !formData.displayName.trim()}
                className="rounded-full font-semibold px-5"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>

            {/* Modal Form Fields scroll content */}
            <form onSubmit={handleSaveChanges} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Display Name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px] resize-none"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Location"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Website URL"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Avatar URL</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Image link address"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Cover Image URL</label>
                <input
                  type="text"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Cover banner image link address"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}