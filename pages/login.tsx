import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase'; // Assumes your client is initialized here
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Chrome, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is already logged in, redirect them to home if they are
  useEffect(() => {
    async function checkUserSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/');
      }
    }
    checkUserSession();
  }, [router]);

  // Handle traditional Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Send the user to the dashboard feed upon successful validation
      router.push('/');
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Third-Party Google OAuth via Supabase
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
        // Detect if the app is running on Vercel or locally
        const redirectUrl = typeof window !== 'undefined' 
        ? (window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/' 
            : 'https://konek-flamefoundation.vercel.app/')
        : undefined;

        const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
        },
        });

        if (error) throw error;
    } catch (error: any) {
        setErrorMessage(error.message || 'Failed to initialize Google login.');
        setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login / Konek</title>
        <meta name="description" content="Log in to your Konek account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center border-x border-border px-4 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 p-6 md:p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-md shadow-xl">
          
          {/* Brand/Logo Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text">
              Konek
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back. Connect with the future of web design.
            </p>
          </div>

          {/* Error Notice Display Banner */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in-50 duration-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Main Auth Interaction Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-secondary/30 border-border rounded-xl focus-visible:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-secondary/30 border-border rounded-xl focus-visible:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-semibold transition-all mt-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Sign In'}
            </Button>
          </form>

          {/* Decorative Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Provider Auth Container */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold border-border bg-secondary/10 hover:bg-secondary/40 transition-all flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Chrome className="h-5 w-5 text-foreground" />
            <span>Sign in with Google</span>
          </Button>

          {/* Footer Navigation Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="#" className="text-primary font-medium hover:underline">
              Create an account
            </a>
          </p>

        </div>
      </div>
    </>
  );
}