'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockTrendingTopics, suggestedAccounts, formatNumber } from '@/lib/mock-data';
import { BadgeCheck } from 'lucide-react';

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex xl:flex-col xl:fixed xl:right-0 xl:top-0 xl:h-screen xl:w-80 xl:border-l xl:border-border xl:bg-sidebar xl:p-4 xl:overflow-y-auto">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search"
          className="w-full rounded-full bg-secondary border-0 pl-10 focus-visible:ring-primary"
        />
      </div>

      {/* Trending Topics */}
      <div className="mt-6 rounded-2xl bg-card p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Trending</h2>
        <ul className="space-y-4">
          {mockTrendingTopics.slice(0, 5).map((topic) => (
            <li
              key={topic.id}
              className="cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <p className="text-xs text-muted-foreground">{topic.category}</p>
              <p className="font-semibold text-foreground">{topic.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(topic.postsCount)} posts
              </p>
            </li>
          ))}
        </ul>
        <button className="mt-4 text-primary text-sm font-medium hover:underline">
          Show more
        </button>
      </div>

      {/* Suggested Accounts */}
      <div className="mt-4 rounded-2xl bg-card p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Who to follow</h2>
        <ul className="space-y-4">
          {suggestedAccounts.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback>{user.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate flex items-center gap-1">
                  {user.displayName}
                  {user.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  )}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
              <Button size="sm" variant="secondary" className="rounded-full">
                Follow
              </Button>
            </li>
          ))}
        </ul>
        <button className="mt-4 text-primary text-sm font-medium hover:underline">
          Show more
        </button>
      </div>

      {/* Footer */}
      <div className="mt-4 px-2 text-xs text-muted-foreground">
        <p>Terms of Service · Privacy Policy · Cookie Policy</p>
        <p className="mt-1">© 2024 Chirp Inc.</p>
      </div>
    </aside>
  );
}
