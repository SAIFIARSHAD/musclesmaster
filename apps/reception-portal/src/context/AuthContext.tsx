import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  loginApi,
  logoutApi,
  getReceptionBranchApi,
} from '../api/auth.api';

import type { AuthUser } from '../api/axiosInstance';
import type { ReceptionBranch } from '../api/auth.api';

import { refreshAccessToken } from '../api/axiosInstance';
import { tokenManager } from '../api/tokenManager';

interface AuthContextType {
  user: AuthUser | null;
  branch: ReceptionBranch | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [branch, setBranch] = useState<ReceptionBranch | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBranch = useCallback(async () => {
    try {
      const branchData = await getReceptionBranchApi();
      setBranch(branchData);
    } catch (error) {
      console.error('Unable to load reception branch:', error);
      setBranch(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginApi({ email, password });

    const { accessToken, user: loggedInUser } = response.data;

    // Only Reception users can access this portal.
    if (loggedInUser.role !== 'RECEPTION') {
      try {
        await logoutApi();
      } catch {
        tokenManager.clearToken();
      }

      throw new Error(
        'This portal is only accessible to Reception staff.',
      );
    }

    if (!loggedInUser.branchId) {
      try {
        await logoutApi();
      } catch {
        tokenManager.clearToken();
      }

      throw new Error(
        'No branch is assigned to your account. Please contact your Branch Admin.',
      );
    }

    tokenManager.setToken(accessToken);
    setUser(loggedInUser);

    await loadBranch();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      tokenManager.clearToken();
      setUser(null);
      setBranch(null);
    }
  };

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const result = await refreshAccessToken();

        if (result.user.role !== 'RECEPTION' || !result.user.branchId) {
          await logoutApi();
          return;
        }

        if (!active) return;

        setUser(result.user);

        try {
          const branchData = await getReceptionBranchApi();

          if (active) {
            setBranch(branchData);
          }
        } catch (error) {
          console.error('Unable to load assigned branch:', error);
        }
      } catch {
        tokenManager.clearToken();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const handleSessionExpired = () => {
      setUser(null);
      setBranch(null);
      tokenManager.clearToken();
    };

    window.addEventListener(
      'auth:session-expired',
      handleSessionExpired,
    );

    initializeAuth();

    return () => {
      active = false;

      window.removeEventListener(
        'auth:session-expired',
        handleSessionExpired,
      );
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        branch,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}