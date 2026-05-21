'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Search, MessageCircle, User, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/mock-data';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-border lg:bg-sidebar lg:p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Feather className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Chirp</span>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 rounded-xl px-4 py-3 text-lg font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-6 w-6', isActive && 'text-primary')} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Post Button */}
      <Button className="mt-4 w-full rounded-full py-6 text-lg font-semibold">
        Post
      </Button>

      {/* User Profile */}
      <div className="mt-4 flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 cursor-pointer transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
          <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{currentUser.displayName}</p>
          <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
        </div>
      </div>
    </aside>
  );
}
