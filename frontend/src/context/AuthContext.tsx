import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser, login as loginApi, logout as logoutApi, type CurrentUser } from "../api/auth.api";
import { getSupabaseClient, isSupabaseAuthConfigured, usesHostedSupabaseAuth } from "../api/supabaseClient";

interface AuthContextType {
  isAuth: boolean;
  ready: boolean;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const authRequest = useRef(0);
  const authOperation = useRef(0);

  useEffect(() => {
    if (usesHostedSupabaseAuth) {
      if (!isSupabaseAuthConfigured) {
        setReady(true);
        return;
      }
      const client = getSupabaseClient();
      let alive = true;
      const refreshProfile = (requestId: number) => {
        void getCurrentUser()
          .then(({ data }) => {
            if (!alive || requestId !== authRequest.current) return;
            setUser(data);
            setIsAuth(true);
          })
          .catch(() => {
            if (!alive || requestId !== authRequest.current) return;
            setUser(null);
            setIsAuth(false);
          })
          .finally(() => {
            if (alive && requestId === authRequest.current) setReady(true);
          });
      };
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED") return;
        const requestId = ++authRequest.current;
        if (!session) {
          if (event === "SIGNED_OUT") authOperation.current += 1;
          setUser(null);
          setIsAuth(false);
          setReady(true);
          return;
        }
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
          // Do not await another Supabase operation from inside this callback.
          window.setTimeout(() => { if (alive && requestId === authRequest.current) refreshProfile(requestId); }, 0);
        } else {
          setReady(true);
        }
      });
      return () => {
        alive = false;
        authRequest.current += 1;
        subscription.unsubscribe();
      };
    }

    const requestId = ++authRequest.current;
    getCurrentUser()
      .then(({ data }) => {
        if (requestId !== authRequest.current) return;
        setIsAuth(true);
        setUser(data);
      })
      .catch(() => {
        if (requestId !== authRequest.current) return;
        setIsAuth(false);
        setUser(null);
      })
      .finally(() => {
        if (requestId === authRequest.current) setReady(true);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const operationId = ++authOperation.current;
    let requestId = ++authRequest.current;
    try {
      await loginApi(email, password);
      if (operationId !== authOperation.current) return;
      // SIGNED_IN may start a profile refresh. The explicit login owns the profile
      // request it awaits before the caller navigates to a protected destination.
      requestId = ++authRequest.current;
      const { data } = await getCurrentUser();
      if (operationId !== authOperation.current || requestId !== authRequest.current) return;
      setUser(data);
      setIsAuth(true);
    } finally {
      if (requestId === authRequest.current) setReady(true);
    }
  };

  const logout = async () => {
    authOperation.current += 1;
    const requestId = ++authRequest.current;
    try {
      await logoutApi();
      if (requestId !== authRequest.current) return;
      setIsAuth(false);
      setUser(null);
    } finally {
      if (requestId === authRequest.current) setReady(true);
    }
  };

  return <AuthContext.Provider value={{ isAuth, ready, user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
