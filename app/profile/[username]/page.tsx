import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import UserProfileClient from '@/components/UserProfileClient';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Fetch profile data directly on the server
  const { data: userData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodeURIComponent(username))
    .single();

  if (error || !userData) notFound();

  return <UserProfileClient initialProfile={userData} />;
}