import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock, Mail, User, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/story');
      }
    });
  }, [navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (!isLogin) {
        nameSchema.parse(firstName);
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account Exists',
            description: 'This email is already registered. Please sign in instead.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast({
          title: 'Welcome to the Vault!',
          description: 'Your account has been created successfully.',
        });
        navigate('/story');
      }
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid Credentials',
            description: 'Email or password is incorrect. Please try again.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        toast({
          title: 'Welcome Back!',
          description: 'You have successfully signed in.',
        });
        navigate('/story');
      }
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vault-dark-gray via-background to-vault-dark-gray flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 text-vault-gold hover:text-vault-gold hover:bg-vault-gold/10 border border-vault-gold/20"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md bg-vault-dark-gray/80 backdrop-blur-xl border-vault-gold/30 shadow-2xl relative z-10">
        <CardHeader className="space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-vault-gold to-vault-gold/60 rounded-full flex items-center justify-center shadow-xl shadow-vault-gold/20 animate-glow">
            <Shield className="h-10 w-10 text-vault-black" />
          </div>
          <CardTitle className="text-3xl font-black text-center text-vault-gold uppercase tracking-widest">
            {isLogin ? 'Enter Vault' : 'Join Vault'}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {isLogin
              ? 'Sign in to access your photo vault'
              : 'Create your account to secure your photos'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-vault-gold font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={!isLogin}
                    className="bg-vault-mid-gray/30 border-vault-mid-gray text-foreground placeholder:text-muted-foreground focus:border-vault-gold focus:ring-vault-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-vault-gold font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Last Name (Optional)
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-vault-mid-gray/30 border-vault-mid-gray text-foreground placeholder:text-muted-foreground focus:border-vault-gold focus:ring-vault-gold"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-vault-gold font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-vault-mid-gray/30 border-vault-mid-gray text-foreground placeholder:text-muted-foreground focus:border-vault-gold focus:ring-vault-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-vault-gold font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-vault-mid-gray/30 border-vault-mid-gray text-foreground placeholder:text-muted-foreground focus:border-vault-gold focus:ring-vault-gold"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-vault-gold via-vault-gold/90 to-vault-gold text-vault-black font-black text-lg py-6 hover:shadow-xl hover:shadow-vault-gold/30 transition-all duration-300 uppercase tracking-widest"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <Separator className="my-6 bg-vault-mid-gray" />

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-vault-gold hover:text-vault-gold hover:bg-vault-gold/10 font-semibold"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
