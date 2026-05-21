'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Search, MessageCircle, User, Feather, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect the user back to the login view after cleanup
      router.push('/login');
    } catch (error: any) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-border lg:bg-sidebar lg:p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Feather className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Konek</span>
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
              </td>
            );
          })}
        </ul>
      </nav>

      {/* Post Button */}
      <Button className="mt-4 w-full rounded-full py-6 text-lg font-semibold">
        Post
      </Button>

      {/* User Profile Footer section */}
      <div className="mt-4 flex flex-col gap-2 rounded-xl p-3 border border-border/40 bg-card/10">
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
            <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{currentUser.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
          </div>
        </div>
        
        {/* Sign Out Action Button */}
        <button
          onClick={handleSignOut}
          className="mt-1 flex items-center justify-center gap-2 w-full rounded-lg py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors border border-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}