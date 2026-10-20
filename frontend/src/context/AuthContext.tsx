import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser, login as loginApi, logout as logoutApi, type CurrentUser } from "../api/auth.api";

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

  useEffect(() => {
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
    const requestId = ++authRequest.current;
    try {
      await loginApi(email, password);
      const { data } = await getCurrentUser();
      if (requestId !== authRequest.current) return;
      setUser(data);
      setIsAuth(true);
    } finally {
      if (requestId === authRequest.current) setReady(true);
    }
  };

  const logout = async () => {
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
