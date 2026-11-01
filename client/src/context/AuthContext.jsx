import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';
import { socket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(tokenStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if we have a token, verify it's still valid by fetching /auth/me.
  // This catches the case where a token expired while the tab was closed.
  useEffect(() => {
    const bootstrap = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authService.getMe();
        setUser(res.data);
        tokenStorage.setSession({ user: res.data });
        socket.connect();
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const { accessToken, refreshToken, user: loggedInUser } = res.data;
    tokenStorage.setSession({ accessToken, refreshToken, user: loggedInUser });
    setUser(loggedInUser);
    socket.connect();
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await authService.logout(refreshToken);
    } catch {
      // even if the API call fails, clear local state so the user isn't stuck
    }
    tokenStorage.clear();
    setUser(null);
    socket.disconnect();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};