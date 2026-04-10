import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { API } from "@/lib/api";
import {
  AuthUser,
  clearStoredSession,
  fetchCurrentUser,
  getApiErrorMessage,
  getStoredToken,
  getStoredUser,
  getAuthHeaders,
  readApiResponse,
  setStoredToken,
  setStoredUser,
} from "@/lib/auth";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (nextUser: AuthUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  };

  const updateUser = (nextUser: AuthUser) => {
    setStoredUser(nextUser);
    setUser(nextUser);
  };

  const syncUserFromToken = async (tokenToSync: string) => {
    const currentUser = await fetchCurrentUser(tokenToSync);
    updateUser(currentUser);
    setToken(tokenToSync);
    return currentUser;
  };

  useEffect(() => {
    let isActive = true;

    const hydrateSession = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        if (isActive) {
          clearSession();
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(storedToken);

        if (!isActive) {
          return;
        }

        setToken(storedToken);
        updateUser(currentUser);
      } catch {
        if (isActive) {
          clearSession();
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Login failed."));
      }

      const nextToken = payload?.token;

      if (!nextToken) {
        throw new Error("Login succeeded but no token was returned.");
      }

      setStoredToken(nextToken);
      return await syncUserFromToken(nextToken);
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const activeToken = token ?? getStoredToken();

    try {
      if (activeToken) {
        await fetch(`${API}/api/auth/logout`, {
          method: "POST",
          headers: getAuthHeaders(activeToken),
        });
      }
    } finally {
      clearSession();
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const activeToken = token ?? getStoredToken();

    if (!activeToken) {
      clearSession();
      return null;
    }

    setIsLoading(true);

    try {
      return await syncUserFromToken(activeToken);
    } catch {
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        refreshUser,
        updateUser,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
