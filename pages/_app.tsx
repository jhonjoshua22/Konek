import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import '@/app/globals.css';
import Layout from '@/components/layout/Layout';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Listen for authentication changes (such as returning from the Google OAuth flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Intercept and strip the messy access token hashes from the address bar cleanly
        router.replace(router.pathname, undefined, { shallow: true });
      }
    });

    // Clean up the stream listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}