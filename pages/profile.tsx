import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  BadgeCheck,
  Grid3X3,
  MessageSquare,
  Heart,
  Bookmark,
  Loader2,
  X,
  Camera
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type TabType = 'posts' | 'replies' | 'likes' | 'bookmarks';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, postsCount: 0 });
  const [loading, setLoading] = useState(true);

  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
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
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  async function loadProfileData() {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      setFormData({
        displayName: profileData.display_name || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        avatar: profileData.avatar || '',
        coverImage: profileData.cover_image || ''
      });

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

      const { data: postsData } = await supabase
        .from('posts')
        .select(`id, content, image, created_at, likes (user_id), bookmarks (user_id)`)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData.map((p: any) => formatPostRow(p, profileData, user.id)));
      }

      const { data: likedData } = await supabase
        .from('likes')
        .select(`post:posts (id, content, image, created_at, author:profiles (id, username, display_name, avatar, is_verified, bio, cover_image, location, website, created_at), likes (user_id), bookmarks (user_id))`)
        .eq('user_id', user.id);

      if (likedData) {
        setLikedPosts(likedData.filter((item: any) => item.post !== null).map((item: any) => formatPostRow(item.post, item.post.author, user.id)));
      }

      const { data: bookmarkedData } = await supabase
        .from('bookmarks')
        .select(`post:posts (id, content, image, created_at, author:profiles (id, username, display_name, avatar, is_verified, bio, cover_image, location, website, created_at), likes (user_id), bookmarks (user_id))`)
        .eq('user_id', user.id);

      if (bookmarkedData) {
        setBookmarkedPosts(bookmarkedData.filter((item: any) => item.post !== null).map((item: any) => formatPostRow(item.post, item.post.author, user.id)));
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

  const handleFileUpload = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    }
  };

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
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          avatar: formData.avatar,
          cover_image: formData.coverImage
        })
        .eq('id', user.id);

      if (error) throw error;
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
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link href="/" className="rounded-full p-2 hover:bg-secondary/50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-1">
                {currentProfile.display_name}
                {currentProfile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </h1>
              <p className="text-sm text-muted-foreground">{formatNumber(stats.postsCount)} posts</p>
            </div>
          </div>
        </header>

        <div className="relative h-48 md:h-64 bg-secondary">
          {currentProfile.cover_image && (
            <img src={currentProfile.cover_image} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="relative px-4 pb-4">
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-background">
              <AvatarImage src={currentProfile.avatar} alt={currentProfile.display_name} />
              <AvatarFallback className="text-4xl">{currentProfile.display_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>

          <div className="absolute top-4 right-4">
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">Edit profile</Button>
          </div>

          <div className="mt-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {currentProfile.display_name}
              {currentProfile.is_verified && <BadgeCheck className="h-6 w-6 text-primary" />}
            </h2>
            <p className="text-muted-foreground">@{currentProfile.username}</p>
          </div>

          <p className="mt-4 text-foreground">{currentProfile.bio || "No bio yet."}</p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-muted-foreground">
            {currentProfile.location && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{currentProfile.location}</span>
            )}
            {currentProfile.website && (
              <span className="flex items-center gap-1"><LinkIcon className="h-4 w-4" />
                <a href={currentProfile.website.startsWith('http') ? currentProfile.website : `https://${currentProfile.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {currentProfile.website.replace(/(^\w+:|^)\/\//, '')}
                </a>
              </span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {joinedDate}</span>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <button className="hover:underline"><span className="font-bold text-foreground">{formatNumber(stats.following)}</span> <span className="text-muted-foreground">Following</span></button>
            <button className="hover:underline"><span className="font-bold text-foreground">{formatNumber(stats.followers)}</span> <span className="text-muted-foreground">Followers</span></button>
          </div>
        </div>

        <div className="border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-colors relative', activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:bg-secondary/50')}>
                <tab.icon className="h-4 w-4" /> {tab.label}
                {activeTab === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          {activeTab === 'posts' && <div>{posts.length === 0 ? <div className="p-8 text-center text-muted-foreground">No posts yet</div> : posts.map((post) => <PostCard key={post.id} post={post} />)}</div>}
          {activeTab === 'replies' && <div className="p-8 text-center"><p className="text-muted-foreground">No replies yet</p></div>}
          {activeTab === 'likes' && <div>{likedPosts.length === 0 ? <div className="p-8 text-center text-muted-foreground">No liked posts yet</div> : likedPosts.map((post) => <PostCard key={post.id} post={post} />)}</div>}
          {activeTab === 'bookmarks' && <div>{bookmarkedPosts.length === 0 ? <div className="p-8 text-center text-muted-foreground">No bookmarks yet</div> : bookmarkedPosts.map((post) => <PostCard key={post.id} post={post} />)}</div>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
              <h3 className="font-bold text-lg">Edit profile</h3>
              <Button onClick={handleSaveChanges} disabled={isSaving} className="rounded-full px-5">{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}</Button>
            </div>

            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex justify-center">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <Avatar className="h-24 w-24"><AvatarImage src={formData.avatar} /></Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><Camera className="text-white" /></div>
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleFileUpload(e.target.files[0], 'avatars');
                    if (url) setFormData(prev => ({ ...prev, avatar: url }));
                  }
                }} />
              </div>

              <div className="relative group cursor-pointer h-24 bg-secondary rounded-lg overflow-hidden" onClick={() => coverInputRef.current?.click()}>
                {formData.coverImage ? <img src={formData.coverImage} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera /></div>}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100"><Camera className="text-white" /></div>
              </div>
              <input type="file" ref={coverInputRef} className="hidden" onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await handleFileUpload(e.target.files[0], 'covers');
                  if (url) setFormData(prev => ({ ...prev, coverImage: url }));
                }
              }} />

              <input value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Name" />
              <input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Username" />
              <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Bio" />
              <input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Location" />
              <input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Website" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}