import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { refreshAccessToken } from '../api/axiosInstance';
import { loginApi, logoutApi } from '../api/auth.api';
import { tokenManager } from '../api/tokenManager';

import type {
  AuthUser,
  LoginRequest,
} from '../types/auth.types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session using the HTTP-only refresh cookie.
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { user: authenticatedUser } = await refreshAccessToken();

        if (authenticatedUser.role !== 'BRANCH_ADMIN') {
          throw new Error('Branch Admin access required');
        }

        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch {
        tokenManager.clearToken();

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
    const response = await loginApi(credentials);
    const authenticatedUser = response.data.user;

    if (authenticatedUser.role !== 'BRANCH_ADMIN') {
      try {
        await logoutApi();
      } finally {
        tokenManager.clearToken();
      }

      throw new Error(
        'Access denied. Branch Admin account required.',
      );
    }

    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      tokenManager.clearToken();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
