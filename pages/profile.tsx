import Head from 'next/head';
import { useState } from 'react';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  BadgeCheck,
  Grid3X3,
  MessageSquare,
  Heart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { currentUser, mockPosts, formatNumber } from '@/lib/mock-data';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';

type TabType = 'posts' | 'replies' | 'likes';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'replies', label: 'Replies', icon: MessageSquare },
    { id: 'likes', label: 'Likes', icon: Heart },
  ];

  // Mock user posts
  const userPosts = mockPosts.filter((_, index) => index % 2 === 0);

  return (
    <>
      <Head>
        <title>{currentUser.displayName} (@{currentUser.username}) / Konek</title>
        <meta name="description" content={currentUser.bio} />
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
                {currentUser.displayName}
                {currentUser.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatNumber(currentUser.postsCount)} posts
              </p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-secondary">
          <img
            src={currentUser.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-background">
              <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
              <AvatarFallback className="text-4xl">
                {currentUser.displayName[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-4 right-4">
            <Button variant="outline" className="rounded-full">
              Edit profile
            </Button>
          </div>

          {/* User Info */}
          <div className="mt-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {currentUser.displayName}
              {currentUser.isVerified && <BadgeCheck className="h-6 w-6 text-primary" />}
            </h2>
            <p className="text-muted-foreground">@{currentUser.username}</p>
          </div>

          {/* Bio */}
          <p className="mt-4 text-foreground">{currentUser.bio}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              San Francisco, CA
            </span>
            <span className="flex items-center gap-1">
              <LinkIcon className="h-4 w-4" />
              <a href="#" className="text-primary hover:underline">
                konek.dev/joshuaabutan
              </a>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined March 2020
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <button className="hover:underline">
              <span className="font-bold text-foreground">
                {formatNumber(currentUser.following)}
              </span>{' '}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-bold text-foreground">
                {formatNumber(currentUser.followers)}
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
              {userPosts.map((post) => (
                <PostCard key={post.id} post={{ ...post, author: currentUser }} />
              ))}
            </div>
          )}
          {activeTab === 'replies' && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </div>
          )}
          {activeTab === 'likes' && (
            <div>
              {mockPosts.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
