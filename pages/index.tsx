import Head from 'next/head';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import { mockPosts } from '@/lib/mock-data';

export default function HomePage() {
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
          {mockPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </>
  );
}
