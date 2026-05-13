import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  initDB,
  createUser as dbCreateUser, 
  getUserByEmail as dbGetUserByEmail,
  updateUserSettings as dbUpdateSettings,
  getFirstUser as dbGetFirstUser
} from '../../database/db';
import { ConvexaColors, ConvexaLightColors, ThemeColors } from '../theme/colors';

interface UserSettings {
  voice: string;
  speechSpeed: number;
  isDark: boolean;
}

interface User {
  id: number;
  name: string;
  settings: UserSettings;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  onboard: (name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  colors: ThemeColors;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  onboard: async () => ({ success: false }),
  logout: () => {},
  updateSettings: async () => {},
  colors: ConvexaColors,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatDbUser = (dbUser: any): User => ({
    id: dbUser.id,
    name: dbUser.name,
    settings: {
      voice: dbUser.voice || 'Aura',
      speechSpeed: dbUser.speech_speed !== undefined ? dbUser.speech_speed : 1.0,
      isDark: dbUser.is_dark !== undefined ? dbUser.is_dark === 1 : true,
    }
  });

  // Auto-load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        await initDB(); // Ensure tables exist before querying
        const dbUser = await dbGetFirstUser();
        if (dbUser) {
          setUser(formatDbUser(dbUser));
          console.log('[UserContext] Loaded user:', dbUser.name);
        }
      } catch (e) {
        console.log('[UserContext] Load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const onboard = useCallback(async (name: string) => {
    try {
      const newUser = await dbCreateUser(name);
      if (newUser) {
        setUser({
          id: newUser.id,
          name: newUser.name,
          settings: { voice: 'Aura', speechSpeed: 1.0, isDark: true }
        });
        console.log('[Auth] Onboarding success:', name);
        return { success: true };
      }
      return { success: false, error: 'Failed to save username.' };
    } catch (e) {
      console.log('[Auth] Onboarding error:', e);
      return { success: false, error: 'Onboarding failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    console.log('[Auth] Logged out');
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    
    // Optimistic UI update
    setUser(prev => prev ? { 
      ...prev, 
      settings: { ...prev.settings, ...newSettings } 
    } : null);
    
    // Save to DB
    await dbUpdateSettings(user.id, newSettings as any);
  }, [user]);

  const activeColors = user?.settings?.isDark === false ? ConvexaLightColors : ConvexaColors;

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isLoading,
        onboard,
        logout,
        updateSettings,
        colors: activeColors,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
