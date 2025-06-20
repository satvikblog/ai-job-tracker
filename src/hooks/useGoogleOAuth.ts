import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface GoogleOAuthConfig {
  clientId: string;
  apiKey: string;
  scope: string;
}

interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope: string;
}

export function useGoogleOAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authInstance, setAuthInstance] = useState<any>(null);
  const [config, setConfig] = useState<GoogleOAuthConfig | null>(null);

  useEffect(() => {
    initializeGoogleAPI();
    loadUserOAuthStatus();
  }, []);

  const initializeGoogleAPI = async () => {
    try {
      // Load Google API script if not already loaded
      if (!window.gapi) {
        await loadGoogleAPIScript();
      }

      // Initialize GAPI
      await new Promise((resolve) => {
        window.gapi.load('auth2', resolve);
      });

      // Auto-detect or use environment variables for Google credentials
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

      // If not in environment, try to get from user settings or use defaults
      if (!clientId || !apiKey) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: settings } = await supabase
            .from('user_settings')
            .select('google_client_id')
            .eq('user_id', user.id)
            .single();

          if (settings?.google_client_id) {
            clientId = settings.google_client_id;
          }
        }

        // Use default development credentials if still not found
        if (!clientId) {
          console.warn('No Google Client ID found. Please configure VITE_GOOGLE_CLIENT_ID in your environment variables.');
          toast.error('Google integration not configured. Please check your environment variables.');
          return;
        }
        if (!apiKey) {
          console.warn('No Google API Key found. Please configure VITE_GOOGLE_API_KEY in your environment variables.');
          toast.error('Google integration not configured. Please check your environment variables.');
          return;
        }
      }

      const authConfig = {
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/gmail.readonly profile email'
      };

      const auth2 = await window.gapi.auth2.init(authConfig);
      setAuthInstance(auth2);
      
      setConfig({
        clientId,
        apiKey,
        scope: authConfig.scope
      });

      // Check if user is already signed in
      if (auth2.isSignedIn.get()) {
        const user = auth2.currentUser.get();
        await handleAuthSuccess(user);
      }

    } catch (error) {
      console.error('Failed to initialize Google API:', error);
    }
  };

  const loadGoogleAPIScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  };

  const loadUserOAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      // Handle the case where no token exists
      if (error) {
        if (error.code === 'PGRST116') {
          // No token found, user is not authenticated
          setIsAuthenticated(false);
          return;
        }
        console.error('Error loading OAuth status:', error);
        return;
      }

      if (tokens && tokens.access_token) {
        // Check if token is still valid
        const isExpired = tokens.expires_at ? new Date(tokens.expires_at) < new Date() : false;
        setIsAuthenticated(!isExpired);
      }
    } catch (error) {
      console.error('Error loading OAuth status:', error);
    }
  };

  const requestGooglePermissions = async (): Promise<boolean> => {
    if (!authInstance || !config) {
      toast.error('Google API not initialized. Please check your configuration.');
      return false;
    }

    setLoading(true);
    try {
      // Sign in with Google
      const user = await authInstance.signIn({
        scope: config.scope
      });

      if (user.isSignedIn()) {
        await handleAuthSuccess(user);
        toast.success('Successfully connected to Google!');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      toast.error(`Failed to connect to Google: ${error.error || error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated with Supabase');
      }

      const authResponse = user.getAuthResponse(true);
      const profile = user.getBasicProfile();

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + (authResponse.expires_in * 1000));

      // Store OAuth token in database
      const { error } = await supabase.rpc('store_oauth_token', {
        p_user_id: currentUser.id,
        p_provider: 'google',
        p_access_token: authResponse.access_token,
        p_refresh_token: authResponse.refresh_token || null,
        p_expires_at: expiresAt.toISOString(),
        p_scope: authResponse.scope
      });

      if (error) throw error;

      // Update user settings with Google credentials
      await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          google_oauth_enabled: true,
          google_client_id: config?.clientId,
          gmail_integration_enabled: true
        });

      // Update profile with Google info if needed
      await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email!,
          full_name: profile.getName() || currentUser.user_metadata?.full_name || '',
          avatar_url: profile.getImageUrl() || null
        });

      setIsAuthenticated(true);

      // Initialize Gmail API
      await initializeGmailAPI();

    } catch (error: any) {
      console.error('Error storing OAuth token:', error);
      toast.error('Failed to save Google authentication');
    }
  };

  const initializeGmailAPI = async () => {
    try {
      await new Promise((resolve) => {
        window.gapi.load('client', resolve);
      });

      await window.gapi.client.init({
        apiKey: config?.apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
      });

      console.log('Gmail API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gmail API:', error);
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tokenData, error } = await supabase.rpc('get_oauth_token', {
        p_user_id: user.id,
        p_provider: 'google'
      });

      // Handle the case where no token exists (PGRST116 error)
      if (error) {
        if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
          // No token found, return null gracefully
          return null;
        }
        // For other errors, log and return null
        console.error('Error getting OAuth token:', error);
        return null;
      }

      if (!tokenData || tokenData.length === 0) return null;

      const token = tokenData[0];
      
      // If token is expired, try to refresh it
      if (token.is_expired && token.refresh_token) {
        return await refreshToken(token.refresh_token);
      }

      return token.is_expired ? null : token.access_token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  };

  const refreshToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config?.clientId || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Store the new token
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
        
        await supabase.rpc('store_oauth_token', {
          p_user_id: user.id,
          p_provider: 'google',
          p_access_token: data.access_token,
          p_refresh_token: refreshToken,
          p_expires_at: expiresAt.toISOString(),
          p_scope: data.scope || config?.scope
        });
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const revokeAccess = async () => {
    try {
      if (authInstance) {
        await authInstance.signOut();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Remove OAuth tokens
        await supabase
          .from('oauth_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'google');

        // Update user settings
        await supabase
          .from('user_settings')
          .update({
            google_oauth_enabled: false,
            gmail_integration_enabled: false
          })
          .eq('user_id', user.id);
      }

      setIsAuthenticated(false);
      toast.success('Google access revoked successfully');
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke Google access');
    }
  };

  return {
    isAuthenticated,
    loading,
    config,
    requestGooglePermissions,
    revokeAccess,
    getValidToken,
    initializeGmailAPI
  };
}