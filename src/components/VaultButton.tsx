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
        className="fixed top-6 left-6 z-50 bg-vault-dark-gray/80 backdrop-blur-sm border-2 border-vault-gold/30 text-vault-gold hover:bg-vault-gold/20 hover:border-vault-gold/50 transition-all duration-300"
        disabled
      >
        <Shield className="mr-2 h-5 w-5" />
        <span className="font-bold tracking-wider">Loading...</span>
      </Button>
    );
  }

  if (!user || !session) {
    return (
      <Button
        onClick={() => navigate('/auth')}
        className="fixed top-6 left-6 z-50 bg-gradient-to-r from-vault-gold via-vault-gold/90 to-vault-gold text-vault-black font-black text-lg px-8 py-6 rounded-lg shadow-2xl hover:shadow-vault-gold/40 transform hover:scale-105 transition-all duration-300 border-2 border-vault-gold/20 animate-glow group"
      >
        <LogIn className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="tracking-widest uppercase">Enter Vault</span>
      </Button>
    );
  }

  const firstName = profile?.first_name || 'Your';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-vault-gold via-vault-gold/90 to-vault-gold text-vault-black font-black text-lg px-8 py-6 rounded-lg shadow-2xl hover:shadow-vault-gold/40 transform hover:scale-105 transition-all duration-300 border-2 border-vault-gold/20 animate-glow group"
        >
          <Shield className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
          <span className="tracking-widest uppercase">{firstName}'s Vault</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 mt-2 bg-vault-dark-gray/95 backdrop-blur-xl border-vault-gold/30 shadow-2xl"
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
