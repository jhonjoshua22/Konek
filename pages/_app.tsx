import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import '@/app/globals.css';
import Layout from '@/components/layout/Layout';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    // Immediate check on mount to catch unauthenticated users quickly
    async function checkInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isLoginPage) {
        window.location.href = 'https://konek-flamefoundation.vercel.app/login';
      }
    }
    checkInitialSession();

    // Listen for authentication changes (such as returning from the Google OAuth flow or logging out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Intercept and strip the messy access token hashes from the address bar cleanly
        router.replace(router.pathname, undefined, { shallow: true });
      }

      // If a user session drops or is missing and they aren't on the login page, redirect them
      if (!session && !isLoginPage) {
        window.location.href = 'https://konek-flamefoundation.vercel.app/login';
      }
    });

    // Clean up the stream listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [router, isLoginPage]);

  // If it's the login page, render the component directly without any global layout/sidebars
  if (isLoginPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}