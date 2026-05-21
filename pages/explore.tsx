import Head from 'next/head';
import { useState } from 'react';
import { Search, TrendingUp, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockPosts, mockTrendingTopics, suggestedAccounts, formatNumber } from '@/lib/mock-data';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const trendingPosts = mockPosts.filter((post) => post.image);

  return (
    <>
      <Head>
        <title>Explore / Konek</title>
        <meta name="description" content="Explore trending topics and discover new content." />
      </Head>

      <div className="min-h-screen border-x border-border">
        {/* Header with Search */}
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

        {/* Trending Topics - Horizontal Scroll */}
        <section className="border-b border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {mockTrendingTopics.map((topic) => (
              <div
                key={topic.id}
                className="flex-shrink-0 rounded-xl bg-card p-4 min-w-[160px] hover:bg-secondary/50 cursor-pointer transition-colors border border-border"
              >
                <p className="text-xs text-muted-foreground mb-1">{topic.category}</p>
                <p className="font-semibold text-foreground">{topic.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(topic.postsCount)} posts
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Accounts - Horizontal Scroll */}
        <section className="border-b border-border p-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Suggested for you</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedAccounts.map((user) => (
              <div
                key={user.id}
                className="flex-shrink-0 rounded-xl bg-card p-4 min-w-[180px] text-center hover:bg-secondary/50 cursor-pointer transition-colors border border-border"
              >
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-foreground truncate flex items-center justify-center gap-1">
                  {user.displayName}
                  {user.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(user.followers)} followers
                </p>
                <Button size="sm" className="rounded-full mt-3 w-full">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Posts Grid */}
        <section className="p-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Discover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {trendingPosts.map((post, index) => (
              <div
                key={post.id}
                className={`relative overflow-hidden rounded-xl cursor-pointer group ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
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
                        <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
                        <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">{post.author.displayName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Additional placeholder images for the grid */}
            {[
              'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
            ].map((img, index) => (
              <div
                key={`extra-${index}`}
                className="relative overflow-hidden rounded-xl cursor-pointer group"
              >
                <img
                  src={img}
                  alt="Trending content"
                  className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
