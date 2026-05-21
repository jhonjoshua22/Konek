'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import RightSidebar from './RightSidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="lg:ml-64 xl:mr-80">
        <main className="min-h-screen pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      
      {/* Right Sidebar - Desktop Only */}
      <RightSidebar />
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
