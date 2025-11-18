import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Profile {
  first_name: string;
  last_name?: string;
}

export const VaultButton = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-50 bg-vault-gold/20 backdrop-blur-md border border-vault-gold/40 text-vault-gold hover:bg-vault-gold/30 transition-all duration-300 rounded-full px-6 py-3"
        disabled
      >
        <Shield className="mr-2 h-4 w-4" />
        <span className="font-semibold tracking-wide text-sm">Loading...</span>
      </Button>
    );
  }

  if (!user || !session) {
    return (
      <Button
        onClick={() => navigate('/auth')}
        className="absolute top-6 left-6 z-50 bg-vault-gold/30 backdrop-blur-md border border-vault-gold/60 hover:bg-vault-gold/40 transition-all duration-300 rounded-full px-8 py-3 group shadow-lg shadow-black/30"
      >
        <LogIn className="mr-2 h-4 w-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
        <span className="tracking-wide uppercase text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Connect Your Photos</span>
      </Button>
    );
  }

  const firstName = profile?.first_name || 'Your';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="absolute top-6 left-6 z-50 bg-vault-gold/30 backdrop-blur-md border border-vault-gold/60 hover:bg-vault-gold/40 transition-all duration-300 rounded-full px-8 py-3 shadow-lg shadow-black/30"
        >
          <Shield className="mr-2 h-4 w-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
          <span className="tracking-wide uppercase text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{firstName}'s Vault</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 mt-2 bg-vault-dark-gray/98 backdrop-blur-xl border-vault-gold/30 shadow-2xl z-[100]"
      >
        <div className="px-4 py-3 border-b border-vault-gold/20">
          <p className="text-sm font-bold text-vault-gold uppercase tracking-wider">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {user.email}
          </p>
        </div>
        
        <DropdownMenuItem
          onClick={() => navigate('/settings')}
          className="cursor-pointer text-foreground hover:text-vault-gold hover:bg-vault-mid-gray/50 py-3"
        >
          <User className="mr-3 h-4 w-4" />
          <span className="font-semibold">Account Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-vault-gold/20" />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 py-3"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-semibold">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
