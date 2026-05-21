import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ViewOnlyProfilePage from '@/components/ViewOnlyProfilePage';

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // 1. Get the user ID from the username
  const { data: userData, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', decodeURIComponent(username))
    .single();

  if (error || !userData) notFound();

  // 2. Render the client component, passing the userId
  return <ViewOnlyProfilePage userId={userData.id} />;
}